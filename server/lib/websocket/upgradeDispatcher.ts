import logger from '@server/logger';
import type { IncomingMessage, Server } from 'http';
import type { Duplex } from 'stream';

export interface UpgradeMatcher {
  /** Human-readable name used in logs. */
  name: string;
  /** Returns true when this matcher should handle the given request URL. */
  match: (url: string) => boolean;
  /** Handles the upgrade. May be async. */
  handle: (
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ) => void | Promise<void>;
}

export class UpgradeDispatcher {
  private matchers: UpgradeMatcher[] = [];

  private static isSocketIOUpgrade(url: string): boolean {
    return url === '/socket.io' || url.startsWith('/socket.io/');
  }

  public constructor(httpServer: Server) {
    httpServer.on('upgrade', (req, socket, head) => {
      const url = req.url ?? '';
      const matcher = this.matchers.find((m) => m.match(url));

      // Socket.IO's engine.io listener still handles its own upgrade path.
      if (!matcher) {
        if (UpgradeDispatcher.isSocketIOUpgrade(url)) {
          return;
        }

        socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        return;
      }

      try {
        const result = matcher.handle(req, socket, head);
        if (result instanceof Promise) {
          result.catch((e) => this.handleError(matcher, socket, e));
        }
      } catch (e) {
        this.handleError(matcher, socket, e);
      }
    });
  }

  public register(matcher: UpgradeMatcher): void {
    this.matchers.push(matcher);
  }

  private handleError(
    matcher: UpgradeMatcher,
    socket: Duplex,
    e: unknown
  ): void {
    logger.error('WebSocket upgrade handler failed', {
      label: 'WebSocket',
      matcher: matcher.name,
      message: e instanceof Error ? e.message : String(e),
    });
    socket.destroy();
  }
}

export function createUpgradeDispatcher(httpServer: Server): UpgradeDispatcher {
  return new UpgradeDispatcher(httpServer);
}
