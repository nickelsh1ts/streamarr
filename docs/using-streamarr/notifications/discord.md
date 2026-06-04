# Discord Notifications

Discord notifications post messages to a Discord channel using an incoming webhook.

## Overview

Discord is a **shared-channel** agent: it posts each notification once to a single Discord channel via a webhook URL. All members of that channel see the notifications. Configure it under **Settings → Notifications → Discord**.

---

## Creating a Discord Webhook

1. Open Discord and go to the **Server Settings** of the server you want to post to.
2. Select **Integrations → Webhooks**.
3. Click **New Webhook**.
4. Choose the channel the notifications should post to.
5. Click **Copy Webhook URL**.

{% hint style="info" %}
You must have the **Manage Webhooks** permission on the Discord server to create a webhook.
{% endhint %}

---

## Configuration

Navigate to **Settings → Notifications → Discord**.

| Setting             | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| **Enabled**         | Enable or disable Discord notifications                            |
| **Webhook URL**     | The Discord webhook URL copied above                               |
| **Bot Username**    | Optional override for the name shown on posted messages            |
| **Bot Avatar URL**  | Optional override for the avatar shown on posted messages          |
| **Enable Mentions** | When enabled, includes a role mention with notifications           |
| **Webhook Role ID** | The Discord role ID to mention when **Enable Mentions** is enabled |

To find a role ID, enable **Developer Mode** in Discord (**Settings → Advanced → Developer Mode**), then right-click the role and select **Copy ID**.

---

## Testing

Click **Save Changes**, then use the **Test** button to send a test notification. A message should appear in the configured Discord channel within a few seconds.

---

## Troubleshooting

### Notifications not appearing

1. Verify the agent is **Enabled** and the **Webhook URL** is correct.
2. Confirm the webhook still exists in the Discord channel settings.
3. Send a test notification and check the application logs for errors.

### Role not being mentioned

- Ensure **Enable Mentions** is enabled and a valid **Webhook Role ID** is set.
- Verify the role ID was copied with Developer Mode enabled.
