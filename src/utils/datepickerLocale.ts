import { registerLocale } from 'react-datepicker';
import type { Locale } from 'date-fns';
import {
  availableLanguages,
  type AvailableLocale,
} from '@app/context/LanguageContext';

const registeredLocales = new Set<AvailableLocale>(['en']);

const localeImports: Record<string, () => Promise<Locale>> = {
  es: () => import('date-fns/locale/es').then((m) => m.es),
  fr: () => import('date-fns/locale/fr').then((m) => m.fr),
  de: () => import('date-fns/locale/de').then((m) => m.de),
  it: () => import('date-fns/locale/it').then((m) => m.it),
  pt: () => import('date-fns/locale/pt').then((m) => m.pt),
  ru: () => import('date-fns/locale/ru').then((m) => m.ru),
  ja: () => import('date-fns/locale/ja').then((m) => m.ja),
  ko: () => import('date-fns/locale/ko').then((m) => m.ko),
  nl: () => import('date-fns/locale/nl').then((m) => m.nl),
  sv: () => import('date-fns/locale/sv').then((m) => m.sv),
  da: () => import('date-fns/locale/da').then((m) => m.da),
  fi: () => import('date-fns/locale/fi').then((m) => m.fi),
  pl: () => import('date-fns/locale/pl').then((m) => m.pl),
  // Add more locales as needed - only those used in availableLanguages will be loaded
};

export const registerDatePickerLocale = async (
  locale: AvailableLocale
): Promise<void> => {
  // Skip if already registered or if it's English (default)
  if (registeredLocales.has(locale) || locale === 'en') {
    return;
  }

  // Only register if it's available in i18n AND we have a date-fns mapping
  if (availableLanguages[locale] && localeImports[locale]) {
    try {
      const localeData = await localeImports[locale]();

      if (localeData) {
        registerLocale(locale, localeData);
        registeredLocales.add(locale);
      }
    } catch {
      // Date picker will fall back to English if locale registration fails
    }
  }
};
