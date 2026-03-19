---
description: 'Use when creating or editing React components, pages, or UI code. Covers SWR data fetching, context usage, i18n, and Tailwind styling.'
applyTo: 'src/**'
---

# Frontend Component Conventions

## Data Fetching

- Use SWR for all client-side data: `useSWR<Type>('/api/v1/...')`
- Never use `fetch` or `axios` directly in components
- Mutate SWR cache after writes: `mutate('/api/v1/...')`

## State Management

- Use existing contexts from `src/context/` — no Redux or external state libraries
- Access via hooks: `useSettings()`, `useUser()`, `useLocale()`, `useNotifications()`
- Custom hooks in `src/hooks/` wrap context and SWR calls

## Internationalization

- All user-visible strings must use `react-intl`: `intl.formatMessage({ id: 'key' })`
- Use `useLocale()` hook for the `intl` instance
- Extract new keys with `yarn i18n:extract` after adding strings

## Styling

- Tailwind CSS only — no inline styles or CSS modules
- Use `tailwindcss/nesting` for complex selectors in CSS files
- Tailwind classes are auto-sorted by Prettier plugin

## Imports

- Path aliases only: `@app/*` for `src/`, `@server/*` for `server/`
- No relative imports (enforced by ESLint)
- Use `type` keyword for type-only imports: `import type { X } from '...'`
