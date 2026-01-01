# Streamarr Development Guide

## Architecture Overview

Streamarr is a **hybrid Next.js + Express application** that wraps Plex/\*Arr services with a user-friendly interface. The architecture consists of:

- **Frontend**: Next.js 16+ with React 19, server-side rendered pages using App Router (`src/app/`)
- **Backend API**: Express.js server (`server/`) with TypeORM + SQLite, started alongside Next.js
- **Python Service**: Flask microservice (`server/python/plex_invite.py`) for Plex invite operations, runs on port 5005
- **Real-time**: Socket.IO for in-app notifications and live updates

### Key Architectural Decisions

1. **Single Process, Two Servers**: Express serves both the Next.js app (via `next()` handler) AND the API routes (`/api/v1/*`). The Express server is defined in `server/index.ts` and handles API middleware before delegating to Next.js.

2. **Database**: SQLite with TypeORM. Schema changes require TypeORM migrations. Use `getRepository(Entity)` from `@server/datasource` to access entities.

3. **Path Aliases**:
   - `@server/*` → `server/*` (backend code)
   - `@app/*` → `src/*` (frontend code)
   - Both configured in `tsconfig.json` and `server/tsconfig.json`

4. **Configuration**: Settings stored in JSON file (`config/settings.json`) loaded via `getSettings()` singleton. Cache and logs use `config/` directory (overridable via `CONFIG_DIRECTORY` env var).

## Development Workflows

### Starting Development

```bash
# Full stack with Python service
yarn dev:all

# Node.js only (no Plex invites)
yarn dev

# Python service only
CONFIG_DIRECTORY=./config cd server/python && python3 plex_invite.py
```

**Important**: `yarn dev` uses `nodemon` watching `server/**/*.ts` and `streamarr-api.yml`. Changes to the OpenAPI spec trigger server restart.

### Building

```bash
# Build everything (required before production start)
yarn build

# Individual builds
yarn build:next      # Next.js frontend
yarn build:server    # Compile TypeScript server to dist/
```

**Build Process**:

- Server TypeScript compiles to `dist/` with path aliases resolved via `tsc-alias`
- Email templates copied from `server/templates/` to `dist/templates/`
- Frontend builds to `.next/`

### Testing

```bash
# Cypress E2E (requires built app)
yarn cypress:build    # Build and prepare test DB
yarn cypress:open     # Open Cypress UI

# Prepare test database only
yarn cypress:prepare
```

**Test Database**: Uses separate SQLite instance created by `server/scripts/prepareTestDb.ts` with Cypress-specific settings from `cypress/config/settings.cypress.json`.

### Migrations

```bash
# Generate migration from entity changes
yarn migration:generate server/migration/MyMigrationName

# Create empty migration
yarn migration:create server/migration/MyMigrationName

# Run pending migrations (auto-runs in production on startup)
yarn migration:run
```

**Migration Pattern**: Migrations run automatically in production (`server/index.ts`). In development, synchronize is enabled so entity changes apply immediately without migrations (useful for rapid iteration).

## Code Patterns & Conventions

### Backend API Routes

Routes follow Express router pattern with OpenAPI validation:

```typescript
// server/routes/myroute.ts
import { Router } from 'express';
import { isAuthenticated } from '@server/middleware/auth';

const router = Router();

router.get('/endpoint', isAuthenticated(), async (req, res) => {
  // API logic
});

export default router;
```

Register routes in `server/routes/index.ts`. All routes validated against `streamarr-api.yml` via `express-openapi-validator`.

### Database Access

**Always use `getRepository()`** from `@server/datasource`, never instantiate repositories directly:

```typescript
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';

const userRepository = getRepository(User);
const user = await userRepository.findOne({ where: { id: userId } });
```

**Entity Methods**: Complex business logic lives in entity static/instance methods (e.g., `User.createLocal()`, `Invite.invite()`). See `server/entity/User.ts` and `server/entity/Invite.ts` for examples.

**Entity Subscribers**: Use TypeORM subscribers for lifecycle hooks (`server/subscriber/`). Example: `UserSubscriber` sends welcome notifications on user creation.

### Frontend Data Fetching

Use **SWR** for all data fetching:

```typescript
import useSWR from 'swr';

const { data, error, mutate } = useSWR<ResponseType>('/api/v1/endpoint');
```

**SWR Config**: Global config in `src/components/Layout/index.tsx` with automatic retries and revalidation.

**Server Components**: Root layout (`src/app/layout.tsx`) fetches initial settings and user server-side, then passes to client context providers.

### Logging

**Backend**: Use Winston logger from `@server/logger`:

```typescript
import logger from '@server/logger';

logger.info('Message', { label: 'ComponentName', additionalData: 'value' });
logger.error('Error occurred', { label: 'ComponentName', error });
```

