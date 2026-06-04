# Notifications

Streamarr supports multiple notification channels to keep you and your users informed about important events.

## Available Notification Agents

Streamarr groups notification agents into two delivery models:

- **Per-recipient** agents deliver to individual users, who each configure their own destination.
- **Shared-channel** agents post each notification once to a common destination configured by an administrator.

| Agent                       | Delivery       | Description                                                 |
| --------------------------- | -------------- | ----------------------------------------------------------- |
| [Email](email.md)           | Per-recipient  | SMTP-based email notifications with optional PGP encryption |
| [Web Push](webpush.md)      | Per-recipient  | Browser push notifications via VAPID                        |
| [In-App](inapp.md)          | Per-recipient  | Real-time in-app notifications via Socket.IO                |
| [Telegram](telegram.md)     | Per-recipient  | Direct messages via a Telegram bot                          |
| [Pushover](pushover.md)     | Per-recipient  | Push notifications via the Pushover service                 |
| [Pushbullet](pushbullet.md) | Per-recipient  | Push notifications via the Pushbullet service               |
| [Discord](discord.md)       | Shared-channel | Posts to a Discord channel via webhook                      |
| [Slack](slack.md)           | Shared-channel | Posts to a Slack channel via incoming webhook               |
| [Gotify](gotify.md)         | Shared-channel | Posts to a self-hosted Gotify server                        |
| [ntfy](ntfy.md)             | Shared-channel | Publishes to an ntfy topic                                  |
| [Webhook](webhook.md)       | Shared-channel | Sends a customizable JSON payload to any HTTP endpoint      |

---

## Notification Types

Streamarr can send notifications for the following events:

| Event                 | Description                                |
| --------------------- | ------------------------------------------ |
| **Test Notification** | Test message to verify agent configuration |
| **Invite Redeemed**   | When an invite code is used                |
| **Invite Expired**    | When an invite expires                     |
| **User Created**      | When a new user account is created         |
| **Local Message**     | Custom messages sent by admins             |
| **New Event**         | Calendar event reminders                   |
| **System**            | System alerts and warnings                 |
| **Updates**           | Application update notifications           |
| **Friend Watching**   | When a friend starts watching content      |
| **New Invite**        | When a new invite is created               |

---

## Configuring Notifications

### Global Settings

Navigate to **Settings → Notifications** to configure notification agents.

Each agent has:

- **Enable/Disable Toggle** — Turn the agent on or off
- **Agent-Specific Settings** — Configuration for that notification method
- **Test Button** — Send a test notification to verify configuration

### User Preferences

Users can configure their notification preferences in their account settings:

- Enable/disable specific notification types
- Choose which agents to receive notifications from
- Configure Web Push subscription

---

## Notification Severity

Notifications have severity levels that affect their display:

| Severity      | Usage                                           |
| ------------- | ----------------------------------------------- |
| **Success**   | Positive events (invite redeemed, user created) |
| **Info**      | Informational messages                          |
| **Warning**   | Warnings requiring attention                    |
| **Error**     | Error notifications                             |
| **Primary**   | Primary-colored notifications                   |
| **Secondary** | Secondary-colored notifications                 |
| **Accent**    | Accent-colored notifications                    |

---

## Admin Notifications

Admins receive notifications for:

- New user signups
- Invite redemptions
- System errors
- Update availability

To receive admin notifications, you must have the **Admin** permission and have notifications enabled.

---

## Troubleshooting

### Notifications not sending

1. Verify the notification agent is enabled
2. Check agent-specific configuration (SMTP settings, VAPID keys, etc.)
3. Send a test notification to verify the configuration
4. Check the application logs for errors

### Users not receiving notifications

1. Verify the user has the notification type enabled in their preferences
2. Check that the user has a valid email address (for email notifications)
3. Verify the user has subscribed to push notifications (for Web Push)
