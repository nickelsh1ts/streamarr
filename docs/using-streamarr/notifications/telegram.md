# Telegram Notifications

Telegram notifications are delivered to individual users via a Telegram bot.

## Overview

Telegram is a **per-recipient** agent: an administrator configures a bot, and each user provides their own chat ID to receive notifications directly. Configure the bot under **Settings → Notifications → Telegram**, and each user sets their chat ID under **Account Settings → Notifications → Telegram**.

---

## Creating a Telegram Bot

1. In Telegram, start a chat with [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts to name your bot.
3. BotFather returns a **bot token** — copy it.

---

## Server Configuration

Navigate to **Settings → Notifications → Telegram**.

| Setting               | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| **Enabled**           | Enable or disable Telegram notifications                          |
| **Bot Token**         | The token returned by BotFather                                   |
| **Bot Username**      | Optional bot username, enabling users to start the bot via a link |
| **Chat ID**           | The default chat ID for admin/system notifications                |
| **Message Thread ID** | Optional thread ID for posting into a forum topic                 |
| **Send Silently**     | Deliver notifications without sound                               |

---

## Finding Your Chat ID

1. Start a chat with your bot (or add it to a group).
2. Send any message to the bot.
3. Use a bot such as [@get_id_bot](https://t.me/get_id_bot), or visit `https://api.telegram.org/bot<token>/getUpdates`, to find your numeric **chat ID**.

---

## User Configuration

Each user enables Telegram for their own account:

1. Go to **Account Settings → Notifications → Telegram**.
2. Enter your **Chat ID**.
3. Select which notification types to receive.

---

## Testing

After configuring, use the **Test** button to send a test notification. A message should arrive in the configured chat within a few seconds.

---

## Troubleshooting

### Notifications not arriving

1. Verify the agent is **Enabled** and the **Bot Token** is correct.
2. Ensure you have started a conversation with the bot — bots cannot message users first.
3. Confirm the **Chat ID** is correct.
4. Send a test notification and check the application logs for errors.
