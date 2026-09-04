# Audiobooks

The **Audiobooks** page embeds your [Audiobookshelf](https://www.audiobookshelf.org/) server inside Streamarr, so users can browse and listen to your audiobook and podcast libraries without leaving the app or signing in a second time.

## Requirements

- A running Audiobookshelf server reachable from Streamarr.
- An Audiobookshelf **API key** created by an admin user (Audiobookshelf → **Settings → Users → API Keys**).
- Audiobookshelf started with its `ROUTER_BASE_PATH` environment variable set to match the **URL Base** you configure in Streamarr.

{% hint style="warning" %}
The base path must match on both sides. Without `ROUTER_BASE_PATH`, Audiobookshelf serves its assets from the root and they will fail to load inside Streamarr. Restart Audiobookshelf after changing it.
{% endhint %}

---

## Configuration

Go to **Admin → Settings → Services → Audiobookshelf**.

| Setting                    | Description                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enable**                 | Turns the integration on. When off, the Audiobooks menu entry is hidden and the proxy route is removed.                                                                                       |
| **Hostname or IP Address** | Where Audiobookshelf is reachable from the Streamarr server.                                                                                                                                  |
| **Port**                   | Audiobookshelf's port. Defaults to `13378`.                                                                                                                                                   |
| **Use SSL**                | Connect over HTTPS.                                                                                                                                                                           |
| **URL Base**               | The path Streamarr serves Audiobookshelf under, e.g. `/audiobookshelf`. Must have a leading slash and no trailing slash, and must match `ROUTER_BASE_PATH`. Changing this requires a restart. |
| **API Key**                | An Audiobookshelf API key. Streamarr uses it to look up, create, and update user accounts.                                                                                                    |
| **Enable New User Signin** | Allows users without an existing Audiobookshelf account to create one when they link. When off, only users with **Manage Users** can link accounts on someone's behalf.                       |

Use **Test** to verify the connection before saving. Once configured, Audiobookshelf appears on the [System](settings/system.md) health dashboard with its reported version.

---

## Access Control

The Audiobooks page and its proxy route require either the **Audiobooks** permission or the **Streamarr** permission. Because **Streamarr** is granted to every user by default, the **Audiobooks** permission is only needed for users who do not have it.

Grant it under **Users → (select a user) → Permissions → Audiobooks**.

---

## Using the Player

Open **Audiobooks** from the library menu. On each visit, Streamarr silently renews the user's Audiobookshelf session using the credentials stored when they linked their account. Signing out of Streamarr revokes that Audiobookshelf session as well.

If no account is linked yet, or the stored credentials have stopped working, the page shows a prompt to link or reset instead of the player. See [Linked Accounts](users/linked-accounts.md) for those flows.

Deep links are preserved across sign-in, so a bookmarked item opens directly once the session is established.

---

## Notifications

When a user asks for an Audiobookshelf password reset, Streamarr sends an **Audiobookshelf Password Reset Requested** notification to every user with the **Manage Users** or **Admin** permission. See [Notifications](notifications/README.md) to configure delivery.
