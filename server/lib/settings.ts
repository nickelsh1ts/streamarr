import { runMigrations } from '@server/lib/migrator';
import { randomBytes, randomUUID } from 'crypto';
import fs from 'fs';
import { mergeWith } from 'lodash';
import path from 'path';
import webpush from 'web-push';
import { Permission } from './permissions';

const mergeSettings = <T>(current: T, incoming: Partial<T>): T =>
  mergeWith({}, current, incoming, (_objValue, srcValue) =>
    Array.isArray(srcValue) ? srcValue : undefined
  ) as T;

export interface Library {
  id: string;
  name: string;
  enabled: boolean;
  type: 'show' | 'movie' | 'artist' | 'photo' | 'live TV' | 'other';
  lastScan?: number;
  mediaCount?: number;
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export type PivotOption = 'library' | 'collections' | 'categories';

export interface PlexSettings {
  name: string;
  machineId?: string;
  ip: string;
  port: number;
  useSsl?: boolean;
  libraries: Library[];
  enablePlaylists?: boolean;
  defaultPivot?: PivotOption;
}

export interface TautulliSettings {
  enabled?: boolean;
  hostname?: string;
  port?: number;
  useSsl?: boolean;
  urlBase?: string;
  apiKey?: string;
}

export interface ServiceSettings {
  enabled: boolean;
  hostname?: string;
  port?: number;
  useSsl?: boolean;
  externalUrl?: string;
  urlBase?: string;
  id?: string;
  apiKey?: string;
}

export interface NetworkSettings {
  requestTimeout: number;
  trustProxy: boolean;
  csrfProtection: boolean;
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
  pastDays?: number;
  futureDays?: number;
  preventSearch?: boolean;
  tagRequests?: boolean;
}

export interface RadarrSettings extends DVRSettings {
  minimumAvailability?: string;
}

export interface SonarrSettings extends DVRSettings {
  seriesType?: 'standard' | 'daily' | 'anime';
}

export type DownloadClientType = 'qbittorrent' | 'deluge' | 'transmission';

export interface DownloadClientSettings {
  id: number;
  name: string;
  client: DownloadClientType;
  hostname: string;
  port: number;
  useSsl: boolean;
  username?: string;
  password?: string;
  externalUrl?: string;
}

interface Quota {
  quotaLimit?: number;
  quotaDays?: number;
  quotaUsage?: number;
  quotaExpiryLimit?: number;
  quotaExpiryTime?: 'days' | 'weeks' | 'months';
}

export interface Theme {
  primary: string;
  'primary-content': string;
  secondary: string;
  'secondary-content': string;
  accent: string;
  'accent-content': string;
  neutral: string;
  'neutral-content': string;
  'base-100': string;
  'base-200': string;
  'base-300': string;
  'base-content': string;
  info: string;
  'info-content': string;
  success: string;
  'success-content': string;
  warning: string;
  'warning-content': string;
  error: string;
  'error-content': string;
}

export interface MainSettings {
  apiKey: string;
  applicationTitle: string;
  applicationUrl: string;
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
  locale: string;
  supportUrl: string;
  supportEmail: string;
  extendedHome: boolean;
  libraryCounts?: boolean;
  customLogo?: string;
  customLogoSmall?: string;
  enableTrialPeriod: boolean;
  trialPeriodDays: number;
  trialPeriodOutcome: 'promote' | 'deactivate';
  enableHelpCentre: boolean;
  theme: Theme;
}

interface PublicSettings {
  initialized: boolean;
}

export interface FullPublicSettings extends PublicSettings {
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
  libraryCounts?: boolean;
  customLogo?: string;
  customLogoSmall?: string;
  enableSignUp: boolean;
  enableHelpCentre: boolean;
  enableTrialPeriod: boolean;
  trialPeriodDays: number;
  trialPeriodOutcome: 'promote' | 'deactivate';
  defaultInviteQuotas: {
    quotaLimit?: number;
    quotaDays?: number;
    quotaUsage?: number;
    quotaExpiryLimit?: number;
    quotaExpiryTime?: string;
  };
  seerrEnabled: boolean;
  statusUrl: string;
  statusEnabled: boolean;
  theme: Theme;
  plexClientIdentifier: string;
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
  options: {
    webhookUrl: string;
    jsonPayload: string;
    authHeader?: string;
    customHeaders?: { key: string; value: string }[];
    supportVariables?: boolean;
  };
}

export interface NotificationAgentDiscord extends NotificationAgentConfig {
  options: {
    webhookUrl: string;
    webhookRoleId?: string;
    enableMentions: boolean;
    botUsername?: string;
    botAvatarUrl?: string;
  };
}

export interface NotificationAgentSlack extends NotificationAgentConfig {
  options: {
    webhookUrl: string;
  };
}

export interface NotificationAgentTelegram extends NotificationAgentConfig {
  options: {
    botAPI: string;
    botUsername?: string;
    chatId: string;
    messageThreadId?: string;
    sendSilently: boolean;
  };
}

export interface NotificationAgentPushbullet extends NotificationAgentConfig {
  options: {
    accessToken: string;
    channelTag?: string;
  };
}

export interface NotificationAgentPushover extends NotificationAgentConfig {
  options: {
    accessToken: string;
    userToken: string;
    sound: string;
  };
}

export interface NotificationAgentGotify extends NotificationAgentConfig {
  options: {
    url: string;
    token: string;
    priority: number;
  };
}

export interface NotificationAgentNtfy extends NotificationAgentConfig {
  options: {
    url: string;
    topic: string;
    authMethod?: 'none' | 'usernamePassword' | 'token';
    username?: string;
    password?: string;
    token?: string;
    priority?: number;
  };
}

export enum NotificationAgentKey {
  DISCORD = 'discord',
  EMAIL = 'email',
  GOTIFY = 'gotify',
  NTFY = 'ntfy',
  PUSHBULLET = 'pushbullet',
  PUSHOVER = 'pushover',
  SLACK = 'slack',
  TELEGRAM = 'telegram',
  WEBHOOK = 'webhook',
  WEBPUSH = 'webpush',
  IN_APP = 'inApp',
}

export interface NotificationAgents {
  discord: NotificationAgentDiscord;
  email: NotificationAgentEmail;
  gotify: NotificationAgentGotify;
  ntfy: NotificationAgentNtfy;
  pushbullet: NotificationAgentPushbullet;
  pushover: NotificationAgentPushover;
  slack: NotificationAgentSlack;
  telegram: NotificationAgentTelegram;
  webhook: NotificationAgentWebhook;
  webpush: NotificationAgentConfig;
  inApp: NotificationAgentConfig;
}

interface NotificationSettings {
  agents: NotificationAgents;
}

export interface OnboardingSettings {
  initialized: boolean;
  adminOnboardingCompleted: boolean;
  welcomeEnabled: boolean;
  tutorialEnabled: boolean;
  tutorialMode: 'spotlight' | 'wizard' | 'both';
  allowSkipWelcome: boolean;
  allowSkipTutorial: boolean;
  tutorialAutostart: boolean;
  tutorialAutostartDelay: number;
}

interface JobSettings {
  schedule: string;
}

export type JobId =
  | 'plex-full-scan'
  | 'plex-refresh-token'
  | 'invites-qrcode-cleanup'
  | 'image-cache-cleanup'
  | 'notification-cleanup'
  | 'trial-expiry'
  | 'plex-membership-check';

export interface AllSettings {
  clientId: string;
  sessionSecret?: string;
  vapidPublic: string;
  vapidPrivate: string;
  main: MainSettings;
  network: NetworkSettings;
  plex: PlexSettings;
  tautulli: TautulliSettings;
  radarr: RadarrSettings[];
  sonarr: SonarrSettings[];
  uptime: ServiceSettings;
  downloads: DownloadClientSettings[];
  tdarr: ServiceSettings;
  bazarr: ServiceSettings;
  prowlarr: ServiceSettings;
  lidarr: ServiceSettings;
  overseerr: ServiceSettings;
  public: PublicSettings;
  notifications: NotificationSettings;
  onboarding: OnboardingSettings;
  jobs: Record<JobId, JobSettings>;
}

const SETTINGS_PATH = path.resolve(
  process.env.CONFIG_DIRECTORY
    ? `${process.env.CONFIG_DIRECTORY}/settings.json`
    : path.join(__dirname, '../../config/settings.json')
);

class Settings {
  private data: AllSettings;

