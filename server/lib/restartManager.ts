import type { Server } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import type { RestartStatusResponse } from '@server/interfaces/api/settingsInterfaces';
import { getSettings } from './settings';
import pythonService from '@server/lib/pythonService';
import logger from '@server/logger';
import { isDocker } from '@server/utils/isDocker';
import dataSource from '@server/datasource';
import { existsSync, utimesSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

interface ProxyAffectingSettings {
  plex: { ip: string };
  radarr: ArrayServiceEntry[];
  sonarr: ArrayServiceEntry[];
  lidarr: ServiceEntry;
  prowlarr: ServiceEntry;
  bazarr: ServiceEntry;
  tdarr: { hostname?: string; enabled?: boolean };
  tautulli: ServiceEntry;
  main: { trustProxy: boolean; csrfProtection: boolean };
}

interface ServiceEntry {
  hostname?: string;
  urlBase?: string;
  apiKey?: string;
}

interface ArrayServiceEntry {
  hostname: string;
  baseUrl?: string;
  apiKey: string;
}

const LABEL = 'Server';
const DRAIN_TIMEOUT = 3000;

class RestartManager {
  private snapshot: ProxyAffectingSettings | null = null;
  private httpServer: Server | null = null;
  private io: SocketIOServer | null = null;
  private isShuttingDown = false;

  public initialize(httpServer: Server, io: SocketIOServer): void {
    this.httpServer = httpServer;
    this.io = io;
    this.captureSnapshot();
  }

  private captureSnapshot(): void {
    const settings = getSettings();

    this.snapshot = {
      plex: { ip: settings.plex.ip },
      radarr: settings.radarr.map((r) => ({
        hostname: r.hostname,
        baseUrl: r.baseUrl,
        apiKey: r.apiKey,
      })),
      sonarr: settings.sonarr.map((s) => ({
        hostname: s.hostname,
        baseUrl: s.baseUrl,
        apiKey: s.apiKey,
      })),
      lidarr: this.pickService(settings.lidarr),
      prowlarr: this.pickService(settings.prowlarr),
      bazarr: this.pickService(settings.bazarr),
      tdarr: {
        hostname: settings.tdarr.hostname,
        enabled: settings.tdarr.enabled,
      },
      tautulli: {
        hostname: settings.tautulli.hostname,
        urlBase: settings.tautulli.urlBase,
      },
      main: {
        trustProxy: settings.main.trustProxy,
        csrfProtection: settings.main.csrfProtection,
      },
    };
  }

  private pickService(svc: {
    hostname?: string;
    urlBase?: string;
    apiKey?: string;
  }): ServiceEntry {
    return {
      hostname: svc.hostname,
      urlBase: svc.urlBase,
      apiKey: svc.apiKey,
    };
  }

  public getRestartStatus(): RestartStatusResponse {
    if (!this.snapshot) {
      return { required: false, services: [] };
    }

    const settings = getSettings();
    const changed: string[] = [];

    if (settings.plex.ip !== this.snapshot.plex.ip) {
      changed.push('Plex');
    }

    if (this.hasArrayChanged(settings.radarr, this.snapshot.radarr)) {
      changed.push('Radarr');
    }

    if (this.hasArrayChanged(settings.sonarr, this.snapshot.sonarr)) {
      changed.push('Sonarr');
    }

    if (this.hasServiceChanged(settings.lidarr, this.snapshot.lidarr)) {
      changed.push('Lidarr');
    }

    if (this.hasServiceChanged(settings.prowlarr, this.snapshot.prowlarr)) {
      changed.push('Prowlarr');
    }

    if (this.hasServiceChanged(settings.bazarr, this.snapshot.bazarr)) {
      changed.push('Bazarr');
    }

    if (
      settings.tdarr.hostname !== this.snapshot.tdarr.hostname ||
      settings.tdarr.enabled !== this.snapshot.tdarr.enabled
    ) {
      changed.push('Tdarr');
    }

    if (
      settings.tautulli.hostname !== this.snapshot.tautulli.hostname ||
      settings.tautulli.urlBase !== this.snapshot.tautulli.urlBase
    ) {
      changed.push('Tautulli');
    }

    if (settings.main.trustProxy !== this.snapshot.main.trustProxy) {
      changed.push('Proxy Support');
    }

    if (settings.main.csrfProtection !== this.snapshot.main.csrfProtection) {
      changed.push('CSRF Protection');
    }

    return { required: changed.length > 0, services: changed };
  }

  private hasServiceChanged(
    current: ServiceEntry,
    snap: ServiceEntry
  ): boolean {
    return (
      current.hostname !== snap.hostname ||
      current.urlBase !== snap.urlBase ||
      current.apiKey !== snap.apiKey
    );
  }

  private hasArrayChanged(
    current: ArrayServiceEntry[],
    snapshot: ArrayServiceEntry[]
  ): boolean {
    if (current.length !== snapshot.length) return true;

    return current.some(
      (curr, i) =>
        curr.hostname !== snapshot[i].hostname ||
        curr.baseUrl !== snapshot[i].baseUrl ||
        curr.apiKey !== snapshot[i].apiKey
    );
  }

  public async triggerRestart(): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Restart already in progress', { label: LABEL });
      return;
    }

    this.isShuttingDown = true;
    logger.info('Server restarting...', { label: LABEL });

    if (process.env.NODE_ENV !== 'production') {
      return this.devRestart();
    }

    await this.productionRestart();
  }

  private devRestart(): void {
    pythonService.prepareForServerRestart();
    const touchFile = path.join(__dirname, '../index.ts');

    if (existsSync(touchFile)) {
      const now = new Date();
      utimesSync(touchFile, now, now);
    } else {
      logger.warn('Could not restart dev server — restart manually', {
        label: LABEL,
      });
    }

    this.isShuttingDown = false;
  }

  private async productionRestart(): Promise<void> {
    try {
      if (this.io) {
        this.io.disconnectSockets(true);
      }

      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            resolve();
          }, DRAIN_TIMEOUT);

          this.httpServer?.close((e) => {
            clearTimeout(timeout);
            if (e) {
              logger.warn(`Couldn't close HTTP server`, {
                label: LABEL,
                message: e.message || String(e),
              });
            }
            resolve();
          });
        });
      }

      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }

      if (isDocker()) {
        process.exit(0);
      }

      pythonService.prepareForServerRestart();
      process.removeAllListeners('SIGINT');
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('exit');

      const child = spawn(process.argv[0], process.argv.slice(1), {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });

      process.on('SIGINT', () => child.kill('SIGINT'));
      process.on('SIGTERM', () => child.kill('SIGTERM'));
      child.on('exit', (code) => process.exit(code ?? 0));
    } catch (e) {
      logger.error(`Could not restart the server - restart manually`, {
        label: LABEL,
        message: e.message || String(e),
      });
      process.exit(1);
    }
  }
}

const restartManager = new RestartManager();
export default restartManager;
