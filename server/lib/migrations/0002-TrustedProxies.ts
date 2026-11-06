import type { AllSettings } from '@server/lib/settings';

type SettingsMigrationInput = Omit<AllSettings, 'network'> & {
  network: Omit<AllSettings['network'], 'trustedProxies'> & {
    trustedProxies?: AllSettings['network']['trustedProxies'];
  };
};

const migrateTrustedProxies = (
  settings: SettingsMigrationInput
): AllSettings => {
  if (!settings.network || settings.network.trustedProxies) {
    return settings as AllSettings;
  }

  // Existing proxy users keep trusting exactly one hop until they opt in
  settings.network.trustedProxies = {
    localNetworks: !settings.network.trustProxy,
    cloudflare: false,
    cloudflareRanges: null,
    additional: [],
  };

  return settings as AllSettings;
};

export default migrateTrustedProxies;
