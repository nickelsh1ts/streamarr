import PullToRefresh from '@app/components/Layout/PullToRefresh';
import NextTopLoader from 'nextjs-toploader';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import 'styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  weight: ['300'],
  subsets: ['latin'],
  display: 'swap',
});

const applicationTitle = 'Streamarr';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" className={`${inter.className} scroll-smooth`} data-theme="streamarr">
      <InteractionProvider>
        <head>
          <PWAHeader applicationTitle={applicationTitle} />
        </head>
        <ServiceWorkerSetup />
      </InteractionProvider>
      <body className="flex flex-col min-h-dvh">
        <NextTopLoader color='#974ede' />
        <PullToRefresh />
          {children}
      </body>
    </html>
  );
}
