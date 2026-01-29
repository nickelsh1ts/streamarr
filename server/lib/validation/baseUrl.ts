import { getSettings } from '@server/lib/settings';

const RESERVED_PATHS = [
  '/api',
  '/signin',
  '/logout',
  '/setup',
  '/admin',
  '/profile',
  '/settings',
  '/web',
  '/request',
  '/invites',
  '/imageproxy',
  '/logo',
  '/api-docs',
  '/watch',
  '/schedule',
  '/help',
  '/signup',
  '/resetpassword',
  '/_next',
  '/offline.html',
];

export interface BaseUrlValidationResult {
  valid: boolean;
  error?: string;
}

export type ServiceType =
  | 'radarr'
  | 'sonarr'
  | 'lidarr'
  | 'bazarr'
  | 'prowlarr'
  | 'other';

/**
 * Validates a baseUrl/urlBase for proxy paths.
 * Checks format, reserved paths, and uniqueness across services.
 */
export function validateBaseUrl(
  baseUrl: string | undefined,
  serviceType: ServiceType,
  currentId?: number | string
): BaseUrlValidationResult {
  if (!baseUrl) {
    return { valid: true };
  }

  if (!baseUrl.startsWith('/')) {
    return { valid: false, error: 'URL Base must start with /' };
  }

  if (baseUrl.endsWith('/') && baseUrl !== '/') {
    return { valid: false, error: 'URL Base must not end with /' };
  }

  const normalizedPath = baseUrl.toLowerCase();
  const isReserved = RESERVED_PATHS.some(
    (r) => normalizedPath === r || normalizedPath.startsWith(`${r}/`)
  );
  if (isReserved) {
    return {
      valid: false,
      error: `"${baseUrl}" is a not a valid base URL as it conflicts with streamarr reserved paths.`,
    };
  }

  const settings = getSettings();
  const allPaths: {
    path: string;
    name: string;
    type: ServiceType;
    id?: number | string;
  }[] = [];

  if (settings.plex.ip) {
    allPaths.push({ path: '/web', name: 'Plex', type: 'other' });
  }

  // DVR services (arrays with baseUrl)
  for (const s of settings.radarr) {
    if (s.baseUrl)
      allPaths.push({
        path: s.baseUrl,
        name: s.name,
        type: 'radarr',
        id: s.id,
      });
  }

  for (const s of settings.sonarr) {
    if (s.baseUrl)
      allPaths.push({
        path: s.baseUrl,
        name: s.name,
        type: 'sonarr',
        id: s.id,
      });
  }

  // Single service settings (with urlBase)
  const singleServices: {
    settings: { urlBase?: string };
    name: string;
    type: ServiceType;
  }[] = [
    { settings: settings.lidarr, name: 'Lidarr', type: 'lidarr' },
    { settings: settings.bazarr, name: 'Bazarr', type: 'bazarr' },
    { settings: settings.prowlarr, name: 'Prowlarr', type: 'prowlarr' },
  ];

  for (const svc of singleServices) {
    if (svc.settings.urlBase) {
      allPaths.push({
        path: svc.settings.urlBase,
        name: svc.name,
        type: svc.type,
        id: svc.type, // Use type as id for single services
      });
    }
  }

  const duplicate = allPaths.find(
    (p) =>
      p.path.toLowerCase() === normalizedPath &&
      !(p.type === serviceType && p.id === currentId)
  );

  if (duplicate) {
    return {
      valid: false,
      error: `URL Base is already in use by ${duplicate.name} (${duplicate.type})`,
    };
  }

  return { valid: true };
}
