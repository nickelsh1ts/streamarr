# Admin Panel

The Admin Panel provides centralized management for your Streamarr instance, including settings, users, and integrated services.

## Overview

Access the Admin Panel by clicking the **Admin** button in the sidebar or navigation menu.

{% hint style="info" %}
The Admin Panel requires the **Admin** or **Manage Users** permission. Users without these permissions will not see the Admin option.
{% endhint %}

---

## Panel Sections

The Admin Panel includes multiple sections, organized as tabs:

### Settings

Primary configuration for your Streamarr instance:

- **General** — Application title, URL, security settings
- **Users** — Default permissions, sign-in options, trial periods
- **Plex** — Server connection and library management
- **Services** — \*Arr integrations, download clients, Tautulli
- **Notifications** — Email, Web Push, In-App notification setup
- **Onboarding** — Welcome modal and tutorial configuration
- **Jobs & Cache** — Scheduled tasks and cache management
- **Logs** — Application log viewer
- **About** — Version information and update status

See [Settings](settings/README.md) for detailed documentation.

### Users

Manage Streamarr users:

- View all registered users
- Edit user permissions and quotas
- Create local users
- Import users from Plex
- Delete users

See [Users](users/README.md) for detailed documentation.

### Service Management Tabs

When \*Arr services are configured, additional tabs appear for direct management:

| Tab            | Service   | Description                      |
| -------------- | --------- | -------------------------------- |
| **Movies**     | Radarr    | Manage movie library and imports |
| **TV Shows**   | Sonarr    | Manage TV series and episodes    |
| **Music**      | Lidarr    | Manage music library             |
| **Indexers**   | Prowlarr  | Manage indexer configuration     |
| **Subtitles**  | Bazarr    | Manage subtitle downloads        |
| **Transcodes** | Tdarr     | Manage transcoding jobs          |
| **Downloads**  | Downloads | Manage torrent clients           |

{% hint style="info" %}
Service management tabs only appear when the corresponding service is configured and enabled in Settings.
{% endhint %}

---

## Service Embedding

The Admin Panel embeds configured \*Arr services directly within Streamarr:

### How It Works

1. Services are loaded via the internal proxy system
2. Full service UI is available without leaving Streamarr
3. Changes made in embedded services take effect immediately

### Supported Services

| Service      | URL Path           | Description                 |
| ------------ | ------------------ | --------------------------- |
| **Radarr**   | `/admin/movies`    | Movie management via Radarr |
| **Sonarr**   | `/admin/tv`        | TV management via Sonarr    |
| **Lidarr**   | `/admin/music`     | Music management via Lidarr |
| **Prowlarr** | `/admin/indexers`  | Indexer management          |
| **Bazarr**   | `/admin/srt`       | Subtitle management         |
| **Tdarr**    | `/admin/transcode` | Transcoding queue           |

### Configuration

Each service requires proper setup in Settings:

1. Navigate to **Settings → Services**
2. Configure the service's connection details
3. Set a **URL Base** for the internal proxy
4. Save and the tab will appear in the Admin Panel

---

## Settings Sections

### General Settings

Configure core application settings:

- Application title and URL
- Proxy and CSRF settings
- Image caching
- Custom logos and theming

### Plex Settings

Manage your Plex server connection:

- Server hostname/IP and port
- Library selection
- User import from Plex

### Service Settings

Configure \*Arr and other integrations:

- Radarr (multiple instances supported)
- Sonarr (multiple instances supported)
- Lidarr, Prowlarr, Bazarr, Tdarr, Overseerr
- Tautulli
- Download clients

### Notification Settings

Set up notification channels:

- Email (SMTP with optional PGP)
- Web Push (browser notifications)
- In-App (Socket.IO notifications)

### Jobs & Cache

Manage scheduled tasks:

- View and trigger scheduled jobs
- Flush various API caches
- Monitor job execution

### Logs

View application logs:

- Filter by log level
- Search log entries
- Real-time log streaming

### About

View system information:

- Current version
- Update availability
- GitHub links
- Support resources

---

## Permissions

| Permission       | Access Level                            |
| ---------------- | --------------------------------------- |
| **Admin**        | Full access to all Admin Panel features |
| **Manage Users** | Access to Settings and Users tabs only  |

Users with **Manage Users** permission can access user management but cannot modify system settings or services.

---

## Troubleshooting

### "Admin option not visible"

1. Verify you have **Admin** or **Manage Users** permission
2. Check that your session is still active
3. Try signing out and back in

### "Service tabs not appearing"

1. Verify the service is configured in Settings → Services
2. Ensure the service is enabled
3. Check that URL Base is set correctly
4. Refresh the page after saving settings

### "Embedded service not loading"

1. Check the service is running
2. Verify proxy settings are correct
3. Check browser console for errors
4. Ensure the service is accessible from Streamarr's server
