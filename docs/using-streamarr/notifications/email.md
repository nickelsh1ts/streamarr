# Email Notifications

Email notifications are sent via SMTP and support optional PGP encryption for enhanced security.

## Configuration

Navigate to **Settings → Notifications → Email** to configure email notifications.

### Basic Settings

| Setting         | Description                                     |
| --------------- | ----------------------------------------------- |
| **Enabled**     | Enable or disable email notifications           |
| **Sender Name** | Name displayed in the "From" field              |
| **Email From**  | Email address used as the sender                |
| **SMTP Host**   | Hostname of your SMTP server                    |
| **SMTP Port**   | Port for SMTP connection (typically 587 or 465) |

### Security Settings

| Setting                            | Description                             |
| ---------------------------------- | --------------------------------------- |
| **Use Secure Connection**          | Enable TLS/SSL encryption               |
| **Ignore TLS**                     | Skip TLS verification (not recommended) |
| **Require TLS**                    | Require TLS connection                  |
| **Allow Self-Signed Certificates** | Accept self-signed SSL certificates     |

### Authentication

| Setting           | Description                              |
| ----------------- | ---------------------------------------- |
| **Auth User**     | SMTP username (often your email address) |
| **Auth Password** | SMTP password or app-specific password   |

---

## Common SMTP Configurations

{% tabs %}
{% tab title="Gmail" %}

| Setting               | Value                    |
| --------------------- | ------------------------ |
| SMTP Host             | `smtp.gmail.com`         |
| SMTP Port             | `587`                    |
| Use Secure Connection | Enabled                  |
| Auth User             | Your Gmail address       |
| Auth Password         | App Password (see below) |

{% hint style="warning" %}
If you have 2-Step Verification enabled on your Google account (recommended), you must create an [App Password](https://support.google.com/mail/answer/185833) to use with Streamarr.
{% endhint %}

{% endtab %}

{% tab title="Outlook/Office 365" %}

| Setting               | Value                        |
| --------------------- | ---------------------------- |
| SMTP Host             | `smtp.office365.com`         |
| SMTP Port             | `587`                        |
| Use Secure Connection | Enabled                      |
| Auth User             | Your Outlook/Microsoft email |
| Auth Password         | Your password                |

{% endtab %}

{% tab title="Custom SMTP" %}

For self-hosted mail servers or other providers, consult your provider's documentation for the correct settings.

Common ports:

- `25` — Unencrypted (often blocked by ISPs)
- `465` — SSL/TLS
- `587` — STARTTLS (recommended)

{% endtab %}
{% endtabs %}

---

## PGP Encryption

For enhanced security, email notifications can be encrypted using PGP.

### Setup

1. Generate a PGP key pair if you don't have one
2. In **Settings → Notifications → Email**:
   - Paste your **PGP Private Key** (ASCII armored)
   - Enter the **PGP Password** (passphrase for the private key)

### How It Works

When PGP is configured:

1. Outgoing emails are signed with your private key
2. Recipients can verify the email authenticity using your public key
3. If the recipient's public key is known, the email can be encrypted

{% hint style="info" %}
PGP encryption is optional and primarily useful for privacy-conscious users who want to verify email authenticity.
{% endhint %}

---

## Email Templates

Streamarr uses customized email templates for different notification types:

- **Test Email** — Verification that email is configured correctly
- **User Created** — Welcome email for new users
- **Local Message** — Custom admin announcements
- **Invite Redeemed** — Notification when an invite is used
- **Password Reset** — Password recovery link

Templates automatically include:

- Application branding (logo, colors)
- Application title and URL
- Recipient name and email

---

## Testing

After configuring email settings:

1. Click **Test** next to the Email agent
2. A test email will be sent to the admin email address
3. Verify you receive the email

### Troubleshooting

#### "Username and Password not accepted"

- For Gmail: Create an [App Password](https://support.google.com/mail/answer/185833)
- For other providers: Verify credentials are correct
- Check if your account requires "Allow less secure apps" (not recommended)

#### Emails marked as spam

- Ensure your SMTP server has proper SPF, DKIM, and DMARC records
- Use a recognized sender email address
- Avoid spam trigger words in notification content

#### Connection timeout

- Verify SMTP host and port are correct
- Check firewall rules on your server
- Try port 587 instead of 465 (or vice versa)

#### Self-signed certificate errors

- Enable **Allow Self-Signed Certificates** (less secure)
- Or install a valid SSL certificate on your mail server
