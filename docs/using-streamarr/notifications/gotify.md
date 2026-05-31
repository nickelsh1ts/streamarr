# Gotify Notifications

Gotify notifications are delivered to a self-hosted [Gotify](https://gotify.net/) server.

## Overview

Gotify is a **shared-channel** agent: it posts each notification once to your Gotify server using an application token. Anyone with access to that Gotify application receives the messages. Configure it under **Settings → Notifications → Gotify**.

---

## Creating a Gotify Application Token

1. Log in to your Gotify web interface.
2. Go to **Apps** and click **Create Application**.
3. Give the application a name (for example, `Streamarr`).
4. Copy the generated **Token**.

---

## Configuration

Navigate to **Settings → Notifications → Gotify**.

| Setting               | Description                                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| **Enabled**           | Enable or disable Gotify notifications                                         |
| **Server URL**        | The base URL of your Gotify server (for example, `https://gotify.example.com`) |
| **Application Token** | The application token created above                                            |
| **Priority**          | Default message priority (higher values are more intrusive)                    |

{% hint style="info" %}
Streamarr authenticates to Gotify using the `X-Gotify-Key` header.
{% endhint %}

---

## Testing

Click **Save Changes**, then use the **Test** button to send a test notification. A message should appear in your Gotify clients within a few seconds.

---

## Troubleshooting

### Notifications not appearing

1. Verify the agent is **Enabled** and the **Server URL** and **Application Token** are correct.
2. Ensure the Gotify server is reachable from the Streamarr host.
3. Confirm the application token has not been revoked.
4. Send a test notification and check the application logs for errors.
