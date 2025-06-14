import PullToRefresh from '@app/components/Layout/PullToRefresh';
import NextTopLoader from 'nextjs-toploader';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import NotificationProvider from '@app/context/NotificationContext';
import Notifications from '@app/components/Layout/Notifications';
import { SettingsProvider } from '@app/context/SettingsContext';
import type { ReactNode } from 'react';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import type { User } from '@app/hooks/useUser';
import { cookies } from 'next/headers';
import { UserContext } from '@app/context/UserContext';
import Layout from '@app/components/Layout';

let currentSettings: PublicSettingsResponse = {
  initialized: false,
  applicationTitle: 'Default',
  applicationUrl: '',
  localLogin: true,
  region: '',
  originalLanguage: '',
  cacheImages: false,
  enablePushRegistration: false,
  locale: 'en',
  emailEnabled: false,
  newPlexLogin: true,
  vapidPublic: '',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const response = await axios.get<PublicSettingsResponse>(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`
  );

  currentSettings = response.data;
  let user: User | undefined = undefined;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const res = await axios.get<User>(
      `http://${process.env.HOST || 'localhost'}:${
        process.env.PORT || 3000
      }/api/v1/auth/me`,
      {
        headers: { cookie: cookieHeader || undefined },
      }
    );
    user = res.data;
  } catch {
    //
  }

  return (
    <html lang="en-CA" className="scroll-smooth" data-theme="streamarr">
      <head>
        <PWAHeader applicationTitle={currentSettings.applicationTitle} />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
        />
      </head>
      <body className="bg-[#1f1f1f] min-h-dvh">
        <NextTopLoader color="#974ede" />
        <PullToRefresh />
        <Toaster />
        <SettingsProvider currentSettings={currentSettings}>
          <InteractionProvider>
            <UserContext initialUser={user}>
              <NotificationProvider>
                <Notifications />
                <Layout>{children}</Layout>
              </NotificationProvider>
            </UserContext>
          </InteractionProvider>
        </SettingsProvider>
        <ServiceWorkerSetup />
      </body>
    </html>
  );
}
