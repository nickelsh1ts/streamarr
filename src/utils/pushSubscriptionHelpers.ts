import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { PushSubscriptionValidation } from '@server/interfaces/api/userInterfaces';
import axios from 'axios';

type PushSettings = Pick<
  PublicSettingsResponse,
  'enablePushRegistration' | 'vapidPublic'
>;

// Taken from https://www.npmjs.com/package/web-push
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);

  return outputArray;
}

export const getPushSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return { registration: null, subscription: null };
  }

  const subscription = await registration.pushManager.getSubscription();
  return { registration, subscription };
};

const verifySubscription = async (
  userId: number,
  subscription: PushSubscription,
  vapidPublic: string
): Promise<boolean> => {
  try {
    const appServerKey = subscription.options?.applicationServerKey;
    if (!(appServerKey instanceof ArrayBuffer)) {
      return false;
    }

    const currentServerKey = new Uint8Array(appServerKey).toString();
    const expectedServerKey = urlBase64ToUint8Array(vapidPublic).toString();

    const endpoint = subscription.endpoint;

    const { data } = await axios.get<PushSubscriptionValidation>(
      `/api/v1/user/${userId}/pushSubscription/${encodeURIComponent(endpoint)}`
    );
    const keys = subscription.toJSON().keys;

    return (
      expectedServerKey === currentServerKey &&
      data.endpoint === endpoint &&
      keys?.p256dh === data.p256dh &&
      keys.auth === data.auth
    );
  } catch {
    return false;
  }
};

export const verifyPushSubscription = async (
  userId: number | undefined,
  currentSettings: Pick<PublicSettingsResponse, 'vapidPublic'>
): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !userId) {
    return false;
  }

  try {
    const { subscription } = await getPushSubscription();
    return subscription
      ? verifySubscription(userId, subscription, currentSettings.vapidPublic)
      : false;
  } catch {
    return false;
  }
};

const usesCurrentVapidKey = (
  subscription: PushSubscription,
  currentSettings: Pick<PublicSettingsResponse, 'vapidPublic'>
) => {
  const appServerKey = subscription.options?.applicationServerKey;
  if (!(appServerKey instanceof ArrayBuffer)) {
    return false;
  }

  const currentServerKey = new Uint8Array(appServerKey).toString();
  const expectedServerKey = urlBase64ToUint8Array(
    currentSettings.vapidPublic
  ).toString();

  return currentServerKey === expectedServerKey;
};

const registerPushSubscription = async (
  subscription: PushSubscription,
  previousEndpoint?: string
) => {
  const { endpoint, keys } = subscription.toJSON();

  if (!endpoint || !keys?.p256dh || !keys.auth) {
    return false;
  }

  await axios.post('/api/v1/user/registerPushSubscription', {
    endpoint,
    ...(previousEndpoint && { previousEndpoint }),
    p256dh: keys.p256dh,
    auth: keys.auth,
    userAgent: navigator.userAgent,
  });

  return true;
};

export const verifyAndRegisterPushSubscription = async (
  userId: number | undefined,
  currentSettings: PushSettings
): Promise<boolean> => {
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !userId ||
    !currentSettings.enablePushRegistration
  ) {
    return false;
  }

  const { subscription } = await getPushSubscription();
  if (!subscription || !usesCurrentVapidKey(subscription, currentSettings)) {
    return false;
  }

  const isValid = await verifySubscription(
    userId,
    subscription,
    currentSettings.vapidPublic
  );
  if (isValid) {
    return true;
  }

  return registerPushSubscription(subscription);
};

export const subscribeToPushNotifications = async (
  userId: number | undefined,
  currentSettings: PushSettings
) => {
  if (
    !('serviceWorker' in navigator) ||
    !userId ||
    !currentSettings.enablePushRegistration
  ) {
    return false;
  }

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration()) ??
      (await navigator.serviceWorker.register('/sw.js'));
    const activeRegistration = registration.active
      ? registration
      : await navigator.serviceWorker.ready;

    const existingSubscription =
      await activeRegistration.pushManager.getSubscription();
    let previousEndpoint: string | undefined;
    if (existingSubscription) {
      if (usesCurrentVapidKey(existingSubscription, currentSettings)) {
        return registerPushSubscription(existingSubscription);
      }

      previousEndpoint = existingSubscription.endpoint;
      await existingSubscription.unsubscribe();
    }

    const subscription = await activeRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(currentSettings.vapidPublic),
    });

    return registerPushSubscription(subscription, previousEndpoint);
  } catch (error) {
    throw new Error(
      `Issue subscribing to push notifications: ${error.message}`
    );
  }
};

export const unsubscribeToPushNotifications = async (
  userId: number | undefined,
  endpoint?: string
) => {
  if (!('serviceWorker' in navigator) || !userId) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (!subscription) {
      return null;
    }

    const { endpoint: currentEndpoint } = subscription.toJSON();

    if (!endpoint || endpoint === currentEndpoint) {
      await subscription.unsubscribe();
      return currentEndpoint ?? null;
    }

    return null;
  } catch (error) {
    throw new Error(
      `Issue unsubscribing to push notifications: ${error.message}`
    );
  }
};
