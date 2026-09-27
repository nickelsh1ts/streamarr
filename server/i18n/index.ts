import { createIntl, createIntlCache } from '@formatjs/intl';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import type { AvailableLocale } from '@server/types/languages';
import { availableLocales } from '@server/types/languages';
import fs from 'fs';
import path from 'path';

type IntlShape = ReturnType<typeof createIntl>;
export type { IntlShape };

const cache = createIntlCache();
const intlInstances = new Map<string, IntlShape>();

const localeDir = path.join(__dirname, 'locale');

const DEFAULT_LOCALE: AvailableLocale = 'en';

const loadLocaleMessages = (locale: string): Record<string, string> => {
  const localePath = path.join(localeDir, `${locale}.json`);
  try {
    const raw = fs.readFileSync(localePath, 'utf-8');
    return JSON.parse(raw) as Record<string, string>;
  } catch (e) {
    logger.warn(`Could not load locale file for "${locale}"`, {
      label: 'i18n',
      errorMessage: (e as Error).message,
    });
    return {};
  }
};

export const initI18n = (): void => {
  for (const locale of availableLocales) {
    const messages = loadLocaleMessages(locale);
    const intl = createIntl({ locale, messages }, cache);
    intlInstances.set(locale, intl);
  }

  logger.info(`Initialized server-side i18n.`, {
    label: 'i18n',
    locales: availableLocales.join(', '),
  });
};

export const getIntl = (locale?: string | null): IntlShape => {
  if (intlInstances.size === 0) {
    return createIntl({ locale: DEFAULT_LOCALE, messages: {} }, cache);
  }

  const resolved = [
    locale?.split('-')[0].toLowerCase(),
    getSettings().main.locale?.split('-')[0].toLowerCase(),
    DEFAULT_LOCALE,
  ].find((candidate) => candidate && intlInstances.has(candidate));

  return (
    intlInstances.get(resolved ?? DEFAULT_LOCALE) ??
    intlInstances.get(DEFAULT_LOCALE) ??
    createIntl({ locale: DEFAULT_LOCALE, messages: {} }, cache)
  );
};
