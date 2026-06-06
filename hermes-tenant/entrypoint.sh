#!/usr/bin/env bash
set -euo pipefail

# Неинтерактивная настройка Hermes из переменных окружения, которые control-plane
# прокидывает при `docker run` (см. api/provisioning/hermes-config.ts), и запуск
# Telegram-gateway в foreground (чтобы Docker управлял жизненным циклом процесса).
#
# ВНИМАНИЕ: точные имена подкоманд Hermes CLI стоит сверить с текущей версией
# (`hermes --help`, `hermes config --help`, `hermes gateway --help`) при первой
# сборке образа — здесь использованы команды из документации Hermes Agent 2026.

: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${HERMES_MODEL:=deepseek/deepseek-chat}"

export HERMES_DATA_DIR="${HERMES_DATA_DIR:-/data}"

echo "[entrypoint] configuring Hermes for tenant ${HERMES_TENANT_ID:-?} (model ${HERMES_MODEL})"

# Провайдер модели — OpenRouter (OpenAI-совместимый эндпоинт).
hermes config set provider openrouter
hermes config set openrouter.api_key "${OPENROUTER_API_KEY}"
hermes config set model "${HERMES_MODEL}"

# Messaging gateway → Telegram.
hermes config set gateway.telegram.token "${TELEGRAM_BOT_TOKEN}"

# Доступы к интеграциям источников данных (например, iiko) приходят как
# INTEGRATION_* — пробрасываем их в окружение скиллов агента как есть.
# (Hermes-скилл/задача читает их из env внутри контейнера.)

echo "[entrypoint] starting Telegram gateway"
exec hermes gateway start --platform telegram
