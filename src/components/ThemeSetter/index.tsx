'use client';

import { useEffect, useContext } from 'react';
import { SettingsContext } from '@app/context/SettingsContext';
import { colord } from 'colord';
import { rgbToOklch, daisyUIMapping } from '@app/utils/themeUtils';

const ThemeSetter: React.FC = () => {
  const { currentSettings } = useContext(SettingsContext);
  const theme = currentSettings.theme;

  useEffect(() => {
    if (!theme) {
      return;
    }

    Object.entries(theme).forEach(([key, value]) => {
      const daisyKey = daisyUIMapping[key];
      if (daisyKey) {
        const color = colord(value);
        if (color.isValid()) {
          const rgb = color.toRgb();
          const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
          const cssValue = `${oklch.l} ${oklch.c} ${oklch.h}`;
          document.documentElement.style.setProperty(`--${daisyKey}`, cssValue);
        }
      }
    });
  }, [theme]);
  return null;
};

export default ThemeSetter;
