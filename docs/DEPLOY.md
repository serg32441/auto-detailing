# Деплой Hermes-as-a-Service на Ubuntu/Debian VPS

CI/CD: пуш в `main` → GitHub Actions заходит на сервер по SSH и запускает
`deploy/deploy.sh` (pull → build → restart). Доступы хранятся в GitHub Secrets.

## ⚡ Быстрый старт «одной командой»

На чистом Ubuntu/Debian VPS под root:

```bash
sudo apt-get update && sudo apt-get install -y git \
  && sudo git clone https://github.com/serg32441/auto-detailing.git /srv/app \
  && sudo bash /srv/app/deploy/server-setup.sh
```

Скрипт поставит Node 20, Docker, nginx, MySQL, соберёт образ агента и
остановится с просьбой заполнить `/srv/app/.env`. Заполни секреты и запусти
ещё раз — он соберёт проект и поднимет сервисы:

```bash
sudo bash /srv/app/deploy/server-setup.sh
```

После этого останется только nginx + HTTPS и вебхук ЮKassa (шаги 4 и 6 ниже).
Ручная пошаговая установка — дальше по документу.

## 0. Что будет крутиться на сервере

| Сервис | Что делает | systemd |
|--------|------------|---------|
| control-plane API + сайт | tRPC, вебхук ЮKassa, лендинг/оферта, панель | `hermes-api.service` |
| control-бот | онбординг в Telegram (long polling) | `hermes-bot.service` |
| billing-воркер | триалы + автоплатежи (раз в час) | `hermes-billing.timer` |
| контейнеры клиентов | по одному Hermes на клиента | Docker |

## 1. Подготовка сервера (один раз)

```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx mysql-server
# Docker (для агентов клиентов)
curl -fsSL https://get.docker.com | sudo sh

# Пользователь деплоя
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
```

БД: создай базу и пользователя в MySQL, запиши строку подключения в `DATABASE_URL`.

## 2. Клонирование и первичная сборка

```bash
sudo mkdir -p /srv/app && sudo chown deploy:deploy /srv/app
sudo -u deploy git clone https://github.com/serg32441/auto-detailing.git /srv/app
cd /srv/app
sudo -u deploy npm ci
```

Создай `/srv/app/.env` из `.env.example` и заполни (БД, `SECRETS_MASTER_KEY`,
`CONTROL_BOT_TOKEN`, цены, `PUBLIC_BASE_URL=https://<домен>`, `YOOKASSA_*`,
`SUPPORT_CONTACT`, `OWNER_UNION_ID`).

```bash
sudo -u deploy bash -lc 'cd /srv/app && RUN_MIGRATE=1 npm run db:push && npm run build'
# Образ агента клиента:
sudo -u deploy docker build -t hermes-tenant:latest /srv/app/hermes-tenant
```

## 3. systemd-сервисы

```bash
sudo cp /srv/app/deploy/systemd/hermes-*.service /srv/app/deploy/systemd/hermes-*.timer /etc/systemd/system/
# проверь User / WorkingDirectory / пути в скопированных юнитах
sudo visudo -f /etc/sudoers.d/hermes   # см. ниже — право рестартовать сервисы без пароля
sudo systemctl daemon-reload
sudo systemctl enable --now hermes-api hermes-bot hermes-billing.timer
```

Чтобы `deploy.sh` мог рестартовать сервисы без пароля, добавь в
`/etc/sudoers.d/hermes`:

```
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart hermes-api hermes-bot
```

## 4. nginx + TLS

```bash
sudo cp /srv/app/deploy/nginx/hermes.conf /etc/nginx/sites-available/hermes
# впиши свой server_name
sudo ln -s /etc/nginx/sites-available/hermes /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
```

Теперь `PUBLIC_BASE_URL=https://app.example.com`, а вебхук ЮKassa —
`https://app.example.com/api/yookassa/webhook`.

## 5. GitHub Secrets (для авто-деплоя)

Сгенерируй deploy-ключ и положи публичную часть на сервер:

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
ssh-copy-id -i deploy_key.pub deploy@<server-ip>   # или вручную в ~deploy/.ssh/authorized_keys
```

В репозитории → Settings → Secrets and variables → Actions добавь:

| Secret | Значение |
|--------|----------|
| `SSH_HOST` | IP/домен сервера |
| `SSH_USER` | `deploy` |
| `SSH_KEY` | содержимое приватного `deploy_key` |
| `SSH_PORT` | `22` (если нестандартный — укажи) |
| `DEPLOY_PATH` | `/srv/app` |

После этого любой пуш в `main` (или ручной запуск workflow «Deploy») обновит
сервер.

> **Активация workflow.** Готовый файл лежит в `deploy/ci-deploy.yml`. Его нужно
> положить в `.github/workflows/deploy.yml` — но GitHub запрещает пушить файлы
> workflow токеном без scope `workflow`. Поэтому добавь его одним из способов:
> 1. Через веб-интерфейс GitHub: Add file → Create new file →
>    `.github/workflows/deploy.yml` → вставь содержимое `deploy/ci-deploy.yml`.
> 2. Либо создай classic PAT со scope `repo` + `workflow` и запушь файл по пути
>    `.github/workflows/deploy.yml`.

> Сейчас разработка идёт в ветке `claude/festive-lamport-bFwTl`. Слей её в `main`
> (через PR), чтобы заработал авто-деплой, либо поменяй ветку-триггер в workflow.

## 6. Запуск в работу

1. Зайди на сайт под своим аккаунтом — пользователь с `OWNER_UNION_ID` получит
   роль admin.
2. Открой панель `/#/hermes` → добавь Telegram-ботов в пул (кнопка «Добавить
   бота», токены из @BotFather).
3. В ЮKassa: Разработчики → Webhooks → добавь
   `https://<домен>/api/yookassa/webhook` (события `payment.succeeded`,
   `payment.canceled`).
4. Напиши control-боту `/start` — пройди онбординг и проверь весь поток.

## 7. Логи и обслуживание

```bash
journalctl -u hermes-api -f
journalctl -u hermes-bot -f
systemctl list-timers hermes-billing.timer
docker ps                      # контейнеры клиентов
docker logs hermes-tenant-1    # логи агента клиента
```
