# In-App Notifications

In-App notifications appear directly within the Streamarr interface, providing real-time updates without requiring external services.

## Overview

In-App notifications use Socket.IO to deliver real-time notifications to connected users. This agent is enabled by default and requires no configuration.

---

## Features

### Real-Time Delivery

Notifications appear instantly when events occur, without requiring a page refresh.

### Notification Bell

A notification bell icon in the navigation shows:

- Unread notification count
- Dropdown list of recent notifications
- Quick access to notification history

### Notification Center

Access the full notification center to:

- View all notifications
- Filter by type or read status
- Mark notifications as read
- Delete notifications

<!-- TODO: Add screenshot of notification center -->

---

## Notification Display

In-App notifications include:

| Element       | Description                           |
| ------------- | ------------------------------------- |
| **Icon**      | Visual indicator of notification type |
| **Title**     | Brief summary of the event            |
| **Message**   | Detailed notification content         |
| **Timestamp** | When the notification was sent        |
| **Severity**  | Color coding based on importance      |

---

## Notification Persistence

Unlike push notifications, In-App notifications are:

- Stored in the database
- Persisted across sessions
- Available in the notification history

### Retention

Notifications are automatically cleaned up by the scheduled **Notification Cleanup** job. By default, old notifications are removed after 30 days.

---

## User Preferences

Users can configure In-App notification preferences:

1. Go to **Account Settings → Notifications**
2. Toggle notification types on/off
3. Changes take effect immediately

---

## Admin Announcements

Admins can create In-App announcements that are sent to all users:

1. Navigate to **Notifications**
2. Click **Create Notification**
3. Enter the message details:
   - **Subject** — Notification title
   - **Message** — Notification body
   - **Severity** — Visual importance level
   - **Recipients** — All users or specific users
4. Click **Send**

---

## Socket.IO Connection

In-App notifications rely on a persistent Socket.IO connection:

### Connection Status

The connection status is shown in the UI:

- **Connected** — Real-time notifications active
- **Disconnected** — Falling back to polling

### Reconnection

If the connection drops, Streamarr automatically attempts to reconnect with exponential backoff.

### Troubleshooting Connection Issues

If notifications aren't appearing in real-time:

1. Check browser console for WebSocket errors
2. Verify your reverse proxy supports WebSocket connections
3. Check that Socket.IO is not blocked by a firewall
4. Try refreshing the page

---

## Reverse Proxy Configuration

If using a reverse proxy, ensure WebSocket support is enabled:

{% tabs %}
{% tab title="Nginx" %}

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

{% endtab %}

{% tab title="Caddy" %}

WebSocket support is automatic in Caddy. No special configuration needed.

{% endtab %}

{% tab title="Apache" %}

```apache
RewriteEngine On
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*)  ws://localhost:3000/$1 [P,L]
RewriteCond %{HTTP:Upgrade} !=websocket [NC]
RewriteRule /(.*)  http://localhost:3000/$1 [P,L]
```

{% endtab %}
{% endtabs %}

See [Reverse Proxy](../../extending-streamarr/reverse-proxy.md) for complete configuration examples.
