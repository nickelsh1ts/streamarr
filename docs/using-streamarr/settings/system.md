# System

The System page provides health monitoring, restart controls, disk space usage, version information, and release history for your Streamarr instance and every enabled service.

## Overview

Access the System page via **Settings → System** in the [Admin Panel](../admin.md). This page gives administrators a real-time view of server health and tools to manage the application lifecycle.

{% hint style="info" %}
The System page requires **Admin** permission.
{% endhint %}

---

## Health Monitoring

The System page displays a health card for the Streamarr server and for **every enabled and configured service**, giving administrators a real-time view of the whole stack.

### Streamarr Server

The main server process that handles the web interface, API, and all integrations.

| Status               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| **Healthy**          | Server is running normally                                    |
| **Restart Required** | Settings changes require a restart to take effect (see below) |
| **Unknown**          | Status could not be determined                                |

When the status shows **Restart Required**, a restart button is available directly on the health card.

### Service Health

Below the Streamarr card, a card is shown for each configured service — Plex, Radarr, Sonarr, Prowlarr, Lidarr, Bazarr, Tdarr, Cleanuparr, Tautulli, Seerr, and download clients. Only services that are **enabled and configured** appear; disabled services are hidden.

Each card shows a status badge and, where the service exposes it, the running **version**:

| Status        | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| **Healthy**   | The service responded successfully                                              |
| **Retrying**  | A transient failure occurred and Streamarr is retrying (Plex, download clients) |
| **Unhealthy** | The service could not be reached; the error is shown beneath its name           |
| **Unknown**   | Status has not yet been determined                                              |

- **Plex** reflects Streamarr's existing connection-health state, including its retry cooldown. The other services are actively probed when the page loads.
- **Version** is shown for services that report one (Plex, Radarr, Sonarr, Prowlarr, Lidarr, Bazarr, Tdarr, Tautulli, Seerr, and download clients). **Cleanuparr** does not expose a version, so its card shows how many services it is monitoring instead.
- Each card has a **Retry** button that re-checks that service immediately.

### Multi-instance Services

Radarr, Sonarr, and download clients can have multiple instances. These render as a **collapsible parent card** with an aggregated status (unhealthy if any instance is unhealthy) and an "{healthy} of {total} healthy" summary. Expand the card to see a row per instance, each with its own status, version, and Retry button.

{% hint style="info" %}
Service health is checked when the System page loads and revalidated when the browser tab regains focus. Use a card's **Retry** button to force an immediate re-check.
{% endhint %}

---

## Restart System

### When Is a Restart Required?

Streamarr tracks changes to settings that affect the internal proxy system and server configuration. When any of the following settings are modified, a restart is required for the changes to take effect:

| Setting Changed        | Displayed As    |
| ---------------------- | --------------- |
| Plex server IP         | Plex            |
| Radarr connection      | Radarr          |
| Sonarr connection      | Sonarr          |
| Lidarr connection      | Lidarr          |
| Prowlarr connection    | Prowlarr        |
| Bazarr connection      | Bazarr          |
| Tdarr hostname/enabled | Tdarr           |
| Tautulli hostname/URL  | Tautulli        |
| Seerr connection       | Seerr           |
| Proxy support toggle   | Proxy Support   |
| CSRF protection toggle | CSRF Protection |

For Radarr and Sonarr, changes to hostname, base URL, API key, or adding/removing instances all trigger a restart requirement.

### Restart Required Alert

When a restart is needed, a warning banner appears across admin settings pages:

> **Restart Required** — Changes to {service names} require a server restart to take effect.

The banner includes a **"Restart Now"** button with a confirmation prompt.

{% hint style="info" %}
Some pages show a filtered version of this alert. For example, the General Settings page only shows restart alerts for Proxy Support and CSRF Protection changes.
{% endhint %}

### How Restart Works

The restart behavior depends on your environment:

| Environment                 | Behavior                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **Development**             | Touches the server entry file to trigger a nodemon restart                               |
| **Docker (Production)**     | Exits the process (`process.exit(0)`); the container restart policy restarts the service |
| **Bare Metal (Production)** | Gracefully shuts down connections, then respawns the process automatically               |

