'use client';

import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { verifyAndRegisterPushSubscription } from '@app/utils/pushSubscriptionHelpers';
import { useEffect } from 'react';

const ServiceWorkerSetup = () => {
  const { user } = useUser();
  const { currentSettings } = useSettings();
  const { enablePushRegistration, vapidPublic } = currentSettings;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let cancelled = false;
    const setupServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log(
          '[SW] Registration successful, scope is:',
          registration.scope
        );

        if (
          cancelled ||
          !user?.id ||
          !enablePushRegistration ||
          localStorage.getItem('pushNotificationsEnabled') !== 'true'
        ) {
          return;
        }

        if (typeof Notification === 'undefined') {
          return;
        }

        if (Notification.permission !== 'granted') {
          if (Notification.permission === 'denied') {
            localStorage.setItem('pushNotificationsEnabled', 'false');
          }
          return;
        }

        const registered = await verifyAndRegisterPushSubscription(user.id, {
          enablePushRegistration,
          vapidPublic,
        });
        if (!registered) {
          console.warn('[SW] Existing push subscription needs user action.');
        }
      } catch (error) {
        console.log('[SW] Service worker setup failed, error:', error);
      }
    };

    void setupServiceWorker();
    return () => {
      cancelled = true;
    };
  }, [enablePushRegistration, user?.id, vapidPublic]);

  return null;
};

export default ServiceWorkerSetup;
