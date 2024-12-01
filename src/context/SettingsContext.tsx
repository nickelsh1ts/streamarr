'use client';
import React from 'react';

const defaultSettings = {
  initialized: false,
  applicationTitle: 'Streamarr',
  applicationUrl: '',
  localLogin: true,
  region: '',
  originalLanguage: '',
  cacheImages: false,
  enablePushRegistration: false,
  locale: 'en',
  emailEnabled: false,
  newPlexLogin: true,
};

export interface SettingsContextProps {
  currentSettings: typeof defaultSettings;
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