  constructor(initialSettings?: AllSettings) {
    this.data = {
      clientId: randomUUID(),
      sessionSecret: '',
      vapidPrivate: '',
      vapidPublic: '',
      main: {
        apiKey: '',
        applicationTitle: 'Streamarr',
        applicationUrl: '',
        cacheImages: false,
        defaultPermissions: Permission.STREAMARR,
        defaultQuotas: {
          invites: {
            quotaLimit: 3,
            quotaDays: 0,
            quotaUsage: 1,
            quotaExpiryLimit: 1,
            quotaExpiryTime: 'days' as const,
          },
        },
        sharedLibraries: 'all',
        downloads: true,
        liveTv: false,
        plexHome: false,
        localLogin: true,
        newPlexLogin: true,
        enableSignUp: false,
        releaseSched: false,
        locale: 'en',
        supportUrl: '',
        supportEmail: '',
        extendedHome: true,
        libraryCounts: true,
        enableTrialPeriod: false,
        trialPeriodDays: 30,
        trialPeriodOutcome: 'promote',
        enableHelpCentre: true,
        theme: {
          primary: '#974ede',
          'primary-content': '#fff',
          secondary: '#080011',
          'secondary-content': '#cfcbdc',
          accent: '#e5a00d',
          'accent-content': '#fff',
          neutral: '#737373',
          'neutral-content': '#e0e2e4',
          'base-100': '#121212',
          'base-200': '#161616',
          'base-300': '#1f1f1f',
          'base-content': '#fff',
          info: '#2563eb',
          'info-content': '#d2e2ff',
          success: '#84cc16',
          'success-content': '#fff',
          warning: '#ffc107',
          'warning-content': '#fff',
          error: '#b91c1c',
          'error-content': '#fff',
        },
      },
      plex: {
        name: '',
        ip: '',
        port: 32400,
        useSsl: false,
        libraries: [],
        enablePlaylists: false,
        defaultPivot: 'library',
      },
      network: {
        requestTimeout: 10000,
        trustProxy: false,
        csrfProtection: false,
      },
      tautulli: {
        enabled: false,
        urlBase: '/tautulli',
      },
      radarr: [],
      sonarr: [],
      uptime: {
        enabled: false,
        externalUrl: 'https://status.streamarr.dev',
      },
      downloads: [],
      tdarr: {
        enabled: false,
      },
      bazarr: {
        enabled: false,
        urlBase: '/bazarr',
      },
      prowlarr: {
        enabled: false,
        urlBase: '/prowlarr',
      },
      lidarr: {
        enabled: false,
        urlBase: '/lidarr',
      },
      overseerr: {
        enabled: false,
        urlBase: '/overseerr',
      },
      public: { initialized: false },
      notifications: {
        agents: {
          discord: {
            enabled: false,
            options: {
              webhookUrl: '',
              enableMentions: false,
            },
          },
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
          gotify: {
            enabled: false,
            options: {
              url: '',
              token: '',
              priority: 0,
            },
          },
          ntfy: {
            enabled: false,
            options: {
              url: '',
              topic: '',
              priority: 3,
            },
          },
          pushbullet: {
            enabled: false,
            options: {
              accessToken: '',
              channelTag: '',
            },
          },
          pushover: {
            enabled: false,
            options: {
              accessToken: '',
              userToken: '',
              sound: '',
            },
          },
          slack: {
            enabled: false,
            options: {
              webhookUrl: '',
            },
          },
          telegram: {
            enabled: false,
            options: {
              botAPI: '',
              botUsername: '',
              chatId: '',
              messageThreadId: '',
              sendSilently: false,
            },
          },
          webhook: {
            enabled: false,
            options: {
              webhookUrl: '',
              jsonPayload: '',
              customHeaders: [],
              supportVariables: false,
            },
          },
          webpush: { enabled: false, options: {} },
          inApp: { enabled: true, options: {} },
        },
      },
      jobs: {
        'plex-full-scan': { schedule: '0 0 3 * * *' },
        'plex-refresh-token': { schedule: '0 0 5 * * *' },
        'image-cache-cleanup': { schedule: '0 0 5 * * *' },
        'invites-qrcode-cleanup': { schedule: '0 0 1 * * *' },
        'notification-cleanup': { schedule: '0 30 1 * * *' },
        'trial-expiry': { schedule: '0 0 0 * * *' },
        'plex-membership-check': { schedule: '0 */15 * * * *' },
      },
      onboarding: {
        initialized: false,
        adminOnboardingCompleted: false,
        welcomeEnabled: true,
        tutorialEnabled: true,
        tutorialMode: 'both',
        allowSkipWelcome: true,
        allowSkipTutorial: true,
        tutorialAutostart: true,
        tutorialAutostartDelay: 500,
      },
    };
    if (initialSettings) {
      this.data = mergeSettings(this.data, initialSettings);
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
    this.data.main = mergeSettings(this.data.main, data);
  }

  get network(): NetworkSettings {
    return this.data.network;
  }

  set network(data: NetworkSettings) {
    this.data.network = mergeSettings(this.data.network, data);
  }

  get plex(): PlexSettings {
    return this.data.plex;
  }

  set plex(data: PlexSettings) {
    this.data.plex = mergeSettings(this.data.plex, data);
  }

  get tautulli(): TautulliSettings {
    return this.data.tautulli;
  }

  set tautulli(data: TautulliSettings) {
    this.data.tautulli = mergeSettings(this.data.tautulli, data);
  }

  get uptime(): ServiceSettings {
    return this.data.uptime;
  }

  set uptime(data: ServiceSettings) {
    this.data.uptime = mergeSettings(this.data.uptime, data);
  }

  get downloads(): DownloadClientSettings[] {
    return this.data.downloads;
  }

  set downloads(data: DownloadClientSettings[]) {
    this.data.downloads = data;
  }

  get tdarr(): ServiceSettings {
    return this.data.tdarr;
  }

  set tdarr(data: ServiceSettings) {
    this.data.tdarr = mergeSettings(this.data.tdarr, data);
  }

  get bazarr(): ServiceSettings {
    return this.data.bazarr;
  }

  set bazarr(data: ServiceSettings) {
    this.data.bazarr = mergeSettings(this.data.bazarr, data);
  }

  get radarr(): RadarrSettings[] {
    return this.data.radarr;
  }

  get prowlarr(): ServiceSettings {
    return this.data.prowlarr;
  }

  set prowlarr(data: ServiceSettings) {
    this.data.prowlarr = mergeSettings(this.data.prowlarr, data);
  }

  get lidarr(): ServiceSettings {
    return this.data.lidarr;
  }

  set lidarr(data: ServiceSettings) {
    this.data.lidarr = mergeSettings(this.data.lidarr, data);
  }

  get overseerr(): ServiceSettings {
    return this.data.overseerr;
  }

  set overseerr(data: ServiceSettings) {
    this.data.overseerr = mergeSettings(this.data.overseerr, data);
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
    this.data.public = mergeSettings(this.data.public, data);
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
      libraryCounts: this.data.main.libraryCounts,
      customLogo: this.data.main.customLogo,
      customLogoSmall: this.data.main.customLogoSmall,
      enableSignUp: this.data.main.enableSignUp,
      enableHelpCentre: this.data.main.enableHelpCentre,
      enableTrialPeriod: this.data.main.enableTrialPeriod,
      trialPeriodDays: this.data.main.trialPeriodDays,
      trialPeriodOutcome: this.data.main.trialPeriodOutcome,
      defaultInviteQuotas: {
        quotaLimit: this.data.main.defaultQuotas.invites.quotaLimit ?? 3,
        quotaDays: this.data.main.defaultQuotas.invites.quotaDays ?? 0,
        quotaUsage: this.data.main.defaultQuotas.invites.quotaUsage ?? 1,
        quotaExpiryLimit:
          this.data.main.defaultQuotas.invites.quotaExpiryLimit ?? 1,
        quotaExpiryTime:
          this.data.main.defaultQuotas.invites.quotaExpiryTime ?? 'days',
      },
      seerrEnabled:
        this.data.overseerr.enabled && !!this.data.overseerr.hostname,
      statusUrl: this.data.uptime.externalUrl,
      statusEnabled: this.data.uptime.enabled,
      theme: this.data.main.theme,
      plexClientIdentifier: this.clientId,
    };
  }

