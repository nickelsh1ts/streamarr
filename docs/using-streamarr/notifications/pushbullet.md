# Pushbullet Notifications

Pushbullet notifications are delivered to individual users via the [Pushbullet](https://www.pushbullet.com/) service.

## Overview

Pushbullet is a **per-recipient** agent: each user provides their own Pushbullet access token to receive notifications on their devices. Configure the agent under **Settings → Notifications → Pushbullet**, and each user sets their access token under **Account Settings → Notifications → Pushbullet**.

---

## Finding Your Access Token

1. Log in to [pushbullet.com](https://www.pushbullet.com/).
2. Go to **Settings → Account**.
3. Under **Access Tokens**, click **Create Access Token**.
4. Copy the generated token.

---

## Server Configuration

Navigate to **Settings → Notifications → Pushbullet**.

| Setting          | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| **Enabled**      | Enable or disable Pushbullet notifications                              |
| **Access Token** | The default access token for admin/system notifications                 |
| **Channel Tag**  | Optional channel tag to broadcast notifications to a Pushbullet channel |

---

## User Configuration

Each user enables Pushbullet for their own account:

1. Go to **Account Settings → Notifications → Pushbullet**.
2. Enter your **Access Token**.
3. Select which notification types to receive.

---

## Testing

After configuring, use the **Test** button to send a test notification. It should arrive on your Pushbullet-enabled devices within a few seconds.

---

## Troubleshooting

### Notifications not arriving

1. Verify the agent is **Enabled** and the **Access Token** is correct.
2. Confirm the Pushbullet app is installed and signed in on your device.
3. Send a test notification and check the application logs for errors.
