'use client';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import React, { useState } from 'react';

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
  inAppEnabled: false,
  newPlexLogin: true,
  enableRequest: false,
  requestUrl: '',
  requestHostname: '',
  supportUrl: '',
  supportEmail: '',
  extendedHome: true,
  releaseSched: false,
  enableSignUp: false,
  statsUrl: '',
  statsEnabled: false,
  statusUrl: '',
  statusEnabled: false,
  customLogo: undefined,
  customLogoSmall: undefined,
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
    'base-200': '#121418',
    'base-300': '#0d1013',
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
};

export interface SettingsContextProps {
  currentSettings: PublicSettingsResponse;
  updateSettings: (settings: Partial<PublicSettingsResponse>) => void;
  children?: React.ReactNode;
}

export const SettingsContext = React.createContext<SettingsContextProps>({
  currentSettings: defaultSettings,
  updateSettings: () => {},
});

export const SettingsProvider = ({
  children,
  currentSettings: initialSettings,
}: {
  children: React.ReactNode;
  currentSettings: PublicSettingsResponse;
}) => {
  const [currentSettings, setCurrentSettings] = useState(initialSettings);

  const updateSettings = (updates: Partial<PublicSettingsResponse>) => {
    setCurrentSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ currentSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
