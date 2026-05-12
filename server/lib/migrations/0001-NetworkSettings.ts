import type { AllSettings } from '@server/lib/settings';

type SettingsMigrationInput = AllSettings & {
  main: AllSettings['main'] & {
    trustProxy?: boolean;
    csrfProtection?: boolean;
  };
};

const migrateNetworkProxyCsrf = (
  settings: SettingsMigrationInput
): AllSettings => {
  if (settings.network) {
    return settings;
  }

  settings.network = {
    requestTimeout: 10000,
    trustProxy: settings.main.trustProxy ?? false,
    csrfProtection: settings.main.csrfProtection ?? false,
  };

  delete settings.main.trustProxy;
  delete settings.main.csrfProtection;

  return settings;
};

export default migrateNetworkProxyCsrf;
