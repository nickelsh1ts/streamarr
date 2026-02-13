# Settings

Settings are accessible to administrators via the gear icon in the navigation menu. This page covers all configuration options available in Streamarr.

## General

### API Key

This is your Streamarr API key, which can be used to integrate Streamarr with third-party applications.

{% hint style="danger" %}
Do **not** share this key publicly, as it can be used to gain administrator access!
{% endhint %}

If you need to generate a new API key for any reason, click the regenerate button next to the text box.

### Application Title

Customize the application title displayed in the browser tab and throughout the UI. Default is "Streamarr".

### Application URL

Set this to the externally-accessible URL of your Streamarr instance (e.g., `https://streamarr.example.com`).

You must configure this setting to enable:

- Password reset emails
- Correct links in email notifications
- QR codes for invites

### Enable Proxy Support

If you have Streamarr behind a [reverse proxy](../../extending-streamarr/reverse-proxy.md), enable this setting to allow Streamarr to correctly register client IP addresses.

For details, please see the [Express documentation](http://expressjs.com/en/guide/behind-proxies.html).

This setting is **disabled** by default.

### Enable CSRF Protection

{% hint style="danger" %}
**This is an advanced setting.** We do not recommend enabling it unless you understand the implications of doing so.
{% endhint %}

CSRF stands for [cross-site request forgery](https://en.wikipedia.org/wiki/Cross-site_request_forgery). When this setting is enabled, all external API access that alters Streamarr application data is blocked.

If you do not use Streamarr integrations with third-party applications to modify data, you can enable this setting for additional security.

{% hint style="warning" %}
**HTTPS is required** when CSRF protection is enabled. You will no longer be able to access Streamarr over HTTP.

If you enable this setting and find yourself unable to access Streamarr, you can disable it by editing `settings.json` in your config directory.
{% endhint %}

This setting is **disabled** by default.

### Enable Image Caching

When enabled, Streamarr will proxy and cache images from external sources (such as TMDB). This can use a significant amount of disk space.

Images are saved in `config/cache/images/` and stale images are cleared every 24 hours.

Enable this if you are having issues loading images directly from TMDB in your browser.

This setting is **disabled** by default.

### Display Language

Set the default display language for Streamarr. Users can override this in their individual settings.

### Custom Logo

Upload a custom logo to replace the default Streamarr branding. Both full and small (icon) variants can be customized.

### Theme

Customize the application colors to match your brand. All DaisyUI theme colors can be configured:

- **Primary** — Main accent color
- **Secondary** — Secondary accent color
- **Accent** — Highlight color
- **Neutral** — Neutral/gray tones
- **Base** — Background colors (100, 200, 300 variants)
- **Info/Success/Warning/Error** — Status colors

<!-- TODO: Add screenshot of theme editor -->

---

## Users

### Enable Local Sign-In

When enabled, users who have configured passwords can sign in using their email address instead of Plex OAuth.

When disabled, Plex OAuth becomes the only sign-in option, and any "local users" you have created will not be able to sign in.

This setting is **enabled** by default.

### Enable New Plex Sign-In

When enabled, users with access to your Plex server can sign in to Streamarr even if they have not been explicitly imported.

Users will be automatically assigned the permissions configured in [Default Permissions](#default-permissions) upon first sign-in.

This setting is **enabled** by default.

### Enable Sign Up

When enabled, users can sign up for an account using an [invite code](../invites/README.md).

This setting is **disabled** by default.

### Default Permissions

Select the permissions assigned to new users by default upon account creation.

See [Users](../users/README.md#permissions) for a full list of available permissions.

### Default Invite Quotas

Configure the default invite quota settings for new users:

- **Quota Limit** — Maximum number of invites a user can create
- **Quota Days** — Time period (in days) for the quota to reset

---

## Trial Period

### Enable Trial Period

When enabled, newly signed-up users are placed in a trial period where certain features are restricted (such as creating invites).

This setting is **disabled** by default.

### Trial Period Days

The number of days a new user remains in trial status. Default is 30 days.

---

## Plex

### Plex Settings

{% hint style="info" %}
To set up Plex, you can either enter your details manually or select a server retrieved from [plex.tv](https://plex.tv/). Click the button to retrieve available servers.

Depending on your setup, you may need to enter your Plex server details manually.
{% endhint %}

#### Hostname or IP Address

The hostname or IP address of your Plex server. If Streamarr is on the same network as Plex, you can use the local IP address.

#### Port

The port your Plex server listens on. Default is `32400`.

#### Use SSL

Enable this to connect to Plex via HTTPS. Note that self-signed certificates are not supported.

### Plex Libraries

Select which libraries Streamarr should have access to. These libraries will be:

- Available for sharing with invited users
- Synced for media counts
- Available in the internal Plex proxy

### Shared Libraries (Default)

Configure which libraries are shared with users by default. Options:

- **All Libraries** — Share all enabled libraries
- **Specific Libraries** — Select specific library IDs (comma-separated)

Individual user settings can override this default.

---

## Services

Streamarr integrates with various \*Arr services to provide a unified dashboard.

### Radarr

Connect one or more Radarr instances for movie management and calendar integration.

For each server, configure:

| Setting              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| **Server Name**      | Friendly name for the server                         |
| **Hostname or IP**   | Address of your Radarr server                        |
| **Port**             | Default is `7878`                                    |
| **API Key**          | Found in Radarr → Settings → General → Security      |
| **Use SSL**          | Enable for HTTPS connections                         |
| **Base URL**         | URL path for internal proxy access (e.g., `/radarr`) |
| **External URL**     | External URL for links (if different from internal)  |
| **Default**          | Mark one server as default                           |
| **4K Server**        | Mark if this server is for 4K content                |
| **Enable Sync**      | Enable calendar sync                                 |
| **Past/Future Days** | Days to sync for calendar                            |

### Sonarr

Connect one or more Sonarr instances for TV series management and calendar integration.

Configuration options are the same as Radarr, with the default port being `8989`.

### Other Services

#### Bazarr

Connect Bazarr for subtitle management.

| Setting            | Description                          |
| ------------------ | ------------------------------------ |
| **Hostname or IP** | Address of your Bazarr server        |
| **Port**           | Default is `6767`                    |
| **API Key**        | Found in Bazarr → Settings → General |
| **URL Base**       | Default is `/bazarr`                 |

#### Prowlarr

Connect Prowlarr for indexer management.

| Setting            | Description                            |
| ------------------ | -------------------------------------- |
| **Hostname or IP** | Address of your Prowlarr server        |
| **Port**           | Default is `9696`                      |
| **API Key**        | Found in Prowlarr → Settings → General |
| **URL Base**       | Default is `/prowlarr`                 |

#### Lidarr

Connect Lidarr for music management.

| Setting            | Description                          |
| ------------------ | ------------------------------------ |
| **Hostname or IP** | Address of your Lidarr server        |
| **Port**           | Default is `8686`                    |
| **API Key**        | Found in Lidarr → Settings → General |
| **URL Base**       | Default is `/lidarr`                 |

#### Overseerr

Connect Overseerr for request management.

| Setting            | Description                             |
| ------------------ | --------------------------------------- |
| **Hostname or IP** | Address of your Overseerr server        |
| **Port**           | Default is `5055`                       |
| **API Key**        | Found in Overseerr → Settings → General |
| **URL Base**       | Default is `/overseerr`                 |

#### Tdarr

Connect Tdarr for transcoding management.

| Setting            | Description                  |
| ------------------ | ---------------------------- |
| **Hostname or IP** | Address of your Tdarr server |
| **Port**           | Default is `8265`            |

#### Tautulli

Connect Tautulli for Plex statistics.

| Setting            | Description                                  |
| ------------------ | -------------------------------------------- |
| **Hostname or IP** | Address of your Tautulli server              |
| **Port**           | Default is `8181`                            |
| **API Key**        | Found in Tautulli → Settings → Web Interface |
| **URL Base**       | Default is `/tautulli`                       |

#### Uptime Kuma

Connect Uptime Kuma for status page integration.

| Setting          | Description                    |
| ---------------- | ------------------------------ |
| **External URL** | Public URL to your status page |

---

## Downloads

Configure download clients for torrent management. Supported clients:

- **qBittorrent**
- **Deluge**
- **Transmission**

For each client:

| Setting               | Description                          |
| --------------------- | ------------------------------------ |
| **Client Name**       | Friendly name                        |
| **Client Type**       | qBittorrent, Deluge, or Transmission |
| **Hostname or IP**    | Address of the client                |
| **Port**              | Client web UI port                   |
| **Use SSL**           | Enable for HTTPS                     |
| **Username/Password** | Credentials for authentication       |
| **External URL**      | External URL for direct access       |

See [Downloads](../downloads/README.md) for usage details.

---

## Notifications

Configure notification agents. See [Notifications](../notifications/README.md) for detailed setup instructions for each agent.

---

## Jobs & Cache

Streamarr performs maintenance tasks as scheduled jobs. You can also manually trigger them here.

### Scheduled Jobs

| Job                        | Default Schedule | Description                             |
| -------------------------- | ---------------- | --------------------------------------- |
| **Plex Full Library Scan** | Daily at 3:00 AM | Full sync of Plex library metadata      |
| **Plex Token Refresh**     | Daily at 5:00 AM | Refresh admin Plex token                |
| **Image Cache Cleanup**    | Daily at 5:00 AM | Clean stale cached images               |
| **Invite & QR Cleanup**    | Daily at 1:00 AM | Mark expired invites and clean QR codes |
| **Notification Cleanup**   | Daily at 1:30 AM | Clean old notifications                 |

### Cache Management

Streamarr caches requests to external APIs. You can flush individual caches if needed:

| Cache        | Description                                   |
| ------------ | --------------------------------------------- |
| **TMDB**     | Movie/TV metadata from The Movie Database     |
| **Plex TV**  | Plex.tv API data                              |
| **PlexGUID** | Plex media GUID mappings                      |
| **Radarr**   | Radarr API responses (includes calendar data) |
| **Sonarr**   | Sonarr API responses (includes calendar data) |
| **Lidarr**   | Lidarr API responses                          |
| **Prowlarr** | Prowlarr API responses                        |
| **IMDB**     | IMDB data from Radarr proxy                   |
| **GitHub**   | GitHub API responses (for update checks)      |

{% hint style="info" %}
Flushing the Radarr or Sonarr cache will also clear cached calendar events, triggering a fresh fetch on the next calendar view.
{% endhint %}

<!-- TODO: Add screenshot of Jobs & Cache page -->