During a production restart:

1. Socket.IO connections are disconnected
2. The HTTP server is closed (with a 3-second drain timeout)
3. The database connection is destroyed
4. **Docker**: The process exits — the container restart policy handles the rest
5. **Bare Metal**: Signal handlers are reset and a new server process is spawned

The UI shows a "Restarting..." indicator followed by "Reconnecting..." while it waits for the server to come back online (up to 45 seconds).

---

## Disk Space

The System page displays disk usage for your configuration directory and the filesystem it lives on, so you can keep an eye on available storage at a glance.

### What Is Shown

Disk usage is presented as an expandable, hierarchical list:

| Level              | Represents                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| **Mount point**    | The physical filesystem that holds your configuration directory (e.g. `/`)   |
| **App Data**       | Your Streamarr configuration directory (the volume mounted to `/app/config`) |
| **Subdirectories** | Each immediate subfolder of the configuration directory (logs, cache, etc.)  |

Each row shows **Free Space**, **Used Space**, **Total Space**, and a usage bar. Use the chevron to expand or collapse the App Data row and reveal its subdirectories.

### Usage Bar Colours

The usage bar changes colour as space fills up:

| Usage         | Colour           |
| ------------- | ---------------- |
| Below 75%     | Normal (primary) |
| 75% – 84.9%   | Warning (amber)  |
| 85% and above | Critical (red)   |

{% hint style="info" %}
Subdirectory rows show how much space each folder consumes within your configuration directory, while the mount point row reflects the entire underlying filesystem. This makes it easy to spot whether it is Streamarr's data—or the host disk overall—that is running low.
{% endhint %}

### Unavailable Metrics

If Streamarr cannot read one or more local paths (for example, due to permissions), a warning banner reads **"Some disk metrics are unavailable."** The paths that could be read are still shown; only the unreadable ones are omitted.

{% hint style="info" %}
Disk statistics are gathered using the system `df` utility, with an internal filesystem fallback when `df` is not available. Symbolic links are skipped when calculating folder sizes.
{% endhint %}

---

## About Streamarr

The System page displays key information about your installation:

| Field               | Description                                          |
| ------------------- | ---------------------------------------------------- |
| **Version**         | Current version with update status badge             |
| **Uptime**          | How long the current server process has been running |
| **Total Users**     | Number of registered users                           |
| **Total Invites**   | Number of invites created                            |
| **Data Directory**  | Path to the configuration directory                  |
| **Time Zone**       | Server timezone (if configured via `TZ` environment) |
| **Node.js Version** | Node.js runtime version the server is running on     |
| **Database**        | Database type and version (e.g. SQLite/PostgreSQL)   |

### Update Status

The version field shows a badge indicating:

- **Up to date** — You are running the latest version
- **Out of date** — A newer version is available

### Getting Support

Quick links to:

