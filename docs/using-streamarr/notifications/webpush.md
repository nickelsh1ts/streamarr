# Web Push Notifications

Web Push notifications allow Streamarr to send notifications directly to your browser, even when the Streamarr tab isn't open.

## Overview

Web Push uses the [Web Push Protocol](https://tools.ietf.org/html/rfc8030) with VAPID (Voluntary Application Server Identification) for secure push notification delivery.

Streamarr automatically generates VAPID keys on first startup. No additional configuration is required for basic functionality.

---

## Enabling Web Push

### Server-Side

Web Push is enabled by default. The VAPID keys are automatically generated and stored in your settings.

To verify Web Push is working:

1. Navigate to **Settings → Notifications**
2. Find the **Web Push** agent
3. Verify it shows as **Enabled**

### User-Side

Each user must subscribe to push notifications:

1. Navigate to **Account Settings → Notifications**
2. Click **Enable Push Notifications**
3. Accept the browser permission prompt
4. Select which notification types to receive

---

## Browser Support

Web Push is supported in:

- Chrome (desktop and Android)
- Firefox (desktop and Android)
- Edge
- Safari (macOS Ventura and later, iOS 16.4 and later)
- Opera

{% hint style="warning" %}
Safari on iOS requires the PWA to be installed on the home screen for push notifications to work.
{% endhint %}

---

## How It Works

1. **Subscription** — When a user enables push notifications, their browser creates a subscription endpoint
2. **Storage** — Streamarr stores the subscription endpoint and keys for each user
3. **Notification** — When an event occurs, Streamarr sends a push message to all subscribed endpoints
4. **Delivery** — The browser's push service delivers the notification to the user's device

### Security

- All push messages are encrypted using the subscription's public key
- VAPID keys authenticate Streamarr to the push service
- Subscription endpoints are unique per browser/device

---

## Requirements

For Web Push to work correctly:

1. **HTTPS Required** — Your Streamarr instance must be served over HTTPS
2. **Service Worker** — Streamarr includes a service worker that handles incoming push messages
3. **Browser Permissions** — Users must grant notification permission

{% hint style="info" %}
If you're accessing Streamarr via `http://localhost`, push notifications will work for testing purposes. For production, HTTPS is required.
{% endhint %}

---

## Troubleshooting

### "Push notifications not supported"

- Verify you're using a supported browser
- Check that JavaScript is enabled
- Ensure you're accessing Streamarr over HTTPS (or localhost)

### Notifications not appearing

1. Check browser notification settings:
   - Click the lock icon in the URL bar
   - Verify notifications are set to "Allow"
2. Check operating system notification settings
3. Verify you're subscribed in Streamarr settings
4. Check that the notification type is enabled in your preferences

### "Registration failed"

- Clear your browser cache and try again
- Check browser console for errors
- Verify the service worker is registered at `/sw.js`

### Notifications delayed

Push notification delivery is handled by browser vendors (Google, Mozilla, Apple). Delays can occur due to:

- Device battery optimization
- Browser background restrictions
- Push service congestion

### Unsubscribing

To stop receiving push notifications:

1. Go to **Account Settings → Notifications**
2. Click **Disable Push Notifications**

Or revoke permission in your browser settings.

---

## Multiple Devices

Users can subscribe to push notifications on multiple devices/browsers. Each subscription is stored separately, and notifications are sent to all subscribed endpoints.

To manage subscriptions:

1. Go to **Account Settings → Notifications**
2. View all active push subscriptions
3. Remove subscriptions for devices you no longer use
