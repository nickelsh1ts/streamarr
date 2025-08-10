'use client';
import type React from 'react';
import { useState, useEffect, useCallback, createContext } from 'react';
import { IntlProvider } from 'react-intl';
import { setMomentLocale } from '@app/utils/momentLocale';

export type AvailableLocale = 'en' | 'es';

export const availableLanguages: Record<
  AvailableLocale,
  { code: AvailableLocale; display: string }
> = {
  en: { code: 'en', display: 'English' },
  es: { code: 'es', display: 'Español' },
};

export interface LanguageContextProps {
  locale: AvailableLocale;
  setLocale?: (locale: AvailableLocale) => void;
}

export const LanguageContext = createContext<LanguageContextProps>({
  locale: 'en',
});

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale?: AvailableLocale;
}

// Load and transform locale messages from FormatJS format to react-intl format
const loadLocaleMessages = async (
  locale: AvailableLocale
): Promise<Record<string, string>> => {
  try {
    const messages = await import(`@app/i18n/locale/${locale}.json`);
    const messageData = messages.default || messages;

    // Transform FormatJS format to simple key-value pairs
    const transformedMessages: Record<string, string> = {};
    Object.keys(messageData).forEach((key) => {
      const message = messageData[key];
      transformedMessages[key] =
        typeof message === 'string' ? message : message.defaultMessage;
    });

    return transformedMessages;
  } catch (error) {
    console.warn(`Failed to load locale messages for ${locale}`, error);
    return {};
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLocale = 'en',
}) => {
  const [locale, setLocaleState] = useState<AvailableLocale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load messages for the current locale
  const loadMessages = useCallback(async (newLocale: AvailableLocale) => {
    setIsLoading(true);
    try {
      const localeMessages = await loadLocaleMessages(newLocale);
      setMessages(localeMessages);
    } catch (error) {
      console.error('Failed to load locale messages:', error);
      setMessages({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize messages and moment locale on mount
  useEffect(() => {
    loadMessages(locale);
    // Synchronize moment.js locale with current locale
    setMomentLocale(locale);
  }, [loadMessages, locale]);

  // Function to change locale
  const setLocale = useCallback(
    (newLocale: AvailableLocale) => {
      if (newLocale !== locale) {
        setLocaleState(newLocale);
        // Persist locale preference
        if (typeof window !== 'undefined') {
          localStorage.setItem('streamarr-locale', newLocale);
        }
        loadMessages(newLocale);
        // Synchronize moment.js locale with new locale
        setMomentLocale(newLocale);
      }
    },
    [locale, loadMessages]
  );

  // Load saved locale on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem(
        'streamarr-locale'
      ) as AvailableLocale;
      if (savedLocale && availableLanguages[savedLocale]) {
        setLocale(savedLocale);
      }
    }
  }, [setLocale]);

  const contextValue: LanguageContextProps = { locale, setLocale };

  if (isLoading) {
    return (
      <LanguageContext.Provider value={contextValue}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <IntlProvider locale={locale} messages={messages} defaultLocale="en">
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};
