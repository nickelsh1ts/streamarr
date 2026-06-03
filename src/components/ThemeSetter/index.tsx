'use client';

import { useEffect, useContext } from 'react';
import { SettingsContext } from '@app/context/SettingsContext';
import { daisyUIMapping, parseColorToHex } from '@app/utils/themeUtils';

const ThemeSetter: React.FC = () => {
  const { currentSettings } = useContext(SettingsContext);
  const theme = currentSettings.theme;

  useEffect(() => {
    if (!theme) {
      return;
    }

    Object.entries(theme).forEach(([key, value]) => {
      const daisyVar = daisyUIMapping[key];
      if (daisyVar) {
        const hex = parseColorToHex(value);
        if (hex) {
          document.documentElement.style.setProperty(daisyVar, hex);
        }
      }
    });
  }, [theme]);
  return null;
};

export default ThemeSetter;
