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

**Entity Subscribers**: Use TypeORM subscribers for lifecycle hooks (`server/subscriber/`):

- `UserSubscriber`: Welcome notifications on user creation
- `InviteSubscriber`: Notifications for invite create/redeem/expire
- `CalEventSubscriber`: Notifications for calendar events

### Frontend Data Fetching

Use **SWR** for all data fetching:

```typescript
import useSWR from 'swr';

const { data, error, mutate } = useSWR<ResponseType>('/api/v1/endpoint');
```

**SWR Config**: Global config in `src/components/Layout/index.tsx` with automatic retries and revalidation.

**Server Components**: Root layout (`src/app/layout.tsx`) fetches initial settings and user server-side, then passes to client context providers.

### Frontend Hooks

Key custom hooks in `src/hooks/`:

- `useOnboarding`: Onboarding data and actions (SWR-based)
- `useServiceProxy`, `useServiceFrame`: Service proxy iframe management
- `useDownloads`: Download client status and torrents
- `useNotifications`: In-app notification handling
- `useSettings`, `useUser`: Settings and user context
- `useLocale`: Internationalization with react-intl
- `useBreakpoint`: Responsive design breakpoints
- `useDeepLinks`: Handle Plex deep links for media
- `useRouteGuard`: Permission-based route protection
- `useServerRestart`, `usePythonRestart`: Server and Python service restart controls
- `useClickOutside`: Detect clicks outside an element
- `useDebouncedState`: Debounced state updates
- `useIsTouch`, `useInteraction`: Touch/mobile detection
- `useLockBodyScroll`: Prevent body scrolling (modals)
- `useLibraryLinks`: Plex library navigation links

### Frontend Contexts

React contexts in `src/context/`:

- `SettingsContext`: Application settings
- `UserContext`: Current user data
- `OnboardingContext`: Onboarding state and actions
- `NotificationContext`: Socket.IO notifications
- `LanguageContext`: Locale and translations
- `InteractionContext`: User interaction state (mobile/touch detection)
- `NotificationSidebarContext`: Notification panel visibility

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
- `plex-refresh-token`: Refresh Plex auth token
- `image-cache-cleanup`: Clean old cached images (24h)
- `invites-qrcode-cleanup`: Clean expired invites and QR codes (24h)
- `notification-cleanup`: Clean old notifications (24h)

Jobs configurable via settings (`getSettings().jobs`). Job IDs defined as `JobId` type in `server/lib/settings.ts`.

### Onboarding System

The onboarding system guides new users through the application:

**Entities** (`server/entity/`):

- `WelcomeContent`: Carousel slides for welcome modal (type: user/admin)
- `TutorialStep`: Interactive tutorial steps with modes (spotlight/wizard/both)
- `UserOnboarding`: Per-user progress tracking (welcome/tutorial completion)

**Library** (`server/lib/onboarding.ts`):

- `initializeOnboardingDefaults()`: Creates default content on first startup
- `resetOnboardingDefaults()`: Resets content to defaults
- `onboardingImageService`: Image upload/serving for onboarding content

**Routes** (`server/routes/settings/onboarding.ts`):

- Admin CRUD for welcome content and tutorial steps
- Image upload for slides
- Reordering support via drag-and-drop

**User Routes** (`server/routes/user/onboarding.ts`):

- `GET /user/:id/onboarding`: Full onboarding data for user
- `POST /user/:id/onboarding/welcome/complete|dismiss`: Mark welcome as done
- `POST /user/:id/onboarding/tutorial/complete|skip|progress`: Tutorial state
- `POST /user/:id/onboarding/reset`: Reset user's onboarding

**Frontend**:

- `OnboardingContext` (`src/context/OnboardingContext.tsx`): Global state
- `useOnboarding` hook: SWR data fetching
- Tutorial uses `data-tutorial` attributes to find target elements
- DOM utilities in `src/utils/domHelpers.ts` for iframe handling
- Preset selectors in `src/utils/tutorialPresets.ts`

**Settings** (`getSettings().onboarding`):

