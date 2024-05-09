'use client';

import { useEffect } from 'react';

const ServiceWorkerSetup = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log(
            '[SW] Registration successful, scope is:',
            registration.scope
          );
        })
        .catch(function (error) {
          console.log('[SW] Service worker registration failed, error:', error);
        });
    }
  });
  return null;
};

export default ServiceWorkerSetup;