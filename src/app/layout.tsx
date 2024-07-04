import Layout from '@app/components/Layout';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import 'styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
})

const applicationTitle = 'Streamarr';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
      <html lang="en-CA" className={inter.className} data-theme="streamarr">
        <InteractionProvider>
          <head>
            <PWAHeader applicationTitle={applicationTitle} />
          </head>
          <ServiceWorkerSetup />
        </InteractionProvider>
        <body
          className="flex flex-col min-h-dvh"
        >
          <Layout>{children}</Layout>
        </body>
      </html>
  );
}
