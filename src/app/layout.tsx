import PullToRefresh from '@app/components/Layout/PullToRefresh';
import NextTopLoader from 'nextjs-toploader';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import { LanguageProvider } from '@app/context/LanguageContext';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import NotificationProvider from '@app/context/NotificationContext';
import { SettingsProvider } from '@app/context/SettingsContext';
import type { ReactNode } from 'react';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { User } from '@app/hooks/useUser';
import { cookies } from 'next/headers';
import { UserContext } from '@app/context/UserContext';
import Layout from '@app/components/Layout';

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const res = await fetch(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`,
    { cache: 'no-store' }
  );
  const currentSettings: PublicSettingsResponse = await res.json();

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
      <body className="bg-[#1f1f1f] min-h-dvh">
        <NextTopLoader color="#974ede" />
        <PullToRefresh />
        <Toaster />
        <LanguageProvider>
          <SettingsProvider currentSettings={currentSettings}>
            <InteractionProvider>
              <UserContext initialUser={user}>
                <NotificationProvider>
                  <Layout initialized={initialized}>{children}</Layout>
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
