import CalibreWebAPI, {
  type CalibreWebConnection,
} from '@server/api/calibreweb';
import { getSettings } from '@server/lib/settings';

export function getCalibreWebAPI(
  settings: CalibreWebConnection
): CalibreWebAPI {
  return new CalibreWebAPI(
    CalibreWebAPI.buildUrl(settings),
    {},
    {
      timeout: getSettings().network.requestTimeout,
    }
  );
}

export class CalibreWebUsernameConflictError extends Error {}

/** Detects a SQLite unique-constraint violation from a concurrent link request. */
export function isUniqueConstraintError(e: unknown): boolean {
  return e instanceof Error && /unique constraint/i.test(e.message);
}

/** Headers the proxy sets itself; a custom auth header name must not collide with these. */
const RESERVED_PROXY_HEADERS = new Set([
  'x-script-name',
  'x-forwarded-prefix',
  'x-scheme',
  'x-forwarded-host',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-real-ip',
  'x-remote-email',
  'host',
  'content-length',
  'transfer-encoding',
  'connection',
]);

// RFC 7230 token characters.
const HEADER_TOKEN_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** Validates a user-supplied reverse-proxy header name, returning an error message if invalid. An empty name is valid (header auth disabled). */
export function validateHeaderAuthName(name: string): string | null {
  if (!name) {
    return null;
  }
  if (!HEADER_TOKEN_REGEX.test(name)) {
    return 'Header name must be a valid HTTP header token.';
  }
  if (RESERVED_PROXY_HEADERS.has(name.toLowerCase())) {
    return `"${name}" is reserved and cannot be used as the header name.`;
  }
  return null;
}
