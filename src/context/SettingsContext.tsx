'use client';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import React from 'react';

const defaultSettings: PublicSettingsResponse = {
  initialized: false,
  applicationTitle: 'Streamarr',
  applicationUrl: '',
  localLogin: true,
  region: '',
  cacheImages: false,
  enablePushRegistration: false,
  vapidPublic: '',
  locale: 'en',
  emailEnabled: false,
  newPlexLogin: true,
  enableRequest: false,
  requestUrl: '',
  supportUrl: '',
  supportEmail: '',
  extendedHome: true,
  releaseSched: false,
  enableSignUp: false,
  statsUrl: '',
  statusUrl: '',
  statusEnabled: false,
  customLogo: undefined,
  customLogoSmall: undefined,
};

export interface SettingsContextProps {
  currentSettings: PublicSettingsResponse;
  children?: React.ReactNode;
}

export const SettingsContext = React.createContext<SettingsContextProps>({
  currentSettings: defaultSettings,
});

export const SettingsProvider = ({
  children,
  currentSettings,
}: SettingsContextProps) => {
  const data = currentSettings;

  let newSettings = defaultSettings;

  if (data) {
    newSettings = data;
  }

  return (
    <SettingsContext.Provider value={{ currentSettings: newSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
