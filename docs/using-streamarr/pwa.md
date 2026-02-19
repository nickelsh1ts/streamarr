# Progressive Web App (PWA)

Streamarr can be installed as a Progressive Web App, giving you a native app-like experience on desktop and mobile devices.

## Overview

A Progressive Web App runs in your browser but behaves like a native app:

- **Home screen icon** — Launch Streamarr directly from your device
- **Standalone window** — Runs without browser chrome (address bar, tabs)
- **Offline support** — Shows an offline page when connectivity is lost
- **Push notifications** — Receive notifications even when the app isn't open (requires [Web Push](notifications/webpush.md) setup)

---

## Installation

### Chrome / Edge (Desktop)

1. Navigate to your Streamarr instance in Chrome or Edge
2. Click the **install icon** in the address bar (or go to **⋮ → Install Streamarr**)
3. Click **Install** in the confirmation dialog
4. Streamarr opens in its own window

### Chrome (Android)

1. Navigate to your Streamarr instance in Chrome
2. Tap the **⋮** menu button
3. Tap **"Add to Home screen"** (or **"Install app"**)
4. Confirm the installation
5. A Streamarr icon appears on your home screen

### Safari (iOS / iPadOS)

1. Navigate to your Streamarr instance in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add**
5. A Streamarr icon appears on your home screen

{% hint style="info" %}
On iOS, push notifications only work when Streamarr is installed as a PWA and accessed from the home screen icon. Safari does not support push notifications in regular browser tabs.
{% endhint %}

### Firefox (Android)

1. Navigate to your Streamarr instance in Firefox
2. Tap the **⋮** menu button
3. Tap **"Install"**
4. Confirm the installation

{% hint style="warning" %}
Firefox on desktop does not support PWA installation. Use Chrome or Edge on desktop.
{% endhint %}

---

## Features

### Standalone Window

When launched from your home screen or app launcher, Streamarr runs in a standalone window without browser UI. The full screen is dedicated to the application.

### Offline Support

If your device loses connectivity, Streamarr displays an offline page instead of a browser error. When connectivity returns, you can refresh to resume using the app normally.

{% hint style="info" %}
Streamarr's offline support covers navigation requests only. The app requires a network connection to load data and stream content.
{% endhint %}

### Pull to Refresh

On mobile devices, pull down from the top of the page to refresh the current view. This works the same as the native pull-to-refresh gesture in mobile apps.

### Back Navigation

In PWA mode, Streamarr provides a dedicated back button in the header for easy navigation, since the browser's back button is not visible.

### Push Notifications

When Web Push notifications are [configured](notifications/webpush.md) and your device supports them, you can receive notifications even when Streamarr is not actively open. Tapping a notification opens the relevant page in the app.

---

## Requirements

### HTTPS

PWA installation and most PWA features (including push notifications and service worker registration) **require HTTPS**. Set up a [reverse proxy](../extending-streamarr/reverse-proxy.md) with SSL/TLS to enable these features.

{% hint style="warning" %}
PWA installation will not work over plain HTTP (except on `localhost` for development).
{% endhint %}

### Service Worker

Streamarr registers a service worker (`/sw.js`) automatically. The service worker:

- Pre-caches the offline fallback page
- Intercepts navigation requests and falls back to the offline page on network failure
- Handles push notification display and click actions

---

## Troubleshooting

### "Install option not showing"

1. Ensure you are accessing Streamarr over **HTTPS**
2. Verify the `site.webmanifest` is loading (check browser DevTools → Application tab)
3. Try a different supported browser (Chrome, Edge, Safari on iOS)
4. Clear your browser cache and reload

### "Offline page not appearing"

1. Open DevTools → Application → Service Workers
2. Verify the service worker is registered and active
3. Click **"Update"** to force a service worker update
4. If the service worker is missing, ensure HTTPS is configured

### "Push notifications not working in PWA"

1. Ensure [Web Push](notifications/webpush.md) is configured on the server
2. Check that you've subscribed to push notifications in your account settings
3. On iOS, push notifications only work when launched from the home screen icon
4. Verify notification permissions in your device settings

### "App looks outdated after update"

The service worker may be serving a cached version:

1. Close all Streamarr windows/tabs completely
2. Reopen the app from your home screen
3. If the issue persists, uninstall and reinstall the PWA
