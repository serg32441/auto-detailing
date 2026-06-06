#!/usr/bin/env bash
# Серверный скрипт деплоя. Запускается из каталога проекта (DEPLOY_PATH) самим
# GitHub Actions по SSH либо вручную: `./deploy/deploy.sh`.
set -euo pipefail

BRANCH="${DEPLOY_BRANCH:-main}"
cd "$(dirname "$0")/.."

echo "==> fetch & reset to origin/${BRANCH}"
git fetch --prune origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"

echo "==> install deps"
npm ci

echo "==> build (vite + api bundle)"
npm run build

# Применение схемы БД — только если явно запрошено (RUN_MIGRATE=1), чтобы не
# трогать прод-БД на каждом деплое.
if [ "${RUN_MIGRATE:-0}" = "1" ]; then
  echo "==> db push"
  npm run db:push
fi

echo "==> restart services"
sudo systemctl restart hermes-api hermes-bot

echo "==> deployed $(git rev-parse --short HEAD)"
