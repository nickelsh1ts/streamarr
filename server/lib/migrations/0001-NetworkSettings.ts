import type { AllSettings } from '@server/lib/settings';

type SettingsMigrationInput = Omit<AllSettings, 'network'> & {
  network?: Omit<AllSettings['network'], 'outboundProxy'>;
  main: AllSettings['main'] & {
    trustProxy?: boolean;
    csrfProtection?: boolean;
  };
};

const migrateNetworkProxyCsrf = (
  settings: SettingsMigrationInput
): AllSettings => {
  if (settings.network) {
    return settings as AllSettings;
  }

  settings.network = {
    requestTimeout: 10000,
    trustProxy: settings.main.trustProxy ?? false,
    csrfProtection: settings.main.csrfProtection ?? false,
    scheduledRetryAttempts: 3,
    scheduledRetryInterval: 300000,
  };

  delete settings.main.trustProxy;
  delete settings.main.csrfProtection;

  return settings as AllSettings;
};

export default migrateNetworkProxyCsrf;