- [Documentation](https://docs.streamarr.dev)
- [GitHub Discussions](https://github.com/nickelsh1ts/streamarr/discussions)

### Support Streamarr

Links to support the project:

- GitHub Sponsors (preferred)
- Patreon

---

## Releases

The Releases section displays the changelog from GitHub releases, showing:

- Release version and date
- Release notes and changes
- Highlights for the version you are currently running

This helps you see what has changed between versions and what is included in available updates.

---

## API Reference

| Endpoint                            | Method | Description                                                                                       |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `/api/v1/settings/restart-required` | GET    | Check if a restart is required                                                                    |
| `/api/v1/settings/restart`          | POST   | Trigger a server restart                                                                          |
| `/api/v1/settings/health`           | GET    | Health of all enabled and configured services (Admin only)                                        |
| `/api/v1/settings/health/retry`     | POST   | Reset and re-check a single service by id, then recompute all (Admin only)                        |
| `/api/v1/plex/health`               | GET    | Get current Plex connection health state (authenticated users)                                    |
| `/api/v1/plex/health/retry`         | POST   | Reset Plex health and trigger an immediate retry (Admin only)                                     |
| `/api/v1/status`                    | GET    | Get version, update availability                                                                  |
| `/api/v1/settings/about`            | GET    | Get version, uptime, user/invite counts, data path, Node/Python/database versions, and disk space |

### Restart Status Response

```json
{
  "required": true,
  "services": ["Radarr", "Proxy Support"]
}
```

### Python Service Status Response

```json
{
  "status": "healthy",
  "lastChecked": "2026-02-19T12:00:00.000Z",
  "lastHealthy": "2026-02-19T12:00:00.000Z",
  "consecutiveFailures": 0
}
```

### About Response (excerpt)

```json
{
  "version": "1.4.0",
  "uptime": 86400,
  "totalUsers": 42,
  "totalInvites": 17,
  "tz": "America/New_York",
  "appDataPath": "/app/config",
  "nodeVersion": "v24.0.0",
  "database": { "type": "sqlite", "version": "3.45.0" },
  "diskSpace": {
    "items": [
      {
        "deviceId": "/dev/sda1",
        "name": "App Data",
        "path": "/app/config",
        "mountPoint": "/",
        "pathUsedBytes": 524288000,
        "totalBytes": 107374182400,
        "freeBytes": 96636764160,
        "usedBytes": 10737418240,
        "usedPercent": 10.0
      }
    ],
    "failedPaths": []
  }
}
```

### Service Health Response

```json
{
  "services": [
    {
      "id": "plex",
      "name": "Plex",
      "status": "healthy",
      "version": "1.41.0.8994",
      "retryable": true
    },
    {
      "id": "radarr",
      "name": "Radarr",
      "status": "healthy",
      "retryable": true,
      "instances": [
        {
          "id": "radarr-1",
          "name": "Radarr 4K",
          "status": "healthy",
          "version": "5.16.3.9541"
        }
      ]
    },
    {
      "id": "cleanuparr",
      "name": "Cleanuparr",
      "status": "healthy",
      "detail": "Monitoring 3 services",
      "retryable": true
    }
  ]
}
```

`status` is one of `"healthy"`, `"retrying"`, `"unhealthy"`, or `"unknown"`. Multi-instance services (Radarr, Sonarr, download clients) include an `instances` array; the parent `status` is the aggregate. The retry endpoint takes a service or instance id in the body, e.g. `{ "id": "radarr-1" }`.

### Plex Health Response

```json
{
  "status": "unhealthy",
  "lastSuccess": "2026-02-19T11:55:00.000Z",
  "lastFailure": "2026-02-19T12:00:00.000Z",
  "lastError": "Connection refused",
  "cooldownUntil": "2026-02-19T12:05:00.000Z",
  "consecutiveFailures": 2
}
```

`status` is one of `"healthy"`, `"retrying"`, or `"unhealthy"`. See [Plex Connection Health](README.md#plex-connection-health) for the full state machine description.

---

## Troubleshooting

### "Restart not completing"

1. Check Docker container logs: `docker logs streamarr`
2. Verify your container has a restart policy (`--restart unless-stopped`)
3. If running bare metal, check that the process has permission to spawn child processes
4. Try restarting the container manually: `docker restart streamarr`

### "Health status shows Unknown"

1. The server may still be initializing — wait a few seconds
2. Check the application logs for errors during startup
3. Verify the database is accessible and not corrupted

### "A service card shows Unhealthy"

1. Confirm the service is enabled and reachable at its configured hostname and port
2. Check that any required API key is correct, and that the service's API base path matches what you configured
3. The error message shown beneath the service name usually indicates the cause (for example a connection refusal or an HTTP status code)
4. Correct the configuration in **Settings → Services**, then use the card's **Retry** button to re-check

### "Some disk metrics are unavailable"

1. Confirm the configuration directory and its subfolders are readable by the user running Streamarr
2. If running in Docker, verify the `/app/config` volume is mounted correctly
3. Check the application logs for `Failed to collect disk usage stats` warnings to identify the affected path

### "Restart required but I haven't changed anything"

This can occur if settings were modified directly in the `settings.json` file while the server was running. The restart manager compares current settings against the snapshot taken at boot time.
