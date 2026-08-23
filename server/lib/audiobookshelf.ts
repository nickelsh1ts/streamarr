import AudiobookshelfAPI, {
  type AudiobookshelfConnection,
  type User as AudiobookshelfUser,
} from '@server/api/audiobookshelf';
import type { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const SECRET_ENCRYPTION_VERSION = 'v1';

const secretEncryptionKey = (): Buffer =>
  createHash('sha256')
    .update(`${getSettings().sessionSecret}:audiobookshelf`)
    .digest();

/**
 * At-rest encryption (AES-256-GCM) for the Audiobookshelf password we
 * generate and store per user, so we can silently re-authenticate them.
 */
export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [
    SECRET_ENCRYPTION_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decryptSecret(encrypted: string): string | null {
  try {
    const [version, iv, tag, ciphertext] = encrypted.split(':');
    if (version !== SECRET_ENCRYPTION_VERSION || !iv || !tag || !ciphertext) {
      return null;
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      secretEncryptionKey(),
      Buffer.from(iv, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}

export function getAudiobookshelfAPI(
  settings: AudiobookshelfConnection
): AudiobookshelfAPI {
  return new AudiobookshelfAPI(
    AudiobookshelfAPI.buildUrl(settings),
    {},
    {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
      },
      timeout: getSettings().network.requestTimeout,
    }
  );
}

export async function revokeAudiobookshelfSession(
  refreshToken: string
): Promise<void> {
  const settings = getSettings().audiobookshelf;
  if (!settings.enabled || !settings.hostname || !settings.apiKey) {
    return;
  }

  await getAudiobookshelfAPI(settings).logout(refreshToken);
}

export function getAudiobookshelfUsernameCandidate(user: User): string {
  const candidate =
    user.username || user.plexUsername || user.email.split('@')[0];
  return candidate.trim() || `streamarr-${user.id}`;
}

/** Finds a pre-existing Audiobookshelf account likely belonging to this user, by email or username. */
export async function findAudiobookshelfAccount(
  user: User,
  api: AudiobookshelfAPI
): Promise<AudiobookshelfUser | undefined> {
  const identities = [
    user.username,
    user.plexUsername,
    user.email.split('@')[0],
  ]
    .filter((identity): identity is string => Boolean(identity?.trim()))
    .map((identity) => identity.toLocaleLowerCase());
  const users = await api.getAllUsers();

  const matched = users.find(
    (existingUser) =>
      existingUser.email?.toLocaleLowerCase() ===
        user.email.toLocaleLowerCase() ||
      identities.includes(existingUser.username.toLocaleLowerCase())
  );
  if (matched) {
    return matched;
  }

  if (!user.hasPermission(Permission.ADMIN) || user.id !== 1) {
    return undefined;
  }

  return users.find((existingUser) => existingUser.type === 'root');
}

/** Default Audiobookshelf permissions granted to accounts Streamarr creates. */
export const AUDIOBOOKSHELF_DEFAULT_PERMISSIONS = {
  download: false,
  update: false,
  delete: false,
  upload: false,
  accessAllLibraries: true,
  accessAllTags: true,
  accessExplicitContent: true,
} as const;
