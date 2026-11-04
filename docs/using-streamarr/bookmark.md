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

### Default User Settings

**New User Settings** sets the initial Ebook and Audiobook policies for new accounts, using Shelfmark's modes: **Download**, **Request Release**, **Request Book**, or **Blocked**. Selecting **Default** inherits Shelfmark's native policy. Other policies and per-source rules are managed by administrators in Shelfmark.

Streamarr applies only explicitly configured values, once during new-account initialization. Existing Shelfmark accounts keep their settings when linked, and changing the template does not update previously created accounts. Administrator roles continue to follow Streamarr's Admin permission. Changing these defaults does not require restarting Streamarr. This integration targets Shelfmark 1.6.1.

If initialization fails, Streamarr shows an error and does not save the account link. Shelfmark's proxy-auth API does not report whether authentication created or adopted an account, so Streamarr does not automatically delete an account after a failure. An administrator must verify the account and its permissions in Shelfmark before retrying. Streamarr does not store provisioning state or automatically recognize incomplete accounts on later attempts.

### Global Request Settings

**Enable Requests**, **Allow Notes on Requests**, and **Max Pending Requests Per User** update Shelfmark's global settings, not individual users. The toggles and limit show values read from the saved Shelfmark connection. Saving sends only values changed from the form's initial state; toggling back to the initial value makes no global update. Environment-managed fields cannot be edited here; explicit user overrides in Shelfmark may take precedence over global settings.

When requests are disabled, policy defaults, notes, and the limit are hidden. Hidden notes and limit values are not submitted or validated, so they cannot prevent disabling requests.

Use the existing **Save Changes** button for both sections. Streamarr saves its connection and new-user defaults first, then updates only the selected global request settings directly in Shelfmark. If the remote update cannot be confirmed, an error explains that Streamarr settings were saved but the global update was not confirmed. Global values are not stored in Streamarr's settings file.

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
