import { randomUUID } from 'crypto';
import fs from 'fs';
import { merge } from 'lodash';
import path from 'path';
import webpush from 'web-push';
import { Permission } from './permissions';

export interface Library {
  id: string;
  name: string;
  enabled: boolean;
  type: 'show' | 'movie';
  lastScan?: number;
  mediaCount?: number;
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface PlexSettings {
  name: string;
  machineId?: string;
  ip: string;
  port: number;
  useSsl?: boolean;
  libraries: Library[];
  webAppUrl?: string;
}

export interface TautulliSettings {
  hostname?: string;
  port?: number;
  useSsl?: boolean;
  urlBase?: string;
  apiKey?: string;
  externalUrl?: string;
}

export interface ServiceSettings {
  enabled: boolean;
  externalUrl?: string;
  urlBase?: string;
  id?: string;
}

export interface DVRSettings {
  id: number;
  name: string;
  hostname: string;
  port: number;
  apiKey: string;
  useSsl: boolean;
  baseUrl?: string;
  activeProfileId?: number;
  activeProfileName?: string;
  activeDirectory?: string;
  tags?: number[];
  is4k: boolean;
  isDefault: boolean;
  externalUrl?: string;
  syncEnabled: boolean;
  preventSearch?: boolean;
  tagRequests?: boolean;
}

export interface RadarrSettings extends DVRSettings {
  minimumAvailability?: string;
}

export interface SonarrSettings extends DVRSettings {
  seriesType?: 'standard' | 'daily' | 'anime';
}

interface Quota {
  quotaLimit?: number;
  quotaDays?: number;
  quotaUsage?: number;
  quotaExpiryLimit?: number;
  quotaExpiryTime?: 'days' | 'weeks' | 'months';
}

export interface MainSettings {
  apiKey: string;
  applicationTitle: string;
  applicationUrl: string;
  csrfProtection: boolean;
  cacheImages: boolean;
  defaultPermissions: number;
  defaultQuotas: {
    invites: Quota;
  };
  sharedLibraries: string;
  downloads: boolean;
  liveTv: boolean;
  plexHome: boolean;
  localLogin: boolean;
  newPlexLogin: boolean;
  enableSignUp: boolean;
  releaseSched: boolean;
  trustProxy: boolean;
  locale: string;
  supportUrl: string;
  supportEmail: string;
  extendedHome: boolean;
}

interface PublicSettings {
  initialized: boolean;
}

interface FullPublicSettings extends PublicSettings {
  applicationTitle: string;
  applicationUrl: string;
  localLogin: boolean;
  cacheImages: boolean;
  vapidPublic: string;
  enablePushRegistration: boolean;
  locale: string;
  emailEnabled: boolean;
  newPlexLogin: boolean;
  supportUrl: string;
  supportEmail: string;
  extendedHome: boolean;
  enableSignUp: boolean;
  statsUrl: string;
  releaseSched: boolean;
  statusUrl: string;
  statusEnabled: boolean;
}

export interface NotificationAgentConfig {
  enabled: boolean;
  types?: number;
  options: Record<string, unknown>;
}

export interface NotificationAgentEmail extends NotificationAgentConfig {
  options: {
    emailFrom: string;
    smtpHost: string;
    smtpPort: number;
    secure: boolean;
    ignoreTls: boolean;
    requireTls: boolean;
    authUser?: string;
    authPass?: string;
    allowSelfSigned: boolean;
    senderName: string;
    pgpPrivateKey?: string;
    pgpPassword?: string;
  };
}

export interface NotificationAgentWebhook extends NotificationAgentConfig {
  options: { webhookUrl: string; jsonPayload: string; authHeader?: string };
}

export enum NotificationAgentKey {
  EMAIL = 'email',
  WEBPUSH = 'webpush',
}

interface NotificationAgents {
  email: NotificationAgentEmail;
  webpush: NotificationAgentConfig;
}

interface NotificationSettings {
  agents: NotificationAgents;
}

interface JobSettings {
  schedule: string;
}

export type JobId =
  | 'plex-full-scan'
  | 'plex-refresh-token'
  | 'invites-qrcode-cleanup'
  | 'image-cache-cleanup';

interface AllSettings {
  clientId: string;
  vapidPublic: string;
  vapidPrivate: string;
  main: MainSettings;
  plex: PlexSettings;
  tautulli: TautulliSettings;
  radarr: RadarrSettings[];
  sonarr: SonarrSettings[];
  uptime: ServiceSettings;
  downloads: ServiceSettings;
  tdarr: ServiceSettings;
  bazarr: ServiceSettings;
  prowlarr: ServiceSettings;
  lidarr: ServiceSettings;
  overseerr: ServiceSettings;
  public: PublicSettings;
  notifications: NotificationSettings;
  jobs: Record<JobId, JobSettings>;
}

const SETTINGS_PATH = process.env.CONFIG_DIRECTORY
  ? `${process.env.CONFIG_DIRECTORY}/settings.json`
  : path.join(__dirname, '../../config/settings.json');

class Settings {
  private data: AllSettings;

