# Streamarr Development Guide

Codebase knowledge for any AI agent or reviewer. Agent workflow rules for Copilot live in `.github/copilot-instructions.md`.

## Architecture

Hybrid **Next.js 16 + Express** app wrapping Plex/\*Arr services. Single process runs both servers.

| Layer       | Stack                                       | Location          |
| ----------- | ------------------------------------------- | ----------------- |
| Frontend    | Next.js App Router, React 19, SWR, Tailwind | `src/`            |
| Backend API | Express, TypeORM, SQLite                    | `server/`         |
| Real-time   | Socket.IO                                   | `server/index.ts` |

Express serves API routes (`/api/v1/*`) and delegates everything else to Next.js. See `server/index.ts`.

**Path aliases** (enforced by ESLint): use `@server/*` or `@app/*` for any import that crosses a top-level directory boundary (e.g., `server/routes/` importing from `server/lib/` must use `@server/lib/…`). Use relative `./` imports only when importing from within the same directory (e.g., `./utils` inside `server/routes/`).

- `@server/*` → `server/*`
- `@app/*` → `src/*`

## Build & Test

| Task               | Command                                                              |
| ------------------ | -------------------------------------------------------------------- |
| Dev (Node only)    | `pnpm dev`                                                           |
| Build all          | `pnpm build`                                                         |
| Pre-commit check   | `pnpm check` (format + lint + css-lint + typecheck)                  |
| Type check         | `pnpm typecheck` / `pnpm typecheck:server` / `pnpm typecheck:client` |
| Lint               | `pnpm lint` / `pnpm css-lint`                                        |
| Format             | `pnpm format`                                                        |
| E2E tests          | `pnpm cypress:build && pnpm cypress:open`                            |
| Generate migration | `pnpm migration:generate server/migration/Name`                      |
| Run migrations     | `pnpm migration:run`                                                 |
| Extract i18n       | `pnpm i18n:extract` (runs both `:client` and `:server` variants)     |
| API docs (dev)     | `http://localhost:3000/api-docs` (Swagger UI)                        |

Dev uses `nodemon` watching `server/**/*.ts` and `streamarr-api.yml`.

**Git hooks (Husky)**: `pnpm install` sets up Husky automatically via `bin/prepare.mjs`. Pre-commit runs `lint-staged` (format + lint on staged files). `commit-msg` enforces Conventional Commits via `commitlint`. Bypass with `HUSKY_BYPASS=1` if needed (e.g. CI sets `CI=true` to skip).

## Conventions

- Backend route conventions, authentication, OpenAPI, persistence, error handling, and serialization are in `.github/instructions/backend-api.instructions.md`.
- Frontend data fetching, state, i18n, styling, and mutation conventions are in `.github/instructions/frontend-components.instructions.md`.
- Workflow-specific release rules are in `.github/instructions/release-workflows.instructions.md`.

### Database Migrations

- **Dev**: `synchronize: true` — entity changes apply automatically in development. However, always run `pnpm migration:generate` before a production deploy whenever entity files change; synchronize does not create migration files and prod startup will fail if schema drifts without them.
- **Prod**: Migrations run automatically on startup. Generate from entity changes with `pnpm migration:generate`.

### Settings Migrations

A separate, lightweight migration system for JSON settings (not TypeORM). Files live in `server/lib/migrations/` and are run by `server/lib/migrator.ts` at startup before the settings singleton initialises. Each migration is a default-exported function `(settings: AllSettings) => AllSettings`. A backup (`settings.old.json`) is written before running. Use this when renaming or restructuring settings keys across versions.

## Key Files

| Purpose                     | File                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| API spec (source of truth)  | `streamarr-api.yml`                                                                                              |
| Server entry point          | `server/index.ts`                                                                                                |
| DB config & `getRepository` | `server/datasource.ts`                                                                                           |
| Settings schema & defaults  | `server/lib/settings.ts`                                                                                         |
| Route registration          | `server/routes/index.ts`                                                                                         |
| Root layout (SSR data)      | `src/app/layout.tsx`                                                                                             |
| Permission flags            | `server/lib/permissions.ts`                                                                                      |
| Network settings            | `/settings/network` (GET/POST) — `requestTimeout` and base-URL validation via `server/lib/validation/baseUrl.ts` |
| Avatar proxy                | `server/routes/avatarproxy.ts` — server-side avatar cache, rate-limited                                          |
| Linked accounts             | `/user/{userId}/settings/linked-accounts/plex` (GET/POST/DELETE) — manages Plex OAuth links per user             |
| Settings migrator           | `server/lib/migrator.ts` + `server/lib/migrations/`                                                              |

## Gotchas

