// Placeholder origin so parsing works the same on the server and the client
const BASE = 'http://streamarr.invalid';

const BLOCKED_PATHS = /^\/(signin|signup|logout|setup|api)(\/|$)/;

export const getSafeRedirect = (
  value: string | null | undefined,
  fallback = '/watch'
): string => {
  if (!value?.startsWith('/')) {
    return fallback;
  }

  try {
    const url = new URL(value, BASE);
    if (
      url.origin !== BASE ||
      url.pathname.startsWith('//') ||
      BLOCKED_PATHS.test(url.pathname)
    ) {
      return fallback;
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
};
