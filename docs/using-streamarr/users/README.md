# Users

Streamarr supports two types of users: **Plex users** and **Local users**. This page covers user management, permissions, and quotas.

## User Types

### Plex Users

Plex users authenticate using Plex OAuth. They are created when:

- A user with access to your Plex server signs in for the first time (if [Enable New Plex Sign-In](../settings/README.md#enable-new-plex-sign-in) is enabled)
- A user redeems an invite code and signs in with Plex
- An admin imports users from Plex

Plex users have their avatar, username, and email synced from their Plex account.

### Local Users

Local users authenticate with an email address and password. They are created when:

- A user redeems an invite code and creates a local account
- An admin manually creates a local user

Local users can be converted to Plex users if they later sign in with a Plex account that uses the same email address.

---

## Managing Users

### User List

The user list displays all registered users with:

- Avatar and display name
- Email address
- User type (Plex or Local)
- Permission summary
- Account creation date
- Last activity

Users can be sorted and filtered by various criteria.

<!-- TODO: Add screenshot of user list -->

### Editing Users

Click on a user to access their settings:

#### Profile

- **Display Name** — Override the user's display name
- **Email** — User's email address (read-only for Plex users)

#### Permissions

Assign granular permissions to control what the user can access. See [Permissions](#permissions) below.

#### Invite Quotas

Override the default invite quota for this user:

- **Quota Limit** — Maximum invites this user can create
- **Quota Days** — Time period for quota reset

#### Shared Libraries

Override which Plex libraries this user has access to:

- **Server Default** — Use the default from Settings
- **All Libraries** — Access to all enabled libraries
- **Specific Libraries** — Select specific library IDs

### Deleting Users

Admins can delete users from the user list or user settings page.

{% hint style="warning" %}
Deleting a user does not remove them from your Plex server. You must remove their Plex access separately if desired.
{% endhint %}

{% hint style="danger" %}
The admin user (ID 1) cannot be deleted.
{% endhint %}

---

## Permissions

Streamarr uses a granular permission system. Users can have any combination of the following permissions:

| Permission               | Description                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------- |
| **Admin**                | Full access to all features and settings. Automatically grants all other permissions. |
| **Manage Users**         | View, edit, and delete users. Exempt from invite quotas.                              |
| **Manage Invites**       | View and manage all invites (not just their own).                                     |
| **View Invites**         | View all invites (read-only).                                                         |
| **Create Invites**       | Create new invite codes.                                                              |
| **Advanced Invites**     | Create invites with custom settings (expiry, usage limits).                           |
| **Streamarr**            | Basic access to the Streamarr dashboard.                                              |
| **Vote**                 | Vote on content or events.                                                            |
| **Request**              | Request content through Overseerr integration.                                        |
| **View Schedule**        | View the release calendar.                                                            |
| **Manage Events**        | Create, edit, and delete calendar events.                                             |
| **Create Events**        | Create new calendar events (but not edit/delete).                                     |
| **Manage Notifications** | Manage all notifications.                                                             |
| **Create Notifications** | Create new notifications/announcements.                                               |
| **View Notifications**   | View notifications.                                                                   |

### Default Permissions

When a new user is created, they receive the permissions configured in [Settings → Users → Default Permissions](../settings/README.md#default-permissions).

The default permission for new users is **Streamarr** (basic dashboard access).

---

## Importing Users from Plex

Admins can import existing Plex server users:

1. Go to **Settings → Plex**
2. Click **Import Plex Users**
3. Select which users to import
4. Configure default permissions for imported users
5. Click **Import**

{% hint style="info" %}
Only users who have accepted their Plex server invite can be imported. Pending invites will not appear in the import list.
{% endhint %}

---

## Creating Local Users

To create a local user:

1. Go to **Users**
2. Click **Create User**
3. Enter email address and display name
4. Set a password or generate one automatically
5. Configure permissions
6. Click **Create**

If email notifications are configured, the user will receive a welcome email with their credentials.

---

## Trial Period

If [Trial Period](../settings/README.md#enable-trial-period) is enabled, newly signed-up users are restricted during their trial:

- Cannot create invites
- May have other restrictions based on their permissions

The trial period duration is configurable in Settings. Users with **Manage Users** or **Manage Invites** permissions bypass trial restrictions.

---

## Password Reset

Users can reset their password by:

1. Clicking **Forgot Password** on the sign-in page
2. Entering their email address
3. Clicking the link in the password reset email

{% hint style="warning" %}
Password reset requires:

- [Application URL](../settings/README.md#application-url) to be configured
- [Email notifications](../notifications/email.md) to be configured
  {% endhint %}

---

## Account Security

### Password Requirements

Local user passwords must meet minimum complexity requirements:

- Minimum 8 characters

---

## Onboarding

Streamarr includes an interactive onboarding system for new users. See [Onboarding Settings](../settings/onboarding.md) for configuration details.

### Reset Onboarding

Users and administrators can reset onboarding progress:

- **For yourself**: Go to your account settings and click "Reset Onboarding"
- **For other users** (admins only): Edit the user and click "Reset Onboarding"

This causes the welcome modal and tutorial to show again on the next login.

### Start Tutorial Manually

Users can start the tutorial at any time from the user dropdown menu (click your avatar, then "Start Tutorial") as long as it hasn't been completed or skipped.

To re-experience the full onboarding flow (welcome modal + tutorial), use the "Reset Onboarding" option in account settings.
