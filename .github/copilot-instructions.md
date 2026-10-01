# Streamarr Development Guide

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

## Working Agreement

- Start each new concern from the latest `origin/develop` on a narrowly named branch. Continue on an existing task branch for its review fixes and requested amendments; do not add unrelated work to the user's current branch.
- `develop` is the integration branch. Release PRs promote `develop` to `main`; semantic-release runs from `main` after that merge.
- Before switching branches, amending commits, or force-pushing, confirm the worktree is clean and re-read files reported as changed externally.
- Keep changes minimal and focused. Do not bundle adjacent cleanup, feature work, or generated churn into the same branch without asking first.
- Start from the smallest relevant code path. Gather only enough local context to form a falsifiable hypothesis and a focused validation check, then edit and validate before broadening scope.
- Prefer established project patterns and native behavior. Ask before replacing an existing approach when more than one valid design exists or the choice changes user-facing behavior, compatibility, security policy, release policy, or maintenance cost.
- Use `apply_patch` for manual file edits. Do not use shell commands to write files, and do not reformat unrelated content.
- The user normally opens PRs. Push a requested branch, but do not create a PR unless explicitly asked. When updating an existing PR, preserve the repository template and checklist unless the user requests a release-notes-only body.
- Do not create or modify a pull request, post or edit comments, reply to review feedback, resolve or close review threads, submit or dismiss reviews, change labels or metadata, or merge without explicit user approval for that specific action.
- Treat `.github/implementations/` as local scratch space for implementation notes. Keep only its `.gitkeep` in commits; do not add implementation documents to version control.
- Use short Conventional Commit subjects. `feat` creates a minor release; `fix`, `perf`, and `security` create a patch; a breaking change creates a major release. `build`, `ci`, `chore`, `docs`, `refactor`, `revert`, `style`, and `test` do not release by themselves. Use `security(scope): ...` for vulnerability fixes.
- After implementing and validating changes, stop and provide a concise diff/behavior/test summary for manual review. Ask for explicit approval before any commit, amend, or push; do not infer approval from the original implementation request.
- Do not commit, amend, push, create or modify branches, or perform any GitHub/PR action unless the user explicitly approves that specific action.
- Only amend/force-push after that explicit approval and when maintaining a single-commit branch already created in the current task. Always use `--force-with-lease`.
- Do not mark checklist items, publish releases, merge PRs, or change shared GitHub settings without explicit approval.

### Pause and Revalidate

Pause for confirmation before:

- expanding a fix beyond the reported behavior or opening another implementation branch;
- changing a public API contract, compatibility behavior, release/versioning policy, security guarantees, or data retention;
- replacing a project-wide pattern with a new abstraction, dependency, or workflow architecture;
- publishing an immutable release or accepting a known verification/security gap.

When the user questions a design choice, stop editing, answer the concern directly, and verify the assumption with code or runtime evidence before continuing.

### Validation and Reporting

- Validate the changed behavior, not only compilation. Prefer the narrowest executable check first, then typecheck/lint for the touched area.
- After the first substantive edit, run the narrowest focused validation before reading broadly or opening another implementation slice.
- Distinguish checks already run from manual checks still required. PR descriptions should list functional tests and preserve the standard checklist; omit generic command lists from the test narrative.
- Keep `Has This Been Tested?` proportional to the change. For documentation-only, configuration-only, or CI-only changes with no application functionality changed, use a concise statement such as `No functionality changed; documentation/configuration updates only.` Mention meaningful validation briefly if needed, but do not turn formatting, typechecking, or CI job names into a test checklist. For behavioral changes, use a checklist of concrete tests performed by the agent or developer and tests still required.
- In the standard PR checklist, check only applicable completed items. Leave non-applicable items unchecked without adding `not required`, `N/A`, or similar annotations.
- Never claim that a workflow, registry operation, OIDC signature, browser/PWA flow, or production migration is verified when it was only linted or simulated locally.
- Remove temporary scripts, test cache entries, containers, and dev servers created during validation.

### PR Review Workflow

- Read the current PR head, description, checks, and unresolved inline threads before editing. Review comments may refer to outdated code or a stale description; verify the claim instead of applying it blindly.
- Address comments with the smallest correct change. If declining a suggestion, explain the project-specific reason with concrete evidence.
- After manual review and explicit approval, commit/push the code change before replying. Reply with the commit/behavior that addresses the comment, then resolve the thread. A Copilot review summary can remain stale after its inline threads are resolved; use thread state as the actionable source.
- Keep PR descriptions aligned with the final implementation. Include tests already performed and concise functional checks still needed, and preserve the standard checklist unless the PR is specifically a release-notes PR.

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
