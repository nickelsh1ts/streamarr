# Pushover Notifications

Pushover notifications are delivered to individual users via the [Pushover](https://pushover.net/) service.

## Overview

Pushover is a **per-recipient** agent: an administrator registers a Streamarr application with Pushover, and each user provides their own Pushover user key to receive notifications on their devices. Configure the application under **Settings → Notifications → Pushover**, and each user sets their user key under **Account Settings → Notifications → Pushover**.

---

## Creating a Pushover Application

1. Log in to [pushover.net](https://pushover.net/).
2. Under **Your Applications**, click **Create a New Application/API Token**.
3. Name it (for example, `Streamarr`) and submit.
4. Copy the generated **API Token/Key**.

Your **User Key** is shown on the main Pushover dashboard after logging in.

---

## Server Configuration

Navigate to **Settings → Notifications → Pushover**.

| Setting               | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| **Enabled**           | Enable or disable Pushover notifications                       |
| **Application Token** | The API token/key for your Pushover application                |
| **User Key**          | The default user (or group) key for admin/system notifications |
| **Sound**             | The notification sound to use                                  |

---

## User Configuration

Each user enables Pushover for their own account:

1. Go to **Account Settings → Notifications → Pushover**.
2. Enter your **User Key**.
3. Select which notification types to receive.

---

## Testing

After configuring, use the **Test** button to send a test notification. It should arrive on your Pushover-enabled devices within a few seconds.

---

## Troubleshooting

### Notifications not arriving

1. Verify the agent is **Enabled** and the **Application Token** is correct.
2. Confirm the **User Key** is valid and the Pushover app is installed and signed in on your device.
3. Send a test notification and check the application logs for errors.
