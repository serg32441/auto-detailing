#!/bin/bash
# Скрипт для загрузки проекта на GitHub

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================"
echo "  Загрузка проекта на GitHub"
echo "========================================"
echo ""

# Проверяем наличие git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен. Установи его:"
    echo "   Ubuntu/Debian: sudo apt install git"
    echo "   macOS: brew install git"
    echo "   Windows: https://git-scm.com/download/win"
    exit 1
fi

# Проверяем авторизацию на GitHub
echo "🔍 Проверка авторизации на GitHub..."
if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI не авторизован."
    echo ""
    echo "   Вариант 1 — Через GitHub CLI (рекомендуется):"
    echo "   1. Установи gh: https://cli.github.com/"
    echo "   2. Выполни: gh auth login"
    echo ""
    echo "   Вариант 2 — Через токен:"
    echo "   1. Создай токен: https://github.com/settings/tokens"
    echo "   2. Выполни: git remote add origin https://ТВОЙ_ТОКЕН@github.com/ТВОЙ_НИК/ИМЯ_РЕПО.git"
    echo ""
fi

# Спрашиваем имя репозитория
read -p "Введи имя репозитория на GitHub (например: auto-detailing): " REPO_NAME

if [ -z "$REPO_NAME" ]; then
    echo "❌ Имя репозитория не может быть пустым"
    exit 1
fi

read -p "Введи свой GitHub username: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Username не может быть пустым"
    exit 1
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "📦 Подключение к: ${REMOTE_URL}"
echo ""

# Удаляем старый remote если есть
git remote remove origin 2>/dev/null || true

# Добавляем remote
git remote add origin "$REMOTE_URL"

echo "📤 Отправка кода на GitHub..."
echo ""

# Пушим
git push -u origin main

echo ""
echo "========================================"
echo "  ✅ Проект загружен на GitHub!"
echo "========================================"
echo ""
echo "   🌐 ${REMOTE_URL}"
echo ""
