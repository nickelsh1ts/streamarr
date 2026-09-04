# Linked Accounts

Linked Accounts let a Streamarr user connect an external identity—**Plex** or **Audiobookshelf**—to their Streamarr account. Linking a Plex account enables Plex sign-in for that user and ties their Plex identity (username and avatar) to their Streamarr profile. Linking an Audiobookshelf account lets Streamarr sign the user in to the embedded [Audiobooks](../listen.md) player automatically.

## Overview

There are two places to manage linked accounts:

| Location                                                 | Who it is for                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| **Profile → Settings → Linked Accounts**                 | Manage the accounts linked to **your own** user   |
| **Users → (select a user) → Settings → Linked Accounts** | Admins viewing **another** user's linked accounts |

{% hint style="info" %}
Supported linked account types are **Plex** and **Audiobookshelf**. Additional providers may be added in future releases.
{% endhint %}

---

## Linking a Plex Account

You can link a Plex account only to **your own** Streamarr account:

1. Go to **Profile → Settings → Linked Accounts**.
2. Under the **Plex** entry (shown as _No Account Linked_), click **Link Plex Account**.
3. A Plex sign-in popup opens. Authorize Streamarr with the Plex account you want to link.
4. Once authorization completes, the Plex account appears in your linked accounts list with its username.

If the popup is blocked or authorization fails, an error is shown and no account is linked.

{% hint style="info" %}
Local users who later link a Plex account that shares the same email may be converted to a Plex user. See [Users → User Types](README.md#user-types).
{% endhint %}

---

## Unlinking a Plex Account

To remove a linked Plex account, open your own **Linked Accounts** page, find the linked entry, and click **Unlink Account**. You will be asked to confirm.

Unlinking is only available when **both** of the following are true:

- You are **not** the primary admin account (user ID 1).
- Your account has a **local password set**.

{% hint style="warning" %}
The local-password requirement exists so you do not lock yourself out. If your only way to sign in is Plex, set a password first (via **Profile → Settings → Password**) before unlinking, or you will be unable to sign back in.
{% endhint %}

{% hint style="danger" %}
The primary admin account (user ID 1) cannot unlink its Plex account.
{% endhint %}

---

## Linking an Audiobookshelf Account

The **Audiobookshelf** entry appears only when an administrator has enabled and configured the Audiobookshelf integration under **Admin → Settings → Services → Audiobookshelf**.

1. Go to **Profile → Settings → Linked Accounts**.
2. Under the **Audiobookshelf** entry, click **Link Audiobookshelf Account**.
3. Enter a password and confirm.

What happens next depends on whether Streamarr finds a matching Audiobookshelf account. Streamarr matches on your email address, then on your Streamarr username, Plex username, or the local part of your email:

| Situation                                                         | Result                                                                                                                                                            |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A matching account exists                                         | Streamarr signs in with the password you supplied and links that account. If the password is wrong, you are asked to try again or request an administrator reset. |
| No matching account exists, and **Enable New User Signin** is on  | Streamarr creates a new Audiobookshelf account with the password you supplied.                                                                                    |
| No matching account exists, and **Enable New User Signin** is off | Linking is refused. Ask an administrator to link an account for you.                                                                                              |

Streamarr stores the password encrypted at rest so it can renew your Audiobookshelf session silently on each visit to the Audiobooks page.

{% hint style="info" %}
Accounts Streamarr creates are given read-only Audiobookshelf permissions: no download, upload, update, or delete. Administrators can adjust these in Audiobookshelf directly.
{% endhint %}

---

## Resetting an Audiobookshelf Password

If your stored password stops working—most often because it was changed in Audiobookshelf directly—the Audiobooks page shows a **Reset Password** prompt instead of the player.

- **You can reset it yourself** by supplying your current Audiobookshelf password along with a new one.
- **If you have forgotten it**, use **Notify Administrators**. This sends an [Audiobookshelf Password Reset Requested](../notifications/README.md) notification to every user with the **Manage Users** permission. You can only send this request once until an administrator acts on it.

Users with the **Manage Users** permission can reset another user's Audiobookshelf password without knowing the existing one.

---

## Unlinking an Audiobookshelf Account

Open **Linked Accounts**, find the Audiobookshelf entry, and click **Unlink Account**.

{% hint style="warning" %}
Unlinking clears the stored credentials from Streamarr only. The account itself is **not** deleted from Audiobookshelf, and any listening progress is preserved. Re-linking the same account restores access.
{% endhint %}

---

## Admin View

Administrators with the **Manage Users** permission can open any user's **Linked Accounts** page to see which external accounts that user has connected.

{% hint style="info" %}
The admin view is **read-only**. Linking and unlinking can only be performed by the account owner from their own profile settings—an admin cannot link or unlink on a user's behalf.
{% endhint %}

If you try to view another user's linked accounts without the **Manage Users** permission, Streamarr displays a permission error.

---

## API Reference

| Endpoint                                                            | Method | Description                                                                                                                  |
| ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/user/{id}/settings/linked-accounts/plex`                   | POST   | Link a Plex account (provide a `pinId` from the server-side Plex pin exchange; a raw `authToken` is accepted but deprecated) |
| `/api/v1/user/{id}/settings/linked-accounts/plex`                   | DELETE | Unlink the user's Plex account                                                                                               |
| `/api/v1/user/{id}/settings/linked-accounts/audiobookshelf`         | POST   | Link, create, or reset the user's Audiobookshelf account                                                                     |
| `/api/v1/user/{id}/settings/linked-accounts/audiobookshelf`         | DELETE | Unlink the user's Audiobookshelf account                                                                                     |
| `/api/v1/user/{id}/settings/linked-accounts/audiobookshelf/notify`  | POST   | Ask administrators to reset the user's Audiobookshelf password                                                               |
| `/api/v1/user/{id}/settings/linked-accounts/audiobookshelf/session` | POST   | Renew the Audiobookshelf session for an already-linked account                                                               |

These endpoints act on the authenticated user's own account. Viewing another user's account information requires the **Manage Users** permission.
