import PullToRefresh from '@app/components/Layout/PullToRefresh';
import NextTopLoader from 'nextjs-toploader';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import { LanguageProvider } from '@app/context/LanguageContext';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import NotificationProvider from '@app/context/NotificationContext';
import { NotificationSidebarProvider } from '@app/context/NotificationSidebarContext';
import { SettingsProvider } from '@app/context/SettingsContext';
import type { ReactNode } from 'react';
import type { User } from '@app/hooks/useUser';
import { cookies } from 'next/headers';
import { UserContext } from '@app/context/UserContext';
import Layout from '@app/components/Layout';
import ThemeSetter from '@app/components/ThemeSetter';
import { getPublicSettings } from '@app/utils/serverFetchHelpers';

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentSettings = await getPublicSettings();

  let user: User | undefined = undefined;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    const res = await fetch(
      `http://${process.env.HOST || 'localhost'}:${
        process.env.PORT || 3000
      }/api/v1/auth/me`,
      {
        headers: { cookie: cookieHeader || undefined },
      }
    );
    if (res.ok) {
      user = await res.json();
    }
  } catch {
    // ignore
  }

  const initialized = currentSettings.initialized;

  return (
    <html lang="en-CA" className="scroll-smooth" data-theme="streamarr">
      <head>
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
