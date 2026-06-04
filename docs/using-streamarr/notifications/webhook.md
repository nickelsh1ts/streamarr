# Webhook Notifications

Webhook notifications send a customizable JSON payload to any HTTP endpoint, allowing integration with external automation tools and custom services.

## Overview

Webhook is a **shared-channel** agent: it sends each notification as an HTTP `POST` request to a single endpoint. The request body is a JSON payload you define, with support for template variables. Configure it under **Settings → Notifications → Webhook**.

---

## Configuration

Navigate to **Settings → Notifications → Webhook**.

| Setting                  | Description                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| **Enabled**              | Enable or disable webhook notifications                                  |
| **Webhook URL**          | The endpoint that receives the `POST` request                            |
| **Authorization Header** | Optional value sent in the `Authorization` header                        |
| **Custom Headers**       | Optional additional request headers (key/value pairs)                    |
| **JSON Payload**         | The JSON body sent with each notification, edited in the built-in editor |

---

## Template Variables

Placeholders in the JSON payload are replaced with the values for each notification at send time. Use these to forward notification details to your endpoint.

Common variables include the notification subject, message, type, and any associated event or invite details. Edit the payload in the JSON editor and insert variables where needed.

{% hint style="info" %}
The JSON payload must be valid JSON. The editor highlights syntax errors before you save.
{% endhint %}

---

## Testing

Click **Save Changes**, then use the **Test** button to send a test notification. Your endpoint should receive a `POST` request with the configured payload.

---

## Troubleshooting

### Endpoint not receiving requests

1. Verify the agent is **Enabled** and the **Webhook URL** is reachable from the Streamarr host.
2. Confirm any required **Authorization Header** or **Custom Headers** are correct.
3. Check that the **JSON Payload** is valid.
4. Send a test notification and check the application logs for errors.

### Payload values are missing

- Ensure **Enable Template Variables** is enabled if your payload relies on variable substitution.
- Confirm the variable placeholders are spelled correctly.
