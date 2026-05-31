# Slack Notifications

Slack notifications post messages to a Slack channel using an incoming webhook.

## Overview

Slack is a **shared-channel** agent: it posts each notification once to a single Slack channel via an incoming webhook URL. Configure it under **Settings → Notifications → Slack**.

---

## Creating a Slack Webhook

1. Go to the [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks) page.
2. Create a new Slack app (or use an existing one) in your workspace.
3. Enable **Incoming Webhooks** for the app.
4. Click **Add New Webhook to Workspace** and choose the destination channel.
5. Copy the generated **Webhook URL**.

{% hint style="info" %}
You must be a workspace administrator, or have permission to install apps, to create an incoming webhook.
{% endhint %}

---

## Configuration

Navigate to **Settings → Notifications → Slack**.

| Setting         | Description                                 |
| --------------- | ------------------------------------------- |
| **Enabled**     | Enable or disable Slack notifications       |
| **Webhook URL** | The Slack incoming webhook URL copied above |

---

## Testing

Click **Save Changes**, then use the **Test** button to send a test notification. A message should appear in the configured Slack channel within a few seconds.

---

## Troubleshooting

### Notifications not appearing

1. Verify the agent is **Enabled** and the **Webhook URL** is correct.
2. Confirm the incoming webhook is still active in your Slack app settings.
3. Send a test notification and check the application logs for errors.