Logs rotate daily in `config/logs/streamarr-YYYY-MM-DD.log`.

**Python Service**: Custom JSON line logger writes to `config/logs/.machinelogs.json` for centralized log parsing. See `JSONLineLogger` class in `plex_invite.py`.

### Permission System

Check permissions using `Permission` enum and `hasPermission`:

```typescript
import { Permission } from '@server/lib/permissions';

// In middleware
if (!req.user.hasPermission([Permission.MANAGE_USERS])) {
  return res.status(403).json({ error: 'Forbidden' });
}

// In entities
user.hasPermission([Permission.ADMIN], { type: 'or' }); // ANY permission
user.hasPermission([Permission.ADMIN, Permission.MANAGE_USERS]); // ALL permissions
```

**Permission Constants**: Defined in `server/lib/permissions.ts` as bitwise flags. Default permissions configured in settings.

### Notification System

Notification agents registered in `server/index.ts`:

- **LocalAgent** (in-app via Socket.IO)
- **EmailAgent** (via nodemailer + templates)
- **WebPushAgent** (web push notifications)

Trigger notifications via `notificationManager.sendNotification()`. Notification types defined in `server/constants/notification.ts`.

### Scheduled Jobs

Jobs defined in `server/job/schedule.ts` using `node-schedule`. Key jobs:

- `plex-full-scan`: Full library scan (24h)
- `plex-recent-scan`: Recent items scan (5min intervals)
- `image-cache-cleanup`: Clean old cached images (24h)
- `expired-invites`: Clean expired invites (24h)

Jobs configurable via settings (`getSettings().jobs`).

## Integration Points

### Plex API

**PlexAPI** (`server/api/plexapi.ts`) wraps `plex-api` library. Key methods:

- `getStatus()`: Check server status
- `syncLibraries()`: Sync library metadata
- `getMetadata()`: Fetch media metadata

**Plex Invites**: Python service required for invite operations due to `PlexAPI` library limitations. Frontend → Express → Python Flask service (port 5005).

### External Services

**\*Arr Integration**:

- Sonarr/Radarr APIs wrapped in `server/api/servarr/`
- Used for release calendar
- Configure in settings (`ServiceSettings`)

**TMDB**: TheMovieDb API (`server/api/themoviedb/`) for metadata enrichment. Respects user region/language settings.

**Tautulli**: Optional integration for Plex stats (`server/api/tautulli.ts`).

### Image Proxy

Images proxied through `/api/v1/imageproxy` to:

- Cache external images locally (`config/cache/images/`)
- Resize/optimize images
- Handle auth for Plex images

Implemented in `server/lib/imageproxy.ts` with scheduled cleanup.

## Common Gotchas

1. **Don't use `python` or `python3` commands directly**: Use `get_python_executable_details` tool to construct proper commands respecting virtual environments.

2. **Log directory auto-created**: Server auto-creates `config/logs/` on startup. Python service should NOT create this directory (prevents permission conflicts).

3. **CSRF Protection**: Enabled for state-changing requests. Frontend automatically handles via cookies (see `server/middleware/clearcookies.ts`).

4. **Session Store**: TypeORM-backed sessions (`connect-typeorm`) stored in `Session` entity. Cleared on server restart in development.

5. **PWA Offline Support**: Service worker in `public/sw.js`. Update carefully to avoid breaking caching.

6. **Email Templates**: Located in `server/templates/email/`. Use `email-templates` library with Pug templating.

## Docker & Deployment

**Development**: `docker-compose.yml` uses `Dockerfile.local` with volume mounts for hot reload.

**Production**: Multi-stage `Dockerfile`:

- Builds Python venv with requirements
- Compiles TypeScript server
- Builds Next.js frontend
- Removes source files for smaller image

**Python Service**: Started via Gunicorn in production (`yarn start:python`), direct Flask in development.

**Environment Variables**:

- `CONFIG_DIRECTORY`: Override config path (default: `./config`)
- `NODE_ENV`: `production` or `development`
- `LOG_LEVEL`: Winston log level (default: `debug`)
- `COMMIT_TAG`: Git commit for version display

## Quick Reference

| Task         | Command                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| Format code  | `yarn format`                                                                |
| Lint         | `yarn lint` / `yarn css-lint`                                                |
| Type check   | `yarn typecheck` (both) or `yarn typecheck:server` / `yarn typecheck:client` |
| API docs     | `http://localhost:3000/api-docs` (served via swagger-ui-express)             |
| Dev database | `config/db/db.sqlite3` (view with SQLite tools)                              |

**Key Files**:

- `streamarr-api.yml`: OpenAPI spec (source of truth for API)
- `server/datasource.ts`: Database configuration
- `server/lib/settings.ts`: Settings schema and defaults
- `src/app/layout.tsx`: Root layout with server-side data
- `package.json`: All scripts and dependencies
