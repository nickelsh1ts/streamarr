import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { getAppVersion } from '@server/utils/appVersion';
import axios from 'axios';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
  sign as cryptoSign,
} from 'crypto';

/**
 * Plex JWT device identity & lifecycle.
 *
 * Implements the flow:
 * one user-visible sign-in yields a legacy token (device = the shared
 * `settings.clientId`, used for PMS + the embedded /watch player), and the
 * server then silently provisions a SEPARATE per-user JWT device:
 *
 *   1. generate a per-user device identity (uuid + Ed25519 keypair)
 *   2. create a strong pin with the device's public JWK embedded
 *   3. authorize the pin server-side via PUT plex.tv/api/v2/pins/link,
 *      using the user's fresh legacy token (no browser interaction)
 *   4. exchange the pin with a signed deviceJWT -> 7-day Plex JWT
 *
 * HARD RULES:
 *   - NEVER call POST /api/v2/auth/jwk: it binds the key to the *token's*
 *     device regardless of the X-Plex-Client-Identifier header, which would
 *     target the shared legacy device.
 *   - NEVER mint a JWT under the shared `settings.clientId`: Plex
 *     invalidates a device's legacy token the moment a JWT is issued for
 *     that device, which would break PMS access and /watch for the user.
 *   - Always sign device JWTs with `iss` = the per-user device clientId;
 *     plex.tv enforces this strictly (error 1097 on mismatch).
 */

const JWT_SCOPE = 'username,email,friendly_name';
const DEVICE_JWT_TTL_SECONDS = 5 * 60;
const PIN_LINK_TIMEOUT_MS = 15000;
const ENCRYPTION_VERSION = 'v1';

export interface PlexJwtDevice {
  clientId: string;
  kid: string;
  privateKeyPem: string;
  publicJwk: {
    kty: string;
    crv: string;
    x: string;
    use: string;
    alg: string;
    kid: string;
  };
}

export interface PlexJwtResult {
  jwt: string;
  expiresAt: Date;
}

const b64u = (data: Buffer | string): string =>
  Buffer.from(data).toString('base64url');

export const generateDeviceIdentity = (): PlexJwtDevice => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const jwk = publicKey.export({ format: 'jwk' }) as {
    kty: string;
    crv: string;
    x: string;
  };

  // RFC 7638 thumbprint over the canonical {crv, kty, x} members
  const kid = b64u(
    createHash('sha256')
      .update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x }))
      .digest()
  );

  return {
    clientId: randomUUID(),
    kid,
    privateKeyPem: privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString(),
    publicJwk: {
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      use: 'sig',
      alg: 'EdDSA',
      kid,
    },
  };
};

const signDeviceJwt = (
  device: PlexJwtDevice,
  extraClaims: Record<string, unknown> = {}
): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'EdDSA', typ: 'JWT', kid: device.kid };
  const payload = {
    aud: 'plex.tv',
    iss: device.clientId,
    iat: now,
    exp: now + DEVICE_JWT_TTL_SECONDS,
    scope: JWT_SCOPE,
    ...extraClaims,
  };

  const signingInput = `${b64u(JSON.stringify(header))}.${b64u(
    JSON.stringify(payload)
  )}`;
  const signature = cryptoSign(
    null,
    Buffer.from(signingInput),
    createPrivateKey(device.privateKeyPem)
  );

  return `${signingInput}.${b64u(signature)}`;
};

export const decodeJwtExpiry = (jwt: string): Date | null => {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    ) as { exp?: number };
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
};

const looksLikeJwt = (token: unknown): token is string =>
  typeof token === 'string' && token.split('.').length === 3;

const deviceHeaders = (clientId: string): Record<string, string> => {
  const settings = getSettings();
  return {
    Accept: 'application/json',
    'X-Plex-Product': settings.main.applicationTitle,
    'X-Plex-Version': getAppVersion(),
    'X-Plex-Client-Identifier': clientId,
    'X-Plex-Platform': 'Streamarr',
    'X-Plex-Device': 'Server',
    'X-Plex-Device-Name': `${settings.main.applicationTitle} (Secure Auth)`,
  };
};

/**
 * Provisions a JWT for a user from their freshly obtained legacy token.
 * The legacy token remains valid: the pin (and therefore the JWT) is bound
 * to the brand-new per-user device, not the shared legacy device.
 */
