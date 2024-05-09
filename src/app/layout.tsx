import Router from 'next/router';
import Layout from '@app/components/Layout';
import PWAHeader from '@app/components/PWAHeader';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import 'styles/css/globals.css';
import ProgressBar from '@badrap/bar-of-progress';
import { useEffect, useState } from 'react';

const applicationTitle = 'streamarr';

const progress = new ProgressBar({
  size: 2,
  color: '#38bdf8',
  className: 'bar-of-progress',
  delay: 100,
});

Router.events.on('routeChangeStart', () => progress.start());
Router.events.on('routeChangeComplete', () => progress.finish());
Router.events.on('routeChangeError', () => progress.finish());

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
      <html lang="en-CA" data-theme="fox">
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