# Bookmark

The **Bookmark** page embeds [Shelfmark](https://github.com/calibrain/shelfmark) in Streamarr for searching and requesting books and audiobooks. Streamarr uses Shelfmark's proxy authentication, so users do not need a separate password.

## Requirements

- A running Shelfmark server reachable from Streamarr.
- Shelfmark configured with the same base path as Streamarr's **URL Base** setting.
- Shelfmark configured to trust Streamarr's proxy headers.

Set these Shelfmark environment variables before enabling the integration:

```text
ROUTER_BASE_PATH=/shelfmark
AUTH_METHOD=proxy
PROXY_AUTH_USER_HEADER=X-Auth-User
PROXY_AUTH_ADMIN_GROUP_HEADER=X-Auth-Groups
PROXY_AUTH_ADMIN_GROUP_NAME=streamarr-admin
```

Replace `/shelfmark` with the URL Base configured in Streamarr. Restart Shelfmark after changing its environment.

{% hint style="danger" %}
Do not expose Shelfmark directly when proxy authentication is enabled. It trusts the identity headers Streamarr sends, so it must be reachable only through Streamarr or another trusted proxy that removes client-supplied authentication headers.
{% endhint %}

## Configuration

Go to **Admin → Settings → Services → Shelfmark**.

| Setting                    | Description                                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enable**                 | Turns the integration on and registers the Shelfmark proxy route.                                                                                                                  |
| **Hostname or IP Address** | Where Shelfmark is reachable from the Streamarr server.                                                                                                                            |
| **Port**                   | Shelfmark's port. Defaults to `13378`.                                                                                                                                             |
| **Use SSL**                | Connect to Shelfmark over HTTPS.                                                                                                                                                   |
| **URL Base**               | The path Streamarr serves Shelfmark under, for example `/shelfmark`. It must match `ROUTER_BASE_PATH`, start with `/`, and have no trailing slash. Changing it requires a restart. |
| **Enable New User Signin** | Allows eligible users to create and manage their own Shelfmark account. When disabled, a user manager must link accounts.                                                          |

Use **Test** to verify the Shelfmark health endpoint before saving. The [System](settings/system.md) health dashboard reports Shelfmark's release version.

## Access And Accounts

The Bookmark page requires either the **Bookmark** permission or the **Reader** permission. Give users access under **Users → (select a user) → Permissions → Reader** or **Bookmark**.

Streamarr identifies Shelfmark users with the first available value in this order:

1. Streamarr username
2. Plex username
3. The part of the email address before `@`

When **Enable New User Signin** is enabled, visiting Bookmark automatically creates a Shelfmark account when one does not already exist. Streamarr also synchronizes the user's email address and display name when it links or creates the account. Self-service linking can only adopt an existing Shelfmark account when its email address matches the Streamarr user; otherwise, a user manager must link it.

When it is disabled, an unlinked user sees an account-required message instead of Shelfmark. A user with **Manage Users** can link an existing Shelfmark account or create a new one from that user's **Linked Accounts** page.

Unlinking removes the Streamarr association only. It does not delete the Shelfmark user, requests, downloads, or preferences.

{% hint style="info" %}
Only Streamarr users with the **Admin** permission become Shelfmark administrators. Users with **Manage Users** can manage Streamarr account links but remain standard Shelfmark users.
{% endhint %}