  constructor(initialSettings?: AllSettings) {
    this.data = {
      clientId: randomUUID(),
      vapidPrivate: '',
      vapidPublic: '',
      main: {
        apiKey: '',
        applicationTitle: 'Streamarr',
        applicationUrl: '',
        csrfProtection: false,
        cacheImages: false,
        defaultPermissions: Permission.NONE,
        defaultQuotas: {
          invites: {},
        },
        sharedLibraries: '',
        downloads: true,
        liveTv: false,
        plexHome: false,
        localLogin: true,
        newPlexLogin: true,
        enableSignUp: false,
        releaseSched: false,
        trustProxy: false,
        locale: 'en',
        supportUrl: '',
        supportEmail: '',
        extendedHome: true,
      },
      plex: {
        name: '',
        ip: '',
        port: 32400,
        useSsl: false,
        webAppUrl: '/web/index.html',
        libraries: [],
      },
      tautulli: {},
      radarr: [],
      sonarr: [],
      uptime: {
        enabled: false,
        externalUrl: 'https://status.streamarr.dev',
      },
      downloads: {
        enabled: false,
        urlBase: '/admin/qbt',
      },
      tdarr: {
        enabled: false,
        urlBase: '/admin/tdarr',
      },
      bazarr: {
        enabled: false,
        urlBase: '/admin/bazarr',
      },
      prowlarr: {
        enabled: false,
        urlBase: '/admin/prowlarr',
      },
      lidarr: {
        enabled: false,
        urlBase: '/admin/lidarr',
      },
      overseerr: {
        enabled: false,
        urlBase: '/overseerr',
      },
      public: { initialized: false },
      notifications: {
        agents: {
          email: {
            enabled: false,
            options: {
              emailFrom: '',
              smtpHost: '',
              smtpPort: 587,
              secure: false,
              ignoreTls: false,
              requireTls: false,
              allowSelfSigned: false,
              senderName: 'Streamarr',
            },
          },
          webpush: { enabled: false, options: {} },
        },
      },
      jobs: {
        'plex-full-scan': { schedule: '0 0 3 * * *' },
        'plex-refresh-token': { schedule: '0 0 5 * * *' },
        'image-cache-cleanup': { schedule: '0 0 5 * * *' },
        'invites-qrcode-cleanup': { schedule: '0 0 1 * * *' },
      },
    };
    if (initialSettings) {
      this.data = merge(this.data, initialSettings);
    }
  }

  get main(): MainSettings {
    if (!this.data.main.apiKey) {
      this.data.main.apiKey = this.generateApiKey();
      this.save();
    }
    return this.data.main;
  }

  set main(data: MainSettings) {
    this.data.main = data;
  }

  get plex(): PlexSettings {
    return this.data.plex;
  }

  set plex(data: PlexSettings) {
    this.data.plex = data;
  }

  get tautulli(): TautulliSettings {
    return this.data.tautulli;
  }

  set tautulli(data: TautulliSettings) {
    this.data.tautulli = data;
  }

  get uptime(): ServiceSettings {
    return this.data.uptime;
  }

  set uptime(data: ServiceSettings) {
    this.data.uptime = data;
  }

  get downloads(): ServiceSettings {
    return this.data.downloads;
  }

  set downloads(data: ServiceSettings) {
    this.data.downloads = data;
  }

  get tdarr(): ServiceSettings {
    return this.data.tdarr;
  }

  set tdarr(data: ServiceSettings) {
    this.data.tdarr = data;
  }

  get bazarr(): ServiceSettings {
    return this.data.bazarr;
  }

