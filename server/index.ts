import type { IncomingMessage } from 'http';
import type { Session as ExpressSession } from 'express-session';
import dataSource, { getRepository } from '@server/datasource';
import { Session } from '@server/entity/Session';
import { startJobs } from '@server/job/schedule';
import notificationManager from '@server/lib/notifications';
import LocalAgent, {
  setSocketIO,
} from '@server/lib/notifications/agents/inApp';
import EmailAgent from '@server/lib/notifications/agents/email';
import WebPushAgent from '@server/lib/notifications/agents/webpush';
import DiscordAgent from '@server/lib/notifications/agents/discord';
import GotifyAgent from '@server/lib/notifications/agents/gotify';
import NtfyAgent from '@server/lib/notifications/agents/ntfy';
import PushbulletAgent from '@server/lib/notifications/agents/pushbullet';
import PushoverAgent from '@server/lib/notifications/agents/pushover';
import SlackAgent from '@server/lib/notifications/agents/slack';
import TelegramAgent from '@server/lib/notifications/agents/telegram';
import WebhookAgent from '@server/lib/notifications/agents/webhook';
import { getSettings } from '@server/lib/settings';
import { initializeOnboardingDefaults } from '@server/lib/onboarding';
import { initI18n } from '@server/i18n';
import restartManager from '@server/lib/restartManager';
import logger from '@server/logger';
import clearCookies from '@server/middleware/clearcookies';
import { checkUser } from '@server/middleware/auth';
import routes from '@server/routes';
import avatarproxy from '@server/routes/avatarproxy';
import imageproxy from '@server/routes/imageproxy';
import logoRoutes from '@server/routes/logo';
import { onboardingImageService } from '@server/lib/onboarding';
import { getAppVersion } from '@server/utils/appVersion';
import { TypeormStore } from 'connect-typeorm/out';
import cookieParser from 'cookie-parser';
import csurf from '@dr.pogodin/csurf';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import {
  createServiceProxyRouter,
  getActiveProxyPaths,
} from '@server/routes/serviceProxy';
import { createUpgradeDispatcher } from '@server/lib/websocket/upgradeDispatcher';
import * as OpenApiValidator from 'express-openapi-validator';
import type { Store } from 'express-session';
import session from 'express-session';
import next from 'next';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import type { Duplex } from 'stream';

interface SocketRequest extends IncomingMessage {
  session?: ExpressSession & { userId?: number };
}

const API_SPEC_PATH = path.join(__dirname, '../streamarr-api.yml');

logger.info(`Starting Streamarr version ${getAppVersion()}`);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

