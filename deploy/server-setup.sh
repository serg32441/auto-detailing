#!/usr/bin/env bash
#
# Установка Hermes-as-a-Service на чистый Ubuntu/Debian VPS «одной командой».
# Запускать с правами root (через sudo). Скрипт идемпотентный — можно запускать
# повторно.
#
# Первый запуск (как root):
#   sudo apt-get update && sudo apt-get install -y git \
#     && sudo git clone https://github.com/serg32441/auto-detailing.git /srv/app \
#     && sudo bash /srv/app/deploy/server-setup.sh
#
# Скрипт остановится и попросит заполнить /srv/app/.env.
# После заполнения запусти ещё раз — он соберёт и поднимет сервисы:
#   sudo bash /srv/app/deploy/server-setup.sh
#
# Переменные можно переопределить: REPO_URL, DEPLOY_PATH, DEPLOY_USER, BRANCH.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/serg32441/auto-detailing.git}"
DEPLOY_PATH="${DEPLOY_PATH:-/srv/app}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
BRANCH="${BRANCH:-claude/festive-lamport-bFwTl}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Запусти через sudo: sudo bash $0" >&2
  exit 1
fi

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }

as_deploy() { sudo -u "$DEPLOY_USER" -H bash -lc "$1"; }

# ── 1. Системные пакеты ─────────────────────────────────────────────────
log "Системные пакеты (git, nginx, MySQL, curl)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates nginx mysql-server

# ── 2. Node.js 20 ───────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 20 ]; then
  log "Установка Node.js 20…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  log "Node.js уже установлен: $(node -v)"
fi

# ── 3. Docker (для контейнеров агентов) ─────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  log "Установка Docker…"
  curl -fsSL https://get.docker.com | sh
else
  log "Docker уже установлен: $(docker -v)"
fi

# ── 4. Пользователь деплоя ──────────────────────────────────────────────
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  log "Создаю пользователя $DEPLOY_USER…"
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# ── 5. Репозиторий ──────────────────────────────────────────────────────
if [ ! -d "$DEPLOY_PATH/.git" ]; then
  log "Клонирую репозиторий в $DEPLOY_PATH…"
  mkdir -p "$DEPLOY_PATH"
  git clone "$REPO_URL" "$DEPLOY_PATH"
fi
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$DEPLOY_PATH"
log "Переключаюсь на ветку $BRANCH…"
as_deploy "cd '$DEPLOY_PATH' && git fetch --prune origin '$BRANCH' && git checkout '$BRANCH' && git reset --hard 'origin/$BRANCH'"

# ── 6. Зависимости и образ агента ───────────────────────────────────────
log "Устанавливаю зависимости (npm ci)…"
as_deploy "cd '$DEPLOY_PATH' && npm ci"

log "Собираю Docker-образ агента (hermes-tenant)…"
as_deploy "cd '$DEPLOY_PATH' && docker build -t hermes-tenant:latest hermes-tenant" || \
  echo "Предупреждение: образ агента не собрался — проверь команды в hermes-tenant/entrypoint.sh"

# ── 7. .env ─────────────────────────────────────────────────────────────
if [ ! -f "$DEPLOY_PATH/.env" ]; then
  as_deploy "cd '$DEPLOY_PATH' && cp .env.example .env"
  cat <<EOF

============================================================
ПОЧТИ ГОТОВО. Осталось заполнить секреты.

1) Отредактируй файл:  $DEPLOY_PATH/.env
   Обязательно: DATABASE_URL, SECRETS_MASTER_KEY, CONTROL_BOT_TOKEN,
   PUBLIC_BASE_URL, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY, OWNER_UNION_ID.
   Сгенерировать ключ шифрования:  openssl rand -base64 48

2) Запусти этот скрипт ещё раз — он соберёт проект и поднимет сервисы:
   sudo bash $DEPLOY_PATH/deploy/server-setup.sh
============================================================
EOF
  exit 0
fi

# ── 8. Сборка, БД, systemd (когда .env заполнен) ────────────────────────
log "Сборка проекта…"
as_deploy "cd '$DEPLOY_PATH' && npm run build"

log "Применяю схему БД (db push)…"
as_deploy "cd '$DEPLOY_PATH' && npm run db:push" || \
  echo "Предупреждение: db push не выполнился — проверь DATABASE_URL в .env"

log "Устанавливаю systemd-сервисы…"
cp "$DEPLOY_PATH"/deploy/systemd/hermes-*.service "$DEPLOY_PATH"/deploy/systemd/hermes-*.timer /etc/systemd/system/
# Право деплою рестартовать сервисы без пароля (для авто-деплоя):
echo "$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart hermes-api hermes-bot" \
  > /etc/sudoers.d/hermes
chmod 440 /etc/sudoers.d/hermes
systemctl daemon-reload
systemctl enable --now hermes-api hermes-bot hermes-billing.timer

log "Готово. Статус сервисов:"
systemctl --no-pager --lines=0 status hermes-api hermes-bot || true

cat <<EOF

============================================================
СЕРВИСЫ ПОДНЯТЫ. Финальные шаги (вручную):

• nginx + HTTPS:
    sudo cp $DEPLOY_PATH/deploy/nginx/hermes.conf /etc/nginx/sites-available/hermes
    # впиши свой домен в server_name
    sudo ln -s /etc/nginx/sites-available/hermes /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d ТВОЙ_ДОМЕН

• Вебхук ЮKassa:  https://ТВОЙ_ДОМЕН/api/yookassa/webhook
• Логи бота:      journalctl -u hermes-bot -f
• Напиши боту /start — проверь витрину с кнопками.
============================================================
EOF