  set bazarr(data: ServiceSettings) {
    this.data.bazarr = data;
  }

  get radarr(): RadarrSettings[] {
    return this.data.radarr;
  }

  get prowlarr(): ServiceSettings {
    return this.data.prowlarr;
  }

  set prowlarr(data: ServiceSettings) {
    this.data.prowlarr = data;
  }

  get lidarr(): ServiceSettings {
    return this.data.lidarr;
  }

  set lidarr(data: ServiceSettings) {
    this.data.lidarr = data;
  }

  get overseerr(): ServiceSettings {
    return this.data.overseerr;
  }

  set overseerr(data: ServiceSettings) {
    this.data.overseerr = data;
  }

  set radarr(data: RadarrSettings[]) {
    this.data.radarr = data;
  }

  get sonarr(): SonarrSettings[] {
    return this.data.sonarr;
  }

  set sonarr(data: SonarrSettings[]) {
    this.data.sonarr = data;
  }

  get public(): PublicSettings {
    return this.data.public;
  }

  set public(data: PublicSettings) {
    this.data.public = data;
  }

  get fullPublicSettings(): FullPublicSettings {
    return {
      ...this.data.public,
      applicationTitle: this.data.main.applicationTitle,
      applicationUrl: this.data.main.applicationUrl,
      localLogin: this.data.main.localLogin,
      cacheImages: this.data.main.cacheImages,
      vapidPublic: this.vapidPublic,
      enablePushRegistration: this.data.notifications.agents.webpush.enabled,
      locale: this.data.main.locale,
      emailEnabled: this.data.notifications.agents.email.enabled,
      newPlexLogin: this.data.main.newPlexLogin,
      supportUrl: this.data.main.supportUrl,
      supportEmail: this.data.main.supportEmail,
      extendedHome: this.data.main.extendedHome,
      enableSignUp: this.data.main.enableSignUp,
      statsUrl: this.data.tautulli.externalUrl,
      releaseSched: this.data.main.releaseSched,
      statusUrl: this.data.uptime.externalUrl,
      statusEnabled: this.data.uptime.enabled,
    };
  }

  get notifications(): NotificationSettings {
    return this.data.notifications;
  }

  set notifications(data: NotificationSettings) {
    this.data.notifications = data;
  }

  get jobs(): Record<JobId, JobSettings> {
    return this.data.jobs;
  }

  set jobs(data: Record<JobId, JobSettings>) {
    this.data.jobs = data;
  }

  get clientId(): string {
    if (!this.data.clientId) {
      this.data.clientId = randomUUID();
      this.save();
    }

    return this.data.clientId;
  }

  get vapidPublic(): string {
    this.generateVapidKeys();

    return this.data.vapidPublic;
  }

  get vapidPrivate(): string {
    this.generateVapidKeys();

    return this.data.vapidPrivate;
  }

  public regenerateApiKey(): MainSettings {
    this.main.apiKey = this.generateApiKey();
    this.save();
    return this.main;
  }

  private generateApiKey(): string {
    return Buffer.from(`${Date.now()}${randomUUID()}`).toString('base64');
  }

  private generateVapidKeys(force = false): void {
    if (!this.data.vapidPublic || !this.data.vapidPrivate || force) {
      const vapidKeys = webpush.generateVAPIDKeys();
      this.data.vapidPrivate = vapidKeys.privateKey;
      this.data.vapidPublic = vapidKeys.publicKey;
      this.save();
    }
  }

  /**
   * Settings Load
   *
   * This will load settings from file unless an optional argument of the object structure
   * is passed in.
   * @param overrideSettings If passed in, will override all existing settings with these
   * values
   */
  public load(overrideSettings?: AllSettings): Settings {
    if (overrideSettings) {
      this.data = overrideSettings;
      return this;
    }

    if (!fs.existsSync(SETTINGS_PATH)) {
      this.save();
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');

    if (data) {
      this.data = merge(this.data, JSON.parse(data));
      this.save();
    }
    return this;
  }

  public save(): void {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(this.data, undefined, ' '));
  }
}

let settings: Settings | undefined;

export const getSettings = (initialSettings?: AllSettings): Settings => {
  if (!settings) {
    settings = new Settings(initialSettings);
  }

  return settings;
};

export default Settings;
