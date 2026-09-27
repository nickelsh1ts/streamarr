const PUSH_ENDPOINT_HOSTS = [
  'android.googleapis.com',
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'push.services.opera.com',
  'web.push.apple.com',
  'notify.windows.com',
];

export const MAX_PUSH_SUBSCRIPTIONS_PER_USER = 50;
export const MAX_PUSH_USER_AGENT_LENGTH = 512;
const MAX_PUSH_ENDPOINT_LENGTH = 4096;

export const hasValidPushKeys = (p256dh: unknown, auth: unknown): boolean => {
  if (
    typeof p256dh !== 'string' ||
    typeof auth !== 'string' ||
    !/^[A-Za-z0-9_-]{87}$/.test(p256dh) ||
    !/^[A-Za-z0-9_-]{22}$/.test(auth)
  ) {
    return false;
  }

  const publicKey = Buffer.from(p256dh, 'base64url');
  const authSecret = Buffer.from(auth, 'base64url');
  return (
    publicKey.length === 65 && publicKey[0] === 4 && authSecret.length === 16
  );
};

export const isSupportedPushEndpoint = (endpoint: string): boolean => {
  if (
    typeof endpoint !== 'string' ||
    endpoint.length > MAX_PUSH_ENDPOINT_LENGTH
  ) {
    return false;
  }

  try {
    const url = new URL(endpoint);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === '443') &&
      PUSH_ENDPOINT_HOSTS.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`)
      )
    );
  } catch {
    return false;
  }
};