```typescript
interface OnboardingSettings {
  initialized: boolean; // Whether defaults have been created
  adminOnboardingCompleted: boolean; // Whether admin has completed their onboarding
  welcomeEnabled: boolean; // Show welcome modal
  tutorialEnabled: boolean; // Show tutorial
  tutorialMode: 'spotlight' | 'wizard' | 'both';
  allowSkipWelcome: boolean;
  allowSkipTutorial: boolean;
  tutorialAutostart: boolean;
  tutorialAutostartDelay: number; // ms
}
```

**Content Sanitization**: Custom HTML sanitized via DOMPurify (`server/lib/sanitize.ts`). YouTube URLs converted to privacy-enhanced nocookie embeds.

### Restart System

The restart system tracks proxy-affecting settings changes and provides graceful server/service restarts.

**Core Components**:

- `server/lib/restartManager.ts`: Singleton that captures a boot-time snapshot of proxy-affecting settings (Plex IP, \*Arr hostnames/API keys, Tdarr, Tautulli, trust proxy, CSRF). `getRestartStatus()` compares current settings against the snapshot to determine which services need a restart.
- `server/lib/pythonService.ts`: Manages the Python (Plex Sync) service lifecycle — health polling (every 30s), independent restart, and graceful shutdown. `prepareForServerRestart()` preserves Python processes across a Node server restart.
- `src/utils/restartHelpers.ts`: Two-phase frontend polling utility — waits for server to go down (max 15s), then waits for it to come back up (max 30s).

**Frontend Hooks**:

- `useServerRestart`: Triggers server restart via `POST /api/v1/settings/restart`, then polls with `waitForRestart()` and reloads the page on success.
- `usePythonRestart`: Triggers Python service restart via `POST /api/v1/settings/python/restart`, SWR-based health status polling.

**UI Components**:

- `RestartRequiredAlert`: Warning banner on admin settings pages with filtered service display (e.g., Plex page only shows Plex changes). Hidden during `/setup` flow.
- `PythonServiceAlert`: Error banner shown on Plex Settings and User Settings General pages when Plex Sync service is unhealthy.
- `RestartModal`: Modal used during initial setup flow when services are configured that need a restart.
- `HealthCard` (in System page): Displays health status badges and restart buttons for both Streamarr server and Plex Sync service.

**Restart Behavior**:

- **Development**: Touches `server/index.ts` to trigger nodemon restart.
- **Docker (Production)**: Disconnects sockets, closes HTTP server (3s drain), destroys DB, then `process.exit(0)`. Container restart policy handles respawn.
- **Bare Metal (Production)**: Same graceful shutdown, then preserves Python processes and spawns a new Node process.

**Tracked Settings** (changes trigger restart requirement):

| Service                | Fields Tracked                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| Plex                   | `plex.ip`                                                          |
| Radarr/Sonarr          | `hostname`, `baseUrl`, `apiKey` (array — add/remove also triggers) |
| Lidarr/Prowlarr/Bazarr | `hostname`, `urlBase`, `apiKey`                                    |
| Tdarr                  | `hostname`, `enabled`                                              |
| Tautulli               | `hostname`, `urlBase`                                              |
| General                | `main.trustProxy`, `main.csrfProtection`                           |

**API Endpoints**:

- `GET /api/v1/settings/restart-required`: Returns `{ required, services[] }`
- `POST /api/v1/settings/restart`: Triggers server restart (responds immediately, restarts after 500ms)
- `GET /api/v1/settings/python/status`: Returns Python service health status
- `POST /api/v1/settings/python/restart`: Restarts Python service synchronously

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

**Additional \*Arr Services**:

- **Lidarr**: Music library management (`settings.lidarr`)
- **Prowlarr**: Indexer management (`settings.prowlarr`)
- **Bazarr**: Subtitle management (`settings.bazarr`)
- **Overseerr**: Request management (`settings.overseerr`)

All configured via `ServiceSettings` interface with hostname, port, API key, SSL, and URL base options.

**Tdarr**: Transcoding automation service (`settings.tdarr`, `server/lib/proxy/tdarrProxy.ts`). Includes WebSocket proxy for real-time updates.

### Download Clients