app
  .prepare()
  .then(async () => {
    const dbConnection = await dataSource.initialize();

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      await dbConnection.query('PRAGMA foreign_keys=OFF');
      await dbConnection.runMigrations();
      await dbConnection.query('PRAGMA foreign_keys=ON');
    }

    // Load Settings
    const settings = await getSettings().load();
    initI18n();
    await initializeOnboardingDefaults();

    // Register Notification Agents
    notificationManager.registerAgents([
      new DiscordAgent(),
      new EmailAgent(),
      new GotifyAgent(),
      new NtfyAgent(),
      new PushbulletAgent(),
      new PushoverAgent(),
      new SlackAgent(),
      new TelegramAgent(),
      new WebhookAgent(),
      new WebPushAgent(),
      new LocalAgent(),
    ]);
    // Start Jobs
    startJobs();
    const server = express();
    if (settings.network.trustProxy) {
      server.set('trust proxy', 1);
    }
    server.use(cookieParser());

    // Get proxy paths to skip body parsing for proxied services
    const proxyPaths = getActiveProxyPaths();
    const isProxyPath = (path: string) =>
      proxyPaths.some((p) => path.startsWith(p));

    // Conditional body parsing - skip for file upload and proxy routes
    server.use((req, res, next) => {
      if (
        req.path.includes('/settings/logos/upload') ||
        isProxyPath(req.path)
      ) {
        return next();
      }
      express.json({ limit: '50mb' })(req, res, next);
    });

    server.use((req, res, next) => {
      if (
        req.path.includes('/settings/logos/upload') ||
        isProxyPath(req.path)
      ) {
        return next();
      }
      express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    });
    if (settings.network.csrfProtection) {
      server.use(
        csurf({
          cookie: {
            key: '_csrf',
            path: '/',
            httpOnly: true,
            sameSite: true,
            secure: !dev,
          },
        })
      );
      server.use((req, res, next) => {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
          sameSite: true,
          secure: !dev,
        });
        next();
      });
    }
    // Set up sessions
    const sessionRepository = getRepository(Session);
    const sessionMiddleware = session({
      secret: settings.sessionSecret,
      resave: false,
      saveUninitialized: false,
      name: 'streamarr.sid',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: settings.network.csrfProtection ? 'strict' : 'lax',
        secure: 'auto',
      },
      store: new TypeormStore({
        cleanupLimit: 2,
        ttl: 60 * 60 * 24 * 30,
      }).connect(sessionRepository) as Store,
    });
    server.use('/api', sessionMiddleware);
    const httpServer = createServer(server);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      destroyUpgrade: false,
    });
    io.engine.use(sessionMiddleware);
    server.set('io', io);
    setSocketIO(io);
    restartManager.initialize(httpServer, io);
    const upgradeDispatcher = createUpgradeDispatcher(httpServer);

    // Next.js lazily attaches a catch-all `upgrade` listener (via
    // getRequestHandler) that hijacks the /socket.io/ upgrade and corrupts the
    // WebSocket frame ("Invalid frame header"). Mark Next's WS setup as already
    // done so it never registers its catch-all. This relies on NextCustomServer
    // internals (`didWebSocketSetup`) and must be re-verified on Next.js major
    // upgrades.
    (app as unknown as { didWebSocketSetup: boolean }).didWebSocketSetup = true;
    if (dev) {
      const nextUpgradeHandler = (
        app as unknown as {
          upgradeHandler?: (
            req: IncomingMessage,
            socket: Duplex,
            head: Buffer
          ) => void;
        }
      ).upgradeHandler;

      if (typeof nextUpgradeHandler === 'function') {
        upgradeDispatcher.register({
          name: 'next:hmr',
          match: (url) => url.startsWith('/_next/'),
          handle: (req, socket, head) =>
            nextUpgradeHandler(req, socket as Duplex, head),
        });
      } else {
        logger.warn(
          'Next.js upgradeHandler unavailable; HMR over WebSocket disabled',
          { label: 'Server' }
        );
      }
    }
    io.on('connection', async (socket) => {
      const req = socket.request as SocketRequest;
      // Check for valid session and user
      if (!req.session || !req.session.userId || !req.session.userId) {
        socket.disconnect(true);
        return;
      }
      try {
        socket.join(String(req.session.userId));
      } catch {
        socket.disconnect(true);
        return;
      }
    });
    server.use(
      '/imageproxy',
      clearCookies,
      (req, res, next) => {
        if (req.path.startsWith('/plex')) {
          return sessionMiddleware(req, res, () => checkUser(req, res, next));
        }
        next();
      },
      imageproxy
    );
    server.use('/avatarproxy', clearCookies, avatarproxy);
    server.use('/logo', clearCookies, logoRoutes);
    server.use(
      '/onboarding/images',
      sessionMiddleware,
      checkUser,
      onboardingImageService.createRouter({ requireAuth: true })
    );
    const apiDocs = YAML.load(API_SPEC_PATH);
    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocs));
    server.use(createServiceProxyRouter(upgradeDispatcher, sessionMiddleware));
    server.use(
      OpenApiValidator.middleware({
        apiSpec: API_SPEC_PATH,
        validateRequests: true,
        ignorePaths: (path) =>
          path.includes('/settings/logos/upload') ||
          (path.includes('/settings/onboarding/') && path.includes('/image')) ||
          isProxyPath(path),
      })
    );
    server.use((_req, res, next) => {
      const original = res.json;
      res.json = function jsonp(json) {
        return original.call(this, JSON.parse(JSON.stringify(json)));
      };
      next();
    });
    server.use('/api/v1', routes);
    server.get('/{*splat}', (req, res) => handle(req, res));
    server.use(
      (
        err: unknown,
        _req: Request,
        res: Response,
        // We must provide a next function for the function signature here even though its not used
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _next: NextFunction
      ) => {
        const errorInfo = err as {
          status?: number;
          message?: string;
          errors?: string[];
          stack?: string;
        };
        res
          .status(errorInfo.status || 500)
          .json({ message: errorInfo.message, errors: errorInfo.errors });
      }
    );
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST;
    if (host) {
      httpServer.listen(port, host, (error?: Error) => {
        if (error) {
          logger.error(`Failed to start server: ${error.message}`, {
            label: 'Server',
          });
          throw error;
        }
        logger.info(`server ready on ${host} port ${port}`, {
          label: 'Server',
        });
      });
    } else {
      httpServer.listen(port, (error?: Error) => {
        if (error) {
          logger.error(`Failed to start server: ${error.message}`, {
            label: 'Server',
          });
          throw error;
        }
        logger.info(`server ready on port ${port}`, { label: 'Server' });
      });
    }
  })
  .catch((err) => {
    logger.error(err.stack);
    process.exit(1);
  });
