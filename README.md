# Модуль «Сверка планов БТИ» для amoCRM

Этот репозиторий, помимо веб‑приложения, содержит модуль для amoCRM, который
сравнивает две схемы помещения (план БТИ и вашу схему) и определяет, совпадают
ли планировки.

**Состав модуля**

| Часть | Где | Назначение |
| --- | --- | --- |
| Эндпоинт сравнения | `api/bti/` (`POST /api/bti/compare`) | Гибрид: дешёвый префильтр + ИИ‑сверка через OpenRouter |
| Веб‑интерфейс | `src/pages/BtiCompare.tsx` (маршрут `/#/bti`) | Загрузка двух картинок и вывод вердикта |
| Префильтр в браузере | `src/lib/imageHash.ts` | Perceptual hash: идентичные картинки → ответ без ИИ |
| Виджет amoCRM | `amocrm-widget/` | Пакет для установки в amoCRM (встраивает инструмент) |

Подробная инструкция по установке и настройке — в
[`amocrm-widget/README.md`](amocrm-widget/README.md). Переменные окружения
(`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `BTI_API_TOKEN`, `BTI_PUBLIC_URL`) —
в `.env.example`.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
