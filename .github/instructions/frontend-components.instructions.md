---
description: 'Use when creating or editing React components, pages, or UI code. Covers SWR data fetching, context usage, i18n, and Tailwind styling.'
applyTo: 'src/**'
---

# Frontend Component Conventions

## Data Fetching

- Use SWR for all client-side reads: `useSWR<Type>('/api/v1/...')`
- For writes (POST/PUT/PATCH/DELETE), use `axios` in event handlers or custom hooks; avoid `fetch` unless there is a specific need.
- After successful writes, revalidate affected SWR keys with `mutate('/api/v1/...')` when the changed data is cached in SWR
- Prefer domain-specific SWR hooks from `src/hooks/` over manual `useState` + `axios.get` patterns

## State Management

- Use existing contexts from `src/context/` — no Redux or external state libraries
- Access via hooks: `useSettings()`, `useUser()`, `useLocale()`, `useNotifications()`
- Custom hooks in `src/hooks/` wrap context and SWR calls

## Internationalization

- All user-visible strings must use `react-intl`: `intl.formatMessage({ id: 'key' })`
- Use `useIntl()` from `react-intl` for message formatting
- Use `useLocale()` to read or change the current locale
- Extract new keys with `pnpm i18n:extract` after adding strings
- Commit changes to `src/i18n/locale/en.json` only; translated locales are maintained through Weblate.

## Mutations and Feedback

- Wrap async write handlers in `try/catch/finally`: show localized failure feedback in `catch`, reset loading state in `finally`, and revalidate affected SWR data when needed.
- Do not let rejected event-handler promises escape silently.
- Preserve native browser behavior and established controls unless the user explicitly approves a replacement.

## Styling

- Prefer Tailwind CSS for static styling. Inline styles are acceptable for dynamic values, third-party component APIs, and runtime fallbacks; avoid CSS modules unless an existing component requires them.
- Tailwind CSS v4 supports native CSS nesting for complex selectors in CSS files
- Tailwind classes are auto-sorted by Prettier plugin

## Imports

- Path aliases only: `@app/*` for `src/`, `@server/*` for `server/`
- Avoid relative imports that traverse folders; same-folder relative imports like `./X` are allowed (enforced by ESLint)
- Use `type` keyword for type-only imports: `import type { X } from '...'`
