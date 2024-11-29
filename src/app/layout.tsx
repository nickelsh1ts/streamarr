'use client';
import PullToRefresh from '@app/components/Layout/PullToRefresh';
import NextTopLoader from 'nextjs-toploader';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import 'styles/globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import Layout from '@app/components/Layout';
import NotificationProvider from '@app/context/NotificationContext';
import Notifications from '@app/components/Layout/Notifications';
import { SettingsProvider } from '@app/context/SettingsContext';

const inter = Inter({
  weight: ['300'],
  subsets: ['latin'],
  display: 'swap',
});

const applicationTitle = 'Streamarr';

export const isAuthed = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  let component: React.ReactNode;

  if (
    pathname.match(/\/(help\/?(.*)?|watch\/?(.*)?|signin\/plex\/loading|\/?$)/)
  ) {
    component = children;
  } else {
    component = <Layout>{children}</Layout>;
  }

  return (
    <html
      lang="en-CA"
      className={`${inter.className} scroll-smooth`}
      data-theme="streamarr"
    >
      <SettingsProvider currentSettings={null}>
        <InteractionProvider>
          <head>
            <PWAHeader applicationTitle={applicationTitle} />
          </head>
          <ServiceWorkerSetup />
          <body className="bg-[#1f1f1f]">
            <NextTopLoader color="#974ede" />
            <PullToRefresh />
            <Toaster />
            <NotificationProvider>
              <Notifications />
              {component}
            </NotificationProvider>
          </body>
        </InteractionProvider>
      </SettingsProvider>
    </html>
  );
}
