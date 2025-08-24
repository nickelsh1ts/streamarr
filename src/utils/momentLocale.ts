import moment from 'moment';
import {
  availableLanguages,
  type AvailableLocale,
} from '@app/context/LanguageContext';

// Global moment locale state
let currentMomentLocale: AvailableLocale = 'en';

/**
 * Dynamically loads and sets moment.js locale based on available i18n locales
 * Only imports locales that have corresponding translation files
 * Caches loaded locales to avoid repeated imports
 *
 * @param locale - The locale code to set for moment.js
 * @returns Promise that resolves when locale is set
 */
export const setMomentLocale = async (
  locale: AvailableLocale
): Promise<void> => {
  // Skip if already set to the same locale
  if (currentMomentLocale === locale) {
    return;
  }

  // Only load moment locale if it matches an available i18n locale
  if (locale !== 'en' && availableLanguages[locale]) {
    try {
      // Dynamically import moment locale based on available i18n locale
      await import(`moment/locale/${locale}`);
      moment.locale(locale);
      currentMomentLocale = locale;
    } catch (error) {
      // Fallback to English if locale import fails
      moment.locale('en');
      currentMomentLocale = 'en';
      throw new Error(
        `Failed to load moment locale for ${locale}, falling back to English: ${error.message}`
      );
    }
  } else {
    // Default to English
    moment.locale('en');
    currentMomentLocale = 'en';
  }
};

/**
 * Get the current moment locale
 * @returns Current moment locale
 */
export const getCurrentMomentLocale = (): AvailableLocale => {
  return currentMomentLocale;
};

/**
 * Centralized moment instance with automatic locale synchronization
 * Use this instead of importing moment directly in components
 * This ensures consistent locale usage across the application
 */
export const momentWithLocale = moment;
