# ntfy Notifications

ntfy notifications are delivered to an [ntfy](https://ntfy.sh/) topic, either on the public server or a self-hosted instance.

## Overview

ntfy is a **shared-channel** agent: it publishes each notification once to a topic. Anyone subscribed to that topic receives the messages. Configure it under **Settings → Notifications → ntfy**.

---

## Configuration

Navigate to **Settings → Notifications → ntfy**.

| Setting            | Description                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Enabled**        | Enable or disable ntfy notifications                                                      |
| **Server URL**     | The ntfy server URL (for example, `https://ntfy.sh` or your self-hosted URL)              |
| **Topic**          | The topic to publish notifications to                                                     |
| **Priority**       | Default message priority                                                                  |
| **Authentication** | How to authenticate with the server: **None**, **Username/Password**, or **Access Token** |
| **Username**       | Username (when using Username/Password authentication)                                    |
| **Password**       | Password (when using Username/Password authentication)                                    |
| **Access Token**   | Access token (when using Access Token authentication)                                     |

{% hint style="warning" %}
Topics on the public `ntfy.sh` server are not private — anyone who knows the topic name can read and publish to it. Choose a long, unguessable topic name, or use a self-hosted server with authentication for sensitive notifications.
{% endhint %}

---

## Subscribing

Install the ntfy app on your device (or use the web app), then subscribe to the same **Server URL** and **Topic** you configured in Streamarr.

---

## Testing

Click **Save Changes**, then use the **Test** button to send a test notification. A message should appear on devices subscribed to the topic within a few seconds.

---

## Troubleshooting

### Notifications not appearing

1. Verify the agent is **Enabled** and the **Server URL** and **Topic** match your subscription.
2. If using authentication, confirm the credentials or token are valid.
3. Ensure the ntfy server is reachable from the Streamarr host.
4. Send a test notification and check the application logs for errors.
