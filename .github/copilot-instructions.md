# Streamarr Development Guide

## Architecture

Hybrid **Next.js 16 + Express** app wrapping Plex/\*Arr services. Single process runs both servers.

| Layer          | Stack                                       | Location          |
| -------------- | ------------------------------------------- | ----------------- |
| Frontend       | Next.js App Router, React 19, SWR, Tailwind | `src/`            |
| Backend API    | Express, TypeORM, SQLite                    | `server/`         |
| Python Service | Flask (Plex invites), port 5005             | `server/python/`  |
| Real-time      | Socket.IO                                   | `server/index.ts` |

Express serves API routes (`/api/v1/*`) and delegates everything else to Next.js. See `server/index.ts`.

**Path aliases** (enforced by ESLint — avoid cross-folder relative imports; same-folder `./` imports are allowed):

- `@server/*` → `server/*`
- `@app/*` → `src/*`

## Build & Test

| Task               | Command                                                              |
| ------------------ | -------------------------------------------------------------------- |
| Dev (Node only)    | `pnpm dev`                                                           |
| Dev (Python svc)   | `pnpm start:python` (separate terminal)                              |
| Build all          | `pnpm build`                                                         |
| Pre-commit check   | `pnpm prepare` (format + lint + typecheck)                           |
| Type check         | `pnpm typecheck` / `pnpm typecheck:server` / `pnpm typecheck:client` |
| Lint               | `pnpm lint` / `pnpm css-lint`                                        |
| Format             | `pnpm format`                                                        |
| E2E tests          | `pnpm cypress:build && pnpm cypress:open`                            |
| Generate migration | `pnpm migration:generate server/migration/Name`                      |
| Run migrations     | `pnpm migration:run`                                                 |
| Extract i18n       | `pnpm i18n:extract`                                                  |
| API docs (dev)     | `http://localhost:3000/api-docs` (Swagger UI)                        |

Dev uses `nodemon` watching `server/**/*.ts` and `streamarr-api.yml`.

## Conventions

### Backend

- **Database**: Always use `getRepository(Entity)` from `@server/datasource` — never instantiate repositories directly
- **Routes**: Express routers registered in `server/routes/index.ts`, validated against `streamarr-api.yml` (OpenAPI). New endpoints must be defined in the spec first.
- **Auth**: `checkUser` middleware runs globally; route-level `isAuthenticated(Permission.X)` for access control
- **Permissions**: Bitwise flags in `server/lib/permissions.ts`, checked via `user.hasPermission([Permission.X])`
- **Business logic**: Lives in entity static/instance methods (e.g., `User.hasPermission()`, `Invite.isExpired()`)
- **Lifecycle hooks**: TypeORM subscribers in `server/subscriber/` (notifications on entity create/update)
- **Settings**: JSON file via `getSettings()` singleton from `server/lib/settings.ts`
- **Logging**: Winston logger from `@server/logger` — always include `{ label: 'ComponentName' }`
- **Notifications**: `notificationManager.sendNotification()` — agents: Local (Socket.IO), Email, WebPush
- **Scheduled jobs**: `server/job/schedule.ts` using `node-schedule`

### Frontend

- **Data fetching**: SWR for all client-side data (`useSWR<Type>('/api/v1/...')`)
- **Server data**: Root layout (`src/app/layout.tsx`) fetches settings + user server-side, passes to context providers
- **State**: React contexts in `src/context/` — no Redux. Hooks in `src/hooks/` wrap contexts and SWR calls
- **i18n**: `react-intl` with `useLocale` hook. Extract keys with `pnpm i18n:extract`
- **Styling**: Tailwind CSS with `tailwindcss/nesting`. Classes auto-sorted by Prettier plugin

### Database Migrations

- **Dev**: `synchronize: true` — entity changes apply automatically
- **Prod**: Migrations run automatically on startup. Generate from entity changes with `pnpm migration:generate`

## Key Files

| Purpose                     | File                        |
| --------------------------- | --------------------------- |
| API spec (source of truth)  | `streamarr-api.yml`         |
| Server entry point          | `server/index.ts`           |
| DB config & `getRepository` | `server/datasource.ts`      |
| Settings schema & defaults  | `server/lib/settings.ts`    |
| Route registration          | `server/routes/index.ts`    |
| Root layout (SSR data)      | `src/app/layout.tsx`        |
| Permission flags            | `server/lib/permissions.ts` |

## Gotchas

- **Python commands**: Don't use `python` or `python3` directly. Use `get_python_executable_details` tool to respect virtual environments.
- **OpenAPI validation**: All API routes are validated at runtime against `streamarr-api.yml`. Missing or mismatched schemas cause 400/500 errors.
- **CSRF**: Enabled for state-changing requests. Frontend handles automatically via cookies.
- **Service proxies**: External services (Plex, \*Arr, Tdarr, Tautulli) are embedded via iframe proxies in `server/lib/proxy/`. Changes to proxy-affecting settings require a server restart — tracked by `server/lib/restartManager.ts`.
- **Log directory**: Auto-created by the Node server. Python service must NOT create it (permission conflicts).
- **PWA service worker**: `public/sw.js` — edit carefully to avoid breaking caching.
- **Email templates**: Pug templates in `server/templates/email/`.
- **HTML sanitization**: Use `server/lib/sanitize.ts` (DOMPurify). YouTube URLs auto-convert to nocookie embeds.
- **TypeScript**: Strict mode is OFF by design. `experimentalDecorators` enabled for TypeORM.
- **`CONFIG_DIRECTORY` env var**: All config (settings, DB, logs, cache) lives under this path (default: `./config`). Always use it when resolving file paths.
- **Session store**: TypeORM-backed sessions (`Session` entity via `connect-typeorm`). Cleared on server restart in development — expect re-login after restart.

## External Integrations

| Service                | Code                             | Notes                             |
| ---------------------- | -------------------------------- | --------------------------------- |
| Plex                   | `server/api/plexapi.ts`          | Invites require Python service    |
| Sonarr/Radarr          | `server/api/servarr/`            | Calendar + proxy                  |
| Lidarr/Prowlarr/Bazarr | Settings-based                   | Proxy only                        |
| Tdarr                  | `server/lib/proxy/tdarrProxy.ts` | WebSocket proxy                   |
| Tautulli               | `server/api/tautulli.ts`         | Stats proxy                       |
| TMDB                   | `server/api/themoviedb/`         | Metadata enrichment               |
| Download clients       | `server/api/downloads/`          | qBittorrent, Deluge, Transmission |

## Documentation

User-facing docs are in `docs/` (GitBook format). See `docs/SUMMARY.md` for full index.

Developer architecture details are in this file. For deployment, see `docs/getting-started/installation.md`.