  get notifications(): NotificationSettings {
    return this.data.notifications;
  }

  set notifications(data: NotificationSettings) {
    this.data.notifications = mergeSettings(this.data.notifications, data);
  }

  get jobs(): Record<JobId, JobSettings> {
    return this.data.jobs;
  }

  set jobs(data: Record<JobId, JobSettings>) {
    this.data.jobs = mergeSettings(this.data.jobs, data);
  }

  get onboarding(): OnboardingSettings {
    return this.data.onboarding;
  }

  set onboarding(data: OnboardingSettings) {
    this.data.onboarding = mergeSettings(this.data.onboarding, data);
  }

  get clientId(): string {
    if (!this.data.clientId) {
      this.data.clientId = randomUUID();
      this.save();
    }

    return this.data.clientId;
  }

  get sessionSecret(): string {
    if (!this.data.sessionSecret) {
      this.data.sessionSecret = randomBytes(32).toString('hex');
      this.save();
    }

    return this.data.sessionSecret;
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
  public async load(overrideSettings?: AllSettings): Promise<Settings> {
    if (overrideSettings) {
      this.data = overrideSettings;
      return this;
    }

    if (!fs.existsSync(SETTINGS_PATH)) {
      this.save();
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');

    if (data) {
      const parsedSettings = JSON.parse(data);
      const migratedSettings = await runMigrations(
        parsedSettings,
        SETTINGS_PATH
      );
      this.data = mergeSettings(this.data, migratedSettings);
      if (
        !this.data.main.sharedLibraries ||
        this.data.main.sharedLibraries === 'server'
      ) {
        this.data.main.sharedLibraries = 'all';
      }
      this.save();
    }

    return this;
  }

  public save(): void {
    const tempPath = SETTINGS_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(this.data, undefined, ' '));
    fs.renameSync(tempPath, SETTINGS_PATH);
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
