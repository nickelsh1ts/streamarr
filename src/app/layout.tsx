'use client';
import PullToRefresh from '@app/components/Layout/PullToRefresh';
import NextTopLoader from 'nextjs-toploader';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import Layout from '@app/components/Layout';
import NotificationProvider from '@app/context/NotificationContext';
import Notifications from '@app/components/Layout/Notifications';
import { SettingsProvider } from '@app/context/SettingsContext';

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
    pathname.match(
      /\/(help\/?(.*)?|watch\/?(.*)?|signin\/plex\/loading|setup|\/?$)/
    )
  ) {
    component = children;
  } else {
    component = <Layout>{children}</Layout>;
  }

  return (
    <html lang="en-CA" className={`scroll-smooth`} data-theme="streamarr">
      <SettingsProvider currentSettings={null}>
        <InteractionProvider>
          <head>
            <PWAHeader applicationTitle={applicationTitle} />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
            />
          </head>
          <ServiceWorkerSetup />
          <body className="bg-[#1f1f1f] min-h-dvh">
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
