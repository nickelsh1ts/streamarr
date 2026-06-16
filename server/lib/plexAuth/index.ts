import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { getAppVersion } from '@server/utils/appVersion';
import axios from 'axios';
import { randomUUID } from 'crypto';

/**
 * Server-side Plex PIN authentication.
 *
 * Moves the Plex OAuth pin lifecycle (creation, polling, token exchange) from
 * the browser to the server. The browser only ever sees:
 *   - an opaque pin session id (single-use, short TTL)
 *   - the app.plex.tv auth URL to open in the popup
 *
 * The resulting Plex auth token is held server-side and consumed exactly once
 * by a login/signup/link handler via `consumeToken()`. Tokens never transit
 * the browser.
 *
 * Sessions are kept in memory: streamarr runs as a single process, pin
 * sessions are short-lived (<= 15 minutes), and an interrupted sign-in simply
 * starts over.
 */

const PIN_SESSION_TTL_MS = 15 * 60 * 1000;
const CLEANUP_GRACE_MS = 60 * 1000;

export type PlexPinStatus = 'pending' | 'authorized' | 'expired';

export interface PlexPinClientInfo {
  platform?: string;
  platformVersion?: string;
  device?: string;
  screenResolution?: string;
}

export interface PlexPinCreationResponse {
  id: string;
  authUrl: string;
  expiresAt: string;
}

interface PinSession {
  plexPinId: number;
  headers: Record<string, string>;
  authToken?: string;
  expiresAt: number;
}

interface PlexPinResponse {
  id: number;
  code: string;
  authToken?: string | null;
  expiresAt?: string;
}

const sanitizeClientValue = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const cleaned = value
    .replace(/[^\w .()/:-]/g, '')
    .slice(0, 64)
    .trim();
  return cleaned || undefined;
};

class PlexPinAuth {
  private sessions = new Map<string, PinSession>();

  /**
   * Creates a Plex pin and returns the opaque session id plus the
   * app.plex.tv auth URL the client should open in its popup.
   *
   * Optional client hints (browser/OS names reported by the frontend) are
   * sanitized and forwarded so the entry in the user's Plex device list keeps
   * its current, recognizable naming (e.g. "Chrome (Streamarr)").
   */
  public async createPin(
    client?: PlexPinClientInfo
  ): Promise<PlexPinCreationResponse> {
    this.cleanup();

    const headers = this.buildHeaders(client);
    const response = await axios.post<PlexPinResponse>(
      'https://plex.tv/api/v2/pins?strong=true',
      undefined,
      { headers, timeout: 15000 }
    );

    const id = randomUUID();
    const plexExpiry = response.data.expiresAt
      ? Date.parse(response.data.expiresAt)
      : NaN;
    const expiresAt = Math.min(
      Number.isNaN(plexExpiry) ? Infinity : plexExpiry,
      Date.now() + PIN_SESSION_TTL_MS
    );

    this.sessions.set(id, {
      plexPinId: response.data.id,
      headers,
      expiresAt,
    });

    return {
      id,
      authUrl: this.buildAuthUrl(headers, response.data.code),
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Polls plex.tv for the pin's authorization state. Once authorized, the
   * token is stored server-side; the status response never includes it.
   */
  public async getStatus(id: string): Promise<PlexPinStatus> {
    const session = this.sessions.get(id);

    if (!session) {
      return 'expired';
    }

    if (session.authToken) {
      return 'authorized';
    }

    if (Date.now() >= session.expiresAt) {
      this.sessions.delete(id);
      return 'expired';
    }

    try {
      const response = await axios.get<PlexPinResponse>(
        `https://plex.tv/api/v2/pins/${session.plexPinId}`,
        { headers: session.headers, timeout: 15000 }
      );

      if (response.data.authToken) {
        session.authToken = response.data.authToken;
        return 'authorized';
      }
    } catch (e) {
      // Transient plex.tv errors shouldn't abort the sign-in; the client
      // will poll again. The session TTL bounds how long this can go on.
      logger.debug('Failed to poll Plex pin status; will retry', {
        label: 'Plex Pin Auth',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }

    return 'pending';
  }

  /**
   * Returns the auth token for an authorized pin session exactly once and
   * destroys the session. Returns null for unknown, expired, unauthorized,
   * or already-consumed sessions.
   */
  public consumeToken(id: string): string | null {
    const session = this.sessions.get(id);

    if (!session?.authToken) {
      return null;
    }

    this.sessions.delete(id);
    return session.authToken;
  }

  private buildHeaders(client?: PlexPinClientInfo): Record<string, string> {
    const settings = getSettings();
    const applicationTitle = settings.main.applicationTitle;
    const platform = sanitizeClientValue(client?.platform);

    return {
      Accept: 'application/json',
      'X-Plex-Product': applicationTitle,
      'X-Plex-Version': getAppVersion(),
      'X-Plex-Client-Identifier': settings.clientId,
      'X-Plex-Model': 'Plex OAuth',
      'X-Plex-Platform': platform ?? 'Web',
      'X-Plex-Platform-Version':
        sanitizeClientValue(client?.platformVersion) ?? '',
      'X-Plex-Device': sanitizeClientValue(client?.device) ?? 'Browser',
      'X-Plex-Device-Name': `${platform ?? 'Browser'} (${applicationTitle})`,
      'X-Plex-Device-Screen-Resolution':
        sanitizeClientValue(client?.screenResolution) ?? '',
      'X-Plex-Language': 'en',
    };
  }

  private buildAuthUrl(
    headers: Record<string, string>,
    pinCode: string
  ): string {
    const params: Record<string, string> = {
      clientID: headers['X-Plex-Client-Identifier'],
      'context[device][product]': headers['X-Plex-Product'],
      'context[device][version]': headers['X-Plex-Version'],
      'context[device][platform]': headers['X-Plex-Platform'],
      'context[device][platformVersion]': headers['X-Plex-Platform-Version'],
      'context[device][device]': headers['X-Plex-Device'],
      'context[device][deviceName]': headers['X-Plex-Device-Name'],
      'context[device][model]': headers['X-Plex-Model'],
      'context[device][screenResolution]':
        headers['X-Plex-Device-Screen-Resolution'],
      'context[device][layout]': 'desktop',
      code: pinCode,
    };

    const encoded = Object.entries(params)
      .map(([key, value]) => [key, value].map(encodeURIComponent).join('='))
      .join('&');

    return `https://app.plex.tv/auth/#!?${encoded}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now >= session.expiresAt + CLEANUP_GRACE_MS) {
        this.sessions.delete(id);
      }
    }
  }
}

const plexPinAuth = new PlexPinAuth();

/**
 * Resolves the Plex auth token for a login-style request body. Prefers the
 * server-side pin exchange (`pinId`); falls back to a raw `authToken` for
 * backward compatibility (deprecated — will be removed once all clients use
 * the pin flow).
 */
export const resolvePlexAuthToken = (body: {
  authToken?: string;
  pinId?: string;
}): string | null => {
  if (body.pinId) {
    return plexPinAuth.consumeToken(body.pinId);
  }

  return body.authToken ?? null;
};

export default plexPinAuth;
