import Layout from '@app/components/Layout';
import PullToRefresh from '@app/components/Layout/PullToRefresh';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import ThemeSetter from '@app/components/ThemeSetter';
import { InteractionProvider } from '@app/context/InteractionContext';
import { LanguageProvider } from '@app/context/LanguageContext';
import NotificationProvider from '@app/context/NotificationContext';
import { NotificationSidebarProvider } from '@app/context/NotificationSidebarContext';
import { SettingsProvider } from '@app/context/SettingsContext';
import { UserContext } from '@app/context/UserContext';
import {
  getPublicSettings,
  getServerUser,
} from '@app/utils/serverFetchHelpers';
import NextTopLoader from 'nextjs-toploader';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import 'styles/globals.css';

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentSettings = await getPublicSettings();
  const user = await getServerUser();

  const initialized = currentSettings.initialized;

  return (
    <html lang="en-CA" className="scroll-smooth" data-theme="streamarr">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <PWAHeader applicationTitle={currentSettings.applicationTitle} />
      </head>
      <body
        className="min-h-dvh"
        style={{ background: currentSettings.theme?.['base-300'] ?? '#1f1f1f' }}
      >
        <NextTopLoader color={currentSettings.theme?.primary ?? '#974ede'} />
        <PullToRefresh />
        <Toaster />
        <LanguageProvider>
          <SettingsProvider currentSettings={currentSettings}>
            <ThemeSetter />
            <InteractionProvider>
              <UserContext initialUser={user}>
                <NotificationProvider>
                  <NotificationSidebarProvider>
                    <Layout initialized={initialized}>{children}</Layout>
                  </NotificationSidebarProvider>
                </NotificationProvider>
              </UserContext>
            </InteractionProvider>
          </SettingsProvider>
        </LanguageProvider>
        <ServiceWorkerSetup />
      </body>
    </html>
  );
}
