# Books

The **Books** page embeds [Calibre-Web](https://github.com/janeczku/calibre-web) (or its forks, [Calibre-Web Automated](https://github.com/crocodilestick/Calibre-Web-Automated) and AutoCaliWeb) in Streamarr, so users can browse your ebook library and read directly in-browser.

## Requirements

- A running Calibre-Web, Calibre-Web Automated (CWA), or AutoCaliWeb server reachable from Streamarr.

Calibre-Web has no API to create or verify user accounts, so linking only associates a username - the account itself must already exist, or be auto-created by Calibre-Web Automated's **Reverse Proxy Auto-Create Users** option.

To enable single sign-on, in Calibre-Web's **Basic Configuration**:

1. Turn on **Allow Reverse Proxy Header Login**.
2. Add Streamarr's server to **Reverse Proxy Trusted IPs**.
3. Set **Reverse Proxy Header Name** to match the header name configured in Streamarr (default `X-Auth-User`).
4. Optionally, on Calibre-Web Automated, turn on **Reverse Proxy Auto-Create Users** so linking creates the account automatically.

{% hint style="info" %}
Streamarr also sends the user's real email via an `X-Remote-Email` header, so accounts CWA auto-creates use it instead of a placeholder like `username@localhost`.
{% endhint %}

{% hint style="warning" %}
Auto-created accounts always get Calibre-Web's site-wide default role. Streamarr admins are **not** automatically made admins in Calibre-Web - promote them manually from Calibre-Web's **Edit User** page.
{% endhint %}

{% hint style="danger" %}
Do not expose Calibre-Web directly when reverse proxy header login is enabled. It trusts the identity header Streamarr sends, so it must be reachable only through Streamarr or another trusted proxy that removes client-supplied authentication headers.
{% endhint %}

## Configuration

Go to **Admin → Settings → Services → Calibre-Web**.

| Setting                              | Description                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enable**                           | Turns the integration on and registers the Calibre-Web proxy route.                                                                             |
| **Hostname or IP Address**           | Where Calibre-Web is reachable from the Streamarr server.                                                                                       |
| **Port**                             | Calibre-Web's port. Defaults to `8083`.                                                                                                         |
| **Use SSL**                          | Connect to Calibre-Web over HTTPS.                                                                                                              |
| **URL Base**                         | The path Streamarr serves Calibre-Web under, for example `/calibreweb`. Must start with `/`, no trailing slash. Changing it requires a restart. |
| **Enable New User Signin**           | Allows eligible users to link (or auto-create) their own Calibre-Web account. When disabled, a user manager must link accounts.                 |
| **Enable Reverse Proxy Header Auth** | Sends the linked username header on every request so Calibre-Web signs the user in automatically.                                               |
| **Reverse Proxy Header Name**        | The header name Streamarr sends the username in. Must match Calibre-Web's own **Reverse Proxy Header Name** setting.                            |

Use **Test** to verify Calibre-Web responds before saving. The [System](settings/system.md) health dashboard reports its reachability.

## Access And Accounts

The Books page requires either the **Ebooks** or the **Reader** permission. Give users access under **Users → (select a user) → Permissions → Reader** or **Ebooks**.

Streamarr identifies Calibre-Web users with the first available value in this order:

1. Streamarr username
2. Plex username
3. The part of the email address before `@`

Because Calibre-Web has no API to verify accounts, Streamarr also guarantees a Calibre-Web username can only ever be linked to one Streamarr user at a time - a user manager must reassign it if it is already linked elsewhere.

When **Enable New User Signin** is enabled, visiting the Books page prompts the user to link their account. When it is disabled, an unlinked user sees an account-required message instead, and a user with **Manage Users** must link the account from that user's **Linked Accounts** page.

Unlinking removes the Streamarr association only. It does not delete the Calibre-Web account or its data.

## Reading

Books opened in the reader (`/read/read/<id>/<format>`) fill the full browser window without Streamarr's header or sidebar. Browsing the catalog keeps the normal Streamarr layout.

## Theming

Streamarr injects a [theme-park.dev](https://theme-park.dev/) stylesheet to match Calibre-Web's colors to your Streamarr theme, the same way it does for Activity (Tautulli) and Requests (Seerr).

{% hint style="warning" %}
Calibre-Web sends a Content-Security-Policy header built from its **Trusted Hosts** setting (Admin → Basic Configuration). Add `theme-park.dev` there, or the browser will block the imported stylesheet.
{% endhint %}
