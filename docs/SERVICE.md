# Hermes-as-a-Service — control-plane (MVP, тонкий срез)

Сервис, который выдаёт клиентам персонального AI-агента **Hermes Agent**
(Nous Research) в Telegram «в один клик»: клиент проходит короткий онбординг в
боте, получает свой контейнер и ссылку на личного бота-агента. За токены модели
клиент платит сам (свой ключ OpenRouter) — мы берём за удобство и управление.

## Архитектура (вариант A: Docker на нашем сервере)

```
Лендинг (React)        Control-бот (Telegram, long polling)
       │                         │  bot/control-bot.ts
       │                         ▼
       └──────────►   Control-plane API (Hono + tRPC)  ──►  MySQL (Drizzle)
                              │   api/tenant-router.ts        tenants, bot_pool
                              ▼
                      Оркестратор (docker CLI)  api/provisioning/*
                              │
                              ▼
              ┌───────────────┴───────────────┐
        hermes-tenant-1            hermes-tenant-2   ... (контейнер на клиента)
        (Hermes + Telegram gateway, OpenRouter-ключ клиента, том /data)
```

Ключевые модули:

| Файл | Назначение |
|------|-----------|
| `db/schema.ts` (`tenants`, `botPool`) | клиенты, пул ботов, зашифрованные секреты |
| `api/lib/crypto.ts` | AES-256-GCM шифрование секретов at rest |
| `api/provisioning/docker.ts` | поднять / остановить / удалить контейнер клиента |
| `api/provisioning/hermes-config.ts` | сборка env контейнера из данных tenant |
| `api/provisioning/tenant-service.ts` | жизненный цикл: онбординг, триал, suspend, cancel |
| `api/provisioning/telegram.ts` | клиент Telegram Bot API (fetch) |
| `api/tenant-router.ts` | админ-API (список клиентов, пул ботов, управление) |
| `bot/control-bot.ts` | онбординг-бот «входная дверь» |
| `bot/billing-worker.ts` | cron: приостановка истёкших триалов |
| `hermes-tenant/` | Dockerfile + entrypoint образа агента |

## Поток онбординга «в один клик»

1. Клиент жмёт Start у **control-бота** (ссылка с лендинга — deep link).
2. Бот просит **ключ OpenRouter** → сохраняем зашифрованным.
3. Бот просит **название бизнеса**.
4. `startTrial()`: берём свободного бота из пула → поднимаем контейнер Hermes →
   ставим `trialing` + `trialEndsAt` → отдаём клиенту ссылку `t.me/<bot>`.
5. Клиент общается со своим агентом. По истечении триала `billing-worker`
   переводит в `suspended` (контейнер останавливается).

## Пул ботов

У BotFather нет API для создания ботов, поэтому держим пул заранее созданных.
Добавление в пул — админ-эндпоинт `tenant.addBot` (проверяет токен через getMe и
сохраняет username + зашифрованный токен). Свободный бот назначается клиенту на
шаге 4 и возвращается в пул при `cancel`.

## Что нужно для запуска

1. **БД**: `npm run db:push` (создаст таблицы `tenants`, `bot_pool`).
2. **Env** (см. `.env.example`): `SECRETS_MASTER_KEY`, `CONTROL_BOT_TOKEN`,
   `HERMES_IMAGE`, `TENANTS_DATA_DIR`, `TRIAL_DAYS`.
3. **Образ агента**: `docker build -t hermes-tenant:latest hermes-tenant/`
   (сверь команды `hermes ...` в `entrypoint.sh` с актуальной версией CLI).
4. **Наполнить пул**: создать ботов в BotFather, добавить через `tenant.addBot`.
5. **Запустить control-plane**: `npm run build && npm start`.
6. **Запустить онбординг-бот**: `npm run bot:control`.
7. **Cron**: `npm run worker:trials` раз в час.

Для локальной разработки без Docker: `PROVISIONING_DRY_RUN=1` — контейнеры не
поднимаются, команды только логируются.

## Безопасность

- Секреты клиентов (ключ OpenRouter, доступы iiko) шифруются AES-256-GCM,
  мастер-ключ только в env control-plane.
- Контейнер агента: непривилегированный пользователь, `--memory` лимит,
  `--security-opt no-new-privileges`, **без** доступа к Docker-сокету хоста.
- Данные каждого клиента — в отдельном томе `TENANTS_DATA_DIR/<id>`.

## Экономика (ориентиры)

- **Себестоимость инфры** ~100–150 ₽/клиент/мес при ~12 контейнерах на VPS
  4 vCPU / 8 ГБ (€14 Hetzner CPX31 или ~700–1200 ₽ у RU-провайдера).
- **Inference платит клиент** своим ключом OpenRouter (центы за прогон на
  дешёвых моделях DeepSeek/Qwen/Gemini Flash).
- **Цены**: триал 5–7 дней (или 100–200 ₽ с привязкой карты), базовый
  490–990 ₽/мес, B2B (пекарня + iiko, выделенный VPS) 2000–5000 ₽/мес.

## Дальше (вне тонкого среза)

- Биллинг ЮKassa: recurring с сохранённой картой, вебхук → `resume`/`suspend`.
- Вариант C: выделенный VPS на клиента через API облака (тот же интерфейс
  оркестратора, другой бэкенд вместо `docker.ts`).
- Мастер настройки iiko прямо в боте → `setIntegrations()`.
- Админ-панель в React поверх `tenant.*` эндпоинтов.
- Перенос состояния визарда онбординга в БД и переход на вебхуки Telegram.
