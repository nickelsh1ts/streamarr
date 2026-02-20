# Notifications

Streamarr supports multiple notification channels to keep you and your users informed about important events.

## Available Notification Agents

| Agent                  | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| [Email](email.md)      | SMTP-based email notifications with optional PGP encryption |
| [Web Push](webpush.md) | Browser push notifications via VAPID                        |
| [In-App](inapp.md)     | Real-time in-app notifications via Socket.IO                |

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
