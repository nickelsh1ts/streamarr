---
description: 'Use when creating or editing React components, pages, or UI code. Covers SWR data fetching, context usage, i18n, and Tailwind styling.'
applyTo: 'src/**'
---

# Frontend Component Conventions

## Data Fetching

- Use SWR for all client-side reads: `useSWR<Type>('/api/v1/...')`
- For writes (POST/PUT/PATCH/DELETE), use `axios` in event handlers or custom hooks; avoid `fetch` unless there is a specific need.
- After successful writes, update related SWR keys with `mutate('/api/v1/...')`
- Prefer domain-specific SWR hooks from `src/hooks/` over manual `useState` + `axios.get` patterns

## State Management

- Use existing contexts from `src/context/` — no Redux or external state libraries
- Access via hooks: `useSettings()`, `useUser()`, `useLocale()`, `useNotifications()`
- Custom hooks in `src/hooks/` wrap context and SWR calls

## Internationalization

- All user-visible strings must use `react-intl`: `intl.formatMessage({ id: 'key' })`
- Use `useLocale()` hook for the `intl` instance
- Extract new keys with `pnpm i18n:extract` after adding strings

## Styling

- Tailwind CSS only — no inline styles or CSS modules
- Use `tailwindcss/nesting` for complex selectors in CSS files
- Tailwind classes are auto-sorted by Prettier plugin

## Imports

- Path aliases only: `@app/*` for `src/`, `@server/*` for `server/`
- Avoid relative imports that traverse folders; same-folder relative imports like `./X` are allowed (enforced by ESLint)
- Use `type` keyword for type-only imports: `import type { X } from '...'`