- **OpenAPI validation**: Request and route definitions are validated at runtime against `streamarr-api.yml`; missing paths or invalid request parameters/bodies can cause 400 errors. Response schemas are not currently runtime-validated.
- **CSRF**: Enabled for state-changing requests. Frontend handles automatically via cookies.
- **Service proxies**: External services (Plex, \*Arr, Tdarr, Tautulli) are embedded via iframe proxies in `server/lib/proxy/`. Changes to proxy-affecting settings require a server restart — tracked by `server/lib/restartManager.ts`.
- **PWA service worker**: `public/sw.js` — edit carefully to avoid breaking caching.
- **Hand-maintained iframe stylesheets**: `public/watch.base.css`, `public/watch.css`, `public/request.css`, and `public/tautulli.css` style the embedded `/watch` (Plex) and `/request` (Seerr) iframes — they are NOT compiled by Next.js. `watch.base.css` is generated by `pnpm css-build` (standalone Tailwind CLI + `bin/flatten-css.mjs` to strip `@layer` wrappers so iframe CSS is unlayered like the v3 build); the others are edited by hand and are in `pnpm css-lint` scope. Because these are served at stable URLs, all `<link>` references MUST go through `withVersion()` from `src/utils/assetVersion.ts` for cache busting (appends `?v=<cssVersion>`, set in `next.config.mjs` env from `COMMIT_TAG` in CI or a per-build timestamp locally). After editing `src/styles/watch.tailwind.css`, run `pnpm css-build` then validate with `pnpm lint`, `pnpm typecheck:client`, `pnpm css-lint`.
- **Iframe theming (oklch + nearest-ancestor vars)**: Saved theme colors may be `oklch()` strings, which `colord` cannot parse — use `parseColorToHex()` from `src/utils/themeUtils.ts`. Seerr/Overseerr consumes `--accent-color` ONLY as raw RGB channels (`rgb(var(--accent-color))`), so inject comma-separated channels, never a whole color. Theme-park wraps Seerr content in `.react-chroma-dark`, which re-declares these vars; since custom-property resolution uses the nearest declaring ancestor, that wrapper must set them to `inherit` so values injected on the iframe `<html>`/`<body>` cascade into SPA-added content.
- **`DynamicFrame` theme injection is opt-in**: `src/components/Common/DynamicFrame` is shared by all proxied services, but only those shipping a matching theme-park stylesheet (Tautulli `tautulli.css`, Seerr `request.css`) should be themed. Pass `injectTheme` ONLY on those callers (alongside the matching `<link>`); without it the theme effect early-returns so services like Tdarr and the \*Arrs keep their native styling. Injecting the streamarr vars into an unsupported service breaks its colors.
- **Email templates**: Pug templates in `server/templates/email/`.
- **HTML sanitization**: Use `server/lib/sanitize.ts` (DOMPurify). YouTube URLs auto-convert to nocookie embeds.
- **TypeScript**: Strict mode is OFF by design. `experimentalDecorators` enabled for TypeORM.
- **`CONFIG_DIRECTORY` env var**: All config (settings, DB, logs, cache) lives under this path (default: `./config`). Always use it when resolving file paths.
- **Session store**: TypeORM-backed sessions (`Session` entity via `connect-typeorm`). Cleared on server restart in development — expect re-login after restart.
- **Server-side i18n**: `server/i18n/index.ts` provides translation helpers for notification emails and subscribers. Locale files live at `server/i18n/locale/<lang>.json`. Extract with `pnpm i18n:extract:server`. The build step copies these to `dist/i18n/locale/`.
- **Docker runtime**: Uses `node:26-alpine`. `engines` in `package.json` requires `node >=24.0.0` and `pnpm ^12.0.0`.

## External Integrations

| Service                | Code                             | Notes                             |
| ---------------------- | -------------------------------- | --------------------------------- |
| Plex                   | `server/api/plexapi.ts`          | Plex API integration and invites  |
| Sonarr/Radarr          | `server/api/servarr/`            | Calendar + proxy                  |
| Lidarr/Prowlarr/Bazarr | Settings-based                   | Proxy only                        |
| Tdarr                  | `server/lib/proxy/tdarrProxy.ts` | WebSocket proxy                   |
| Tautulli               | `server/api/tautulli.ts`         | Activity/stats proxy              |
| TMDB                   | `server/api/themoviedb/`         | Metadata enrichment               |
| Download clients       | `server/api/downloads/`          | qBittorrent, Deluge, Transmission |

## Documentation

User-facing docs are in `docs/` (GitBook format). See `docs/SUMMARY.md` for full index.

Developer architecture details are in this file. For deployment, see `docs/getting-started/installation.md`.