Download client integration (`server/api/downloads/base.ts`, `server/routes/downloads.ts`):

**Supported Clients** (via `@ctrl/*` packages):

- **qBittorrent** (`@ctrl/qbittorrent`)
- **Deluge** (`@ctrl/deluge`)
- **Transmission** (`@ctrl/transmission`)

**Health Monitoring** (`server/lib/healthCheck.ts`):

- Automatic cooldown on repeated failures
- Cached client data to reduce API calls
- Health status tracking per client

**Configuration**: `DownloadClientSettings` in `server/lib/settings.ts`:

```typescript
interface DownloadClientSettings {
  id: number;
  name: string;
  client: 'qbittorrent' | 'deluge' | 'transmission';
  hostname: string;
  port: number;
  useSsl: boolean;
  username?: string;
  password?: string;
  externalUrl?: string;
}
```

### Service Proxy System

Embeds external services in iframes within Streamarr (`server/routes/serviceProxy.ts`, `server/lib/proxy/`):

**Available Proxies**:

- **Plex Web** (`/web/*`): Full Plex web app embedding
- **Sonarr/Radarr** (dynamic base URLs): DVR service embedding
- **Lidarr/Prowlarr/Bazarr** (via `urlBase`): Additional \*Arr service embedding
- **Tdarr** (`/tdarr/*`): Includes WebSocket handler for real-time updates
- **Tautulli** (`/tautulli/*`): Stats dashboard embedding

**Frontend Hooks**:

- `useServiceProxy`: Manages proxy state and iframe loading
- `useServiceFrame`: Handles iframe communication

**Permissions**: Each proxy route requires appropriate permissions (e.g., `Permission.VIEW_SCHEDULE`, `Permission.ADMIN`).

### Calendar System

Release schedule and local events (`server/routes/calendar.ts`, `server/lib/calendarCache.ts`):

**Sources**:

- **Sonarr/Radarr Calendars**: Fetched and cached from \*Arr services
- **Local Events**: Custom events stored in `Event` entity

**Event Entity** (`server/entity/Event.ts`):

- User-created calendar events
- Supports all-day events, notifications
- Status: TENTATIVE, CONFIRMED, CANCELLED
- Linked to creator via `ManyToOne` relation

**Entity Subscribers**: `CalEventSubscriber` sends notifications for new events.

### Logo Upload

Custom branding via logo upload (`server/lib/logoUpload.ts`, `server/routes/logo.ts`):

- Full logo (`logo_full.png`) and small logo (`logo_sm.png`)
- Stored in `config/cache/logos/`
- Served via `/api/v1/logo/:filename`
- Settings: `main.customLogo`, `main.customLogoSmall`

### Image Proxy

Images proxied through `/api/v1/imageproxy` to:

- Cache external images locally (`config/cache/images/`)
- Resize/optimize images
- Handle auth for Plex images

Implemented in `server/lib/imageproxy.ts` with scheduled cleanup.

### Image Upload Service

Reusable service for uploading and serving images (`server/lib/imageUpload.ts`):

- Processes images via `sharp` (resize, quality optimization)
- Generates unique filenames via content hash
- Creates Express router for serving uploaded images
- Used by onboarding system for slide/step images

```typescript
import ImageUploadService from '@server/lib/imageUpload';

const imageService = new ImageUploadService({
  directory: 'my-feature', // Subdirectory in config/cache/images/
  urlPrefix: '/my-images', // URL path
  maxWidth: 1200, // Max dimensions
  maxHeight: 1200,
  quality: 85,
});

// Upload: await imageService.uploadImage({ buffer, originalname, mimetype })
// Serve: app.use('/my-images', imageService.createRouter({ requireAuth: true }))
```

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
- `server/lib/onboarding.ts`: Onboarding initialization and defaults
- `server/lib/restartManager.ts`: Server restart detection and execution
- `server/lib/pythonService.ts`: Plex Sync service lifecycle management
- `server/lib/sanitize.ts`: HTML/URL sanitization utilities
- `src/app/layout.tsx`: Root layout with server-side data
- `src/context/OnboardingContext.tsx`: Onboarding state management
- `package.json`: All scripts and dependencies
