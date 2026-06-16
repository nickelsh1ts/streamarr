# Linked Accounts

Linked Accounts let a Streamarr user connect an external identity—currently **Plex**—to their Streamarr account. Linking a Plex account enables Plex sign-in for that user and ties their Plex identity (username and avatar) to their Streamarr profile.

## Overview

There are two places to manage linked accounts:

| Location                                                 | Who it is for                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| **Profile → Settings → Linked Accounts**                 | Manage the accounts linked to **your own** user   |
| **Users → (select a user) → Settings → Linked Accounts** | Admins viewing **another** user's linked accounts |

{% hint style="info" %}
Today the only supported linked account type is **Plex**. Additional providers may be added in future releases.
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

## Admin View

Administrators with the **Manage Users** permission can open any user's **Linked Accounts** page to see which external accounts that user has connected.

{% hint style="info" %}
The admin view is **read-only**. Linking and unlinking can only be performed by the account owner from their own profile settings—an admin cannot link or unlink on a user's behalf.
{% endhint %}

If you try to view another user's linked accounts without the **Manage Users** permission, Streamarr displays a permission error.

---

## API Reference

| Endpoint                                          | Method | Description                                                                                                                  |
| ------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/user/{id}/settings/linked-accounts/plex` | POST   | Link a Plex account (provide a `pinId` from the server-side Plex pin exchange; a raw `authToken` is accepted but deprecated) |
| `/api/v1/user/{id}/settings/linked-accounts/plex` | DELETE | Unlink the user's Plex account                                                                                               |

These endpoints act on the authenticated user's own account. Viewing another user's account information requires the **Manage Users** permission.
