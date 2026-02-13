# Invites

The invite system is one of Streamarr's core features, enabling you to onboard new users to your Plex server with fine-grained control over access and expiration.

{% hint style="info" %}
Invites require [Enable Sign Up](../settings/README.md#enable-sign-up) to be enabled in Settings.
{% endhint %}

## Overview

Invites allow existing users to generate invitation codes that new users can redeem to:

1. Create a Streamarr account
2. Get added to your Plex server with configured library access
3. Optionally receive other permissions (Live TV, Downloads, etc.)

The invite system supports:

- **Usage Limits** — Control how many times an invite can be used
- **Expiration** — Set invites to expire after a specific time
- **Library Access** — Choose which Plex libraries are shared
- **Feature Access** — Toggle Downloads, Live TV, and Plex Home access
- **QR Codes** — Shareable QR codes for easy mobile redemption

---

## Creating Invites

### Basic Invite

To create a basic invite:

1. Navigate to **Invites**
2. Click **Create Invite**
3. Click **Create** to generate the invite

The invite will use default settings with:

- Single use
- No expiration
- Default library access

### Advanced Invite Options

Users with **Advanced Invites** permission can configure:

#### Usage Limit

How many times the invite can be redeemed before becoming inactive:

- **Single Use** — One redemption (default)
- **Custom** — Specify a number (e.g., 5 uses)
- **Unlimited** — No usage limit

#### Expiration

When the invite should expire:

- **Never** — No expiration
- **Days** — Expire after X days
- **Weeks** — Expire after X weeks
- **Months** — Expire after X months

Expired invites are automatically marked and cannot be redeemed.

#### Shared Libraries

Which Plex libraries the invited user will have access to:

- **Server Default** — Use the default from Settings
- **All Libraries** — All enabled libraries
- **Specific Libraries** — Select individual libraries to share

#### Feature Access

Toggle additional features for invited users:

| Feature       | Description                                  |
| ------------- | -------------------------------------------- |
| **Downloads** | Access to download management                |
| **Live TV**   | Access to Plex Live TV (if available)        |
| **Plex Home** | Add user to Plex Home instead of as a friend |

{% hint style="info" %}
**Plex Home** creates a managed user under your Plex account, which is useful for family members. Regular invites add users as "friends" to your Plex server.
{% endhint %}

<!-- TODO: Add screenshot of create invite form -->

---

## Invite Statuses

| Status       | Description                                      |
| ------------ | ------------------------------------------------ |
| **Active**   | Invite can be redeemed                           |
| **Redeemed** | Invite has been fully used (reached usage limit) |
| **Expired**  | Invite has passed its expiration date            |
| **Inactive** | Invite was manually deactivated                  |

---

## Sharing Invites

### Invite Link

Each invite has a unique URL that can be shared:

```
https://your-streamarr.com/signup?icode=AbCd1234
```

Copy the link and send it to the person you want to invite.

### QR Code

For easy mobile sharing, each invite has a QR code:

1. Click on an invite to view details
2. Click **Show QR Code**
3. The user can scan the QR code with their phone camera

QR codes link directly to the signup page with the invite code pre-filled.

{% hint style="info" %}
QR codes are cached on the server and cleaned up automatically after the invite expires.
{% endhint %}

---

## Redemption Flow

When a user clicks an invite link:

1. **Code Validation** — The invite code is checked for validity
2. **Plex Sign-In** — User signs in with their Plex account (or creates a local account)
3. **Account Creation** — Streamarr account is created
4. **Plex Server Access** — User is added to your Plex server with configured libraries
5. **Confirmation** — User is redirected to the Streamarr dashboard

### Auto-Accept

If the redeeming user is already signed into Plex, Streamarr attempts to automatically accept the Plex server invite on their behalf, making the process seamless.

---

## Managing Invites

### Viewing Invites

The **Invites** page shows all invites with:

- Invite code
- Status (Active, Redeemed, Expired, Inactive)
- Usage count / limit
- Expiration date
- Created by
- Redeemed by (list of users)

You can filter by:

- Status
- Creator
- Date range

### Editing Invites

Click on an invite to view details and:

- Copy the invite link
- View/download QR code
- See redemption history
- Toggle between Active/Inactive status
- Modify usage limit, expiration, and library access (with Advanced Invites permission)

{% hint style="info" %}
**Reactivating invites:**

- Toggle between Active/Inactive at any time
- Increase usage limit on a redeemed invite to automatically reactivate it
- Expired invites (past their date) cannot be redeemed even if manually set to Active
  {% endhint %}

---

## Invite Quotas

Admins can limit how many invites users can create:

### Default Quotas

Configure in **Settings → Users → Default Invite Quotas**:

- **Quota Limit** — Maximum invites per period
- **Quota Days** — Period duration (e.g., 30 days)

### Per-User Quotas

Override default quotas for individual users in their user settings.

### Quota Exemptions

Users with **Manage Users** or **Manage Invites** permissions are exempt from invite quotas.

---

## Trial Period Integration

If [Trial Period](../settings/README.md#enable-trial-period) is enabled:

- Users who sign up via invite are placed in trial status
- Trial users cannot create invites until the trial period ends
- Trial duration is configured in Settings

This helps prevent abuse while allowing you to evaluate new users before granting full access.

---

## Security Considerations

### Invite Code Format

Invite codes are randomly generated 8-character alphanumeric strings. This provides sufficient entropy to prevent guessing while remaining easy to share.

### Rate Limiting

The signup endpoint has rate limiting to prevent abuse. If an IP address makes too many requests, they will be temporarily blocked.

### Plex Account Verification

When a user redeems an invite:

1. They must authenticate with a valid Plex account (unless creating a local user)
2. The system verifies they don't already have access to your Plex server
3. Existing users are redirected to sign in instead of sign up

---

## Troubleshooting

### "Invite code not found"

- Check that the invite code was copied correctly
- Verify the invite hasn't been deleted

### "Invite code is not active"

- The invite may have been deactivated
- Or the invite has been fully redeemed (reached usage limit)

### "Invite code has expired"

- The invite passed its expiration date
- Create a new invite for the user

### "You already have access to this Plex server"

- The user already has a Streamarr account or Plex server access
- Direct them to the sign-in page instead

### User not appearing on Plex server

- Plex invite operations require the internal Python service
- Check application logs for errors from the Plex Sync service