export const provisionJwt = async (
  legacyToken: string
): Promise<{ device: PlexJwtDevice } & PlexJwtResult> => {
  const settings = getSettings();
  const device = generateDeviceIdentity();
  const headers = deviceHeaders(device.clientId);

  // 1. Strong pin with the device's public JWK embedded
  const pinResponse = await axios.post<{ id: number; code: string }>(
    'https://clients.plex.tv/api/v2/pins',
    { jwk: device.publicJwk, strong: true },
    {
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: PIN_LINK_TIMEOUT_MS,
    }
  );

  // 2. Authorize the pin server-side with the user's legacy token. The
  //    authorizing device is the shared legacy device (settings.clientId),
  //    matching the device the legacy token is bound to.
  await axios.put(
    'https://plex.tv/api/v2/pins/link',
    new URLSearchParams({ code: pinResponse.data.code }).toString(),
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Plex-Product': settings.main.applicationTitle,
        'X-Plex-Version': getAppVersion(),
        'X-Plex-Client-Identifier': settings.clientId,
        'X-Plex-Token': legacyToken,
      },
      timeout: PIN_LINK_TIMEOUT_MS,
    }
  );

  // 3. Exchange the linked pin with a signed deviceJWT for the Plex JWT
  const exchangeResponse = await axios.get<{ authToken?: string | null }>(
    `https://clients.plex.tv/api/v2/pins/${pinResponse.data.id}`,
    {
      headers,
      params: { deviceJWT: signDeviceJwt(device) },
      timeout: PIN_LINK_TIMEOUT_MS,
    }
  );

  const jwt = exchangeResponse.data.authToken;
  if (!looksLikeJwt(jwt)) {
    throw new Error(
      'Plex pin exchange did not return a JWT after server-side link.'
    );
  }

  const expiresAt = decodeJwtExpiry(jwt);
  if (!expiresAt) {
    throw new Error('Unable to determine expiry of the issued Plex JWT.');
  }

  return { device, jwt, expiresAt };
};

/**
 * Refreshes a device's JWT via the nonce exchange. Works before and after
 * expiry of the previous JWT.
 */
export const refreshJwt = async (
  device: PlexJwtDevice
): Promise<PlexJwtResult> => {
  const headers = deviceHeaders(device.clientId);

  const nonceResponse = await axios.get<{ nonce: string }>(
    'https://clients.plex.tv/api/v2/auth/nonce',
    { headers, timeout: PIN_LINK_TIMEOUT_MS }
  );

  const tokenResponse = await axios.post<{
    auth_token?: string;
    authToken?: string;
  }>(
    'https://clients.plex.tv/api/v2/auth/token',
    { jwt: signDeviceJwt(device, { nonce: nonceResponse.data.nonce }) },
    {
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: PIN_LINK_TIMEOUT_MS,
    }
  );

  const jwt = tokenResponse.data.auth_token ?? tokenResponse.data.authToken;
  if (!looksLikeJwt(jwt)) {
    throw new Error('Plex JWT refresh did not return a JWT.');
  }

  const expiresAt = decodeJwtExpiry(jwt);
  if (!expiresAt) {
    throw new Error('Unable to determine expiry of the refreshed Plex JWT.');
  }

  return { jwt, expiresAt };
};

/**
 * Device identity encryption at rest (AES-256-GCM, key derived from the
 * session secret). If the secret changes, decryption fails and the device is
 * treated as missing — the user keeps working on their legacy token and is
 * re-provisioned at next sign-in.
 */
const encryptionKey = (): Buffer =>
  createHash('sha256').update(getSettings().sessionSecret).digest();

export const encryptDevice = (device: PlexJwtDevice): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(device), 'utf8'),
    cipher.final(),
  ]);
  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
};

export const decryptDevice = (encrypted: string): PlexJwtDevice | null => {
  try {
    const [version, iv, tag, ciphertext] = encrypted.split(':');
    if (version !== ENCRYPTION_VERSION || !iv || !tag || !ciphertext) {
      return null;
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      Buffer.from(iv, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plaintext) as PlexJwtDevice;
  } catch (e) {
    logger.debug('Failed to decrypt Plex JWT device identity', {
      label: 'Plex JWT',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
};
