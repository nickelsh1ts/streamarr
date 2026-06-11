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

### Editing Users

Click on a user to access their settings:

#### Profile

- **Display Name** — Override the user's display name
- **Email** — User's email address (read-only for Plex users)
- **Users Invited** — Count of invites redeemed by other users (links to the user's redeemed invites list)

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

If the user is a Plex Home member, library access is managed through Plex Home. Re-inviting a user as Plex Home will re-provision their access if needed. Only users who have accepted their Plex Home invite will appear as active members.

#### Pin Libraries

Pin selected libraries to the user's Plex sidebar so they appear prominently when the user opens Plex.

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
| **Request**              | Request content through Seerr integration.                                            |
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

If [Trial Period](../settings/README.md#enable-trial-period) is enabled, newly signed-up users are placed in a trial state:

- Trial users cannot create invites
- Other restrictions may apply based on permissions
- Trial users are clearly marked in the user list and on their profile

When the trial ends, the user is either promoted to full access or marked as **Expired** (loses access) depending on admin policy. Admins can manually end or extend a user's trial from the user settings page. Users may request an extension to their trial or access period from their profile, which admins can grant by extending their trial period.

Users with **Manage Users** or **Manage Invites** permissions bypass trial restrictions.

---

## Removed from Plex

If a user is removed from the Plex server's shared list outside of Streamarr (e.g. directly in the Plex app), Streamarr detects it automatically—when an admin views their profile or settings, when the user attempts to sign in, or via the [Plex Membership Check](../settings/README.md#scheduled-jobs) job—and deactivates the account. Any pending trial period is cleared, Seerr permissions are revoked, and admins with **Manage Users** permission receive a **Plex Access Removed** notification.

Removed users are shown as **Deactivated** (distinct from **Expired**, which indicates a lapsed trial) in the user list and on their profile. Like expired users, they can still sign in to view their profile and settings, and may submit an access extension request.

To restore access, open the user's settings and click **Reinvite**. This sends a new Plex invite using the user's existing shared libraries, download, and Plex Home settings, and reactivates the account. If the invite cannot be sent, the user remains deactivated and the error is shown—simply retry once Plex is reachable. Previously connected accounts are typically auto-accepted by Plex; otherwise the user must accept the invite from their Plex account.

{% hint style="info" %}
Detection only occurs on a confirmed removal from the shared users list. Temporary plex.tv outages or token issues never deactivate users.
{% endhint %}

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

## Service Navigation Links

When configured by the administrator, additional navigation links appear for users:

| Link              | Location                | Shown When                                              |
| ----------------- | ----------------------- | ------------------------------------------------------- |
| **Watch History** | User dropdown menu      | Tautulli is configured and has a URL base set           |
| **Request**       | Sidebar and mobile menu | Seerr is configured and user has **Request** permission |

---

## User Profile

The profile page (`/profile` for the current user, `/admin/users/:id` for admins) displays a summary of activity and quotas alongside interactive content sliders. Admins can view any user's profile; regular users can only view their own.

### Stats Cards

Up to three stat cards are shown at the top of the profile depending on configuration:

#### Invite Stats

Shown when sign-up is enabled **or** the user has sent or received invites:

- **Users Invited** — Number of other users who redeemed this user's invite codes (links to the redeemed invites list)
- **Invited By** — Who sent this user their invite. Users with **Manage Users** permission see a clickable link to the inviter's profile; other users see the name as plain text.

#### Trial Period

When a trial period is active for the user, a dedicated card replaces the invite quota card showing the trial end date. If the account is deactivated—whether from a lapsed trial (**Account Expired**) or removal from Plex (**Account Deactivated**)—a status card is shown instead, with guidance for the user or admin.

#### Seerr Request Quota

Shown when Seerr is configured. Displays the user's remaining request quota for movies and TV shows, with a colour-coded progress circle for each:

| Quota State        | Appearance                                                           |
| ------------------ | -------------------------------------------------------------------- |
| Requests remaining | Progress circle fills from green → yellow → red as quota is consumed |
| Quota reached      | Card border and text turn red                                        |
| No quota set       | Displays "Unlimited"                                                 |

The quota labels reflect the configured time window — e.g., "Movies (past 7 days)" or "Movies (Lifetime)".

### Recent Requests

Shown when Seerr is configured and the user has made at least one request. Displays a horizontal scrollable slider of the user's most recent 20 requests.

Each card shows:

- Movie/TV show poster (from TMDB)
- Title and release year
- Seasons requested (TV only)
- The requester's avatar and name
- A live status badge that refreshes every 15 seconds

**Status badges:**

| Badge               | Meaning                                                              |
| ------------------- | -------------------------------------------------------------------- |
| Available           | Media is in Plex and ready to watch (links to the Seerr detail page) |
| Partially Available | Some episodes/seasons are available                                  |
| Requested           | Approved and downloading                                             |
| Pending             | Awaiting approval                                                    |
| Declined            | Request was declined                                                 |
| Failed              | Processing failed                                                    |
| Deleted             | Media was removed                                                    |

Admins are linked to the Seerr management page for each item; users are linked to the standard request detail page.

{% hint style="info" %}
The "Recent Requests" link at the top of the slider navigates to the full request list in the embedded Seerr interface (`/request/requests`). Admins viewing another user's profile are taken to that user's request list in the Seerr admin area.
{% endhint %}

### Recently Watched

Shown for **Plex users only** when Tautulli is configured and the user has watch history.

Each card shows the poster for the movie or TV show (using the Plex image proxy with TMDB fallback) and:

- Title and episode name (for TV episodes)
- A watch-progress bar (hidden once the item is ≥ 85% complete)
- A summary that appears on hover/tap
- A **Deleted** badge if the item has since been removed from Plex

Clicking/tapping a card opens the item directly in Plex Web. On touch devices, the first tap shows the detail overlay and the second tap navigates.

{% hint style="info" %}
The "Recently Watched" link at the top of the slider navigates to `/activity/history` — the watch history page within the embedded Tautulli interface.
{% endhint %}

### Profile Background

The profile layout background dynamically uses TMDB backdrop images sourced from the user's recent watch history. If no watch history is available (or Tautulli is not configured), it falls back to Plex library backdrops or the default cinema image.

These links navigate to `/activity` (Tautulli) and `/request` (Seerr) respectively, which load the corresponding service through Streamarr's internal proxy. The availability of each link is controlled entirely by admin configuration in [Settings](../settings/README.md) — users cannot toggle them on or off.

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
