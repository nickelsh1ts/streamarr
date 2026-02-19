import type { IncomingMessage } from 'http';
import type { Session as ExpressSession } from 'express-session';
import PlexAPI from '@server/api/plexapi';
import dataSource, { getRepository } from '@server/datasource';
import { Session } from '@server/entity/Session';
import { User } from '@server/entity/User';
import { startJobs } from '@server/job/schedule';
import notificationManager from '@server/lib/notifications';
import LocalAgent, {
  setSocketIO,
} from '@server/lib/notifications/agents/inApp';
import EmailAgent from '@server/lib/notifications/agents/email';
import WebPushAgent from '@server/lib/notifications/agents/webpush';
import { getSettings } from '@server/lib/settings';
import { initializeOnboardingDefaults } from '@server/lib/onboarding';
import restartManager from '@server/lib/restartManager';
import pythonService from '@server/lib/pythonService';
import logger from '@server/logger';
import clearCookies from '@server/middleware/clearcookies';
import { checkUser } from '@server/middleware/auth';
import routes from '@server/routes';
import imageproxy from '@server/routes/imageproxy';
import logoRoutes from '@server/routes/logo';
import { onboardingImageService } from '@server/lib/onboarding';
import { getAppVersion } from '@server/utils/appVersion';
import { TypeormStore } from 'connect-typeorm/out';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import {
  createServiceProxyRouter,
  getActiveProxyPaths,
} from '@server/routes/serviceProxy';
import * as OpenApiValidator from 'express-openapi-validator';
import type { Store } from 'express-session';
import session from 'express-session';
import next from 'next';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

interface SocketRequest extends IncomingMessage {
  session?: ExpressSession & { userId?: number };
}

const API_SPEC_PATH = path.join(__dirname, '../streamarr-api.yml');

logger.info(`Starting Streamarr version ${getAppVersion()}`);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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
    const settings = getSettings().load();
    await initializeOnboardingDefaults();

    // Migrate library types
    if (
      settings.plex.libraries.length > 1 &&
      !settings.plex.libraries[0].type
    ) {
      const userRepository = getRepository(User);
      const admin = await userRepository.findOne({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      if (admin) {
        logger.info('Migrating Plex libraries to include media type', {
          label: 'Settings',
        });

        const plexapi = new PlexAPI({ plexToken: admin.plexToken });
        await plexapi.syncLibraries();
      }
    }

    // Register Notification Agents
    notificationManager.registerAgents([
      new EmailAgent(),
      new WebPushAgent(),
      new LocalAgent(),
    ]);
    // Start Jobs
    startJobs();
    const server = express();
    if (settings.main.trustProxy) {
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
    if (settings.main.csrfProtection) {
      server.use(
        csurf({ cookie: { httpOnly: true, sameSite: true, secure: !dev } })
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
      secret: settings.clientId,
      resave: false,
      saveUninitialized: false,
      name: 'streamarr.sid',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: settings.main.csrfProtection ? 'strict' : 'lax',
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
    });
    io.engine.use(sessionMiddleware);
    server.set('io', io);
    setSocketIO(io);
    restartManager.initialize(httpServer, io);
    pythonService.initialize();
    process.on('exit', () => pythonService.destroy());
    process.on('SIGINT', () => process.exit(0));
    process.on('SIGTERM', () => {
      pythonService.prepareForServerRestart();
      process.exit(0);
    });
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
    server.use('/imageproxy', clearCookies, imageproxy);
    server.use('/logo', clearCookies, logoRoutes);
    server.use(
      '/onboarding/images',
      sessionMiddleware,
      checkUser,
      onboardingImageService.createRouter({ requireAuth: true })
    );
    const apiDocs = YAML.load(API_SPEC_PATH);
    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocs));
    server.use(createServiceProxyRouter(httpServer, sessionMiddleware));
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
