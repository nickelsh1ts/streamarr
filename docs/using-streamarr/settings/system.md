# System

The System page provides health monitoring, restart controls, version information, and release history for your Streamarr instance.

## Overview

Access the System page via **Settings → System** in the [Admin Panel](../admin.md). This page gives administrators a real-time view of server health and tools to manage the application lifecycle.

{% hint style="info" %}
The System page requires **Admin** permission.
{% endhint %}

---

## Health Monitoring

The System page displays health cards for each core service:

### Streamarr Server

The main server process that handles the web interface, API, and all integrations.

| Status               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| **Healthy**          | Server is running normally                                    |
| **Restart Required** | Settings changes require a restart to take effect (see below) |
| **Unknown**          | Status could not be determined                                |

When the status shows **Restart Required**, a restart button is available directly on the health card.

### Plex Sync Service

The Python microservice that handles Plex invites and library synchronization. This service runs on port 5005 internally and is managed automatically by Streamarr.

| Status        | Description                                                |
| ------------- | ---------------------------------------------------------- |
| **Healthy**   | Service is running and responding to health checks         |
| **Unhealthy** | Service is unreachable (after 2 consecutive failed checks) |
| **Unknown**   | Service status has not been determined yet                 |

**Health polling**: Streamarr checks the Plex Sync service every 30 seconds. If the service fails to respond within 3 seconds for 2 consecutive checks, it is marked as unhealthy.

When the service is unhealthy, a restart button is available on the health card. You will also see a **"Plex Sync Service Down"** alert banner on the **Plex Settings** and **User Settings General** pages.

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
5. **Bare Metal**: The Plex Sync service is preserved (kept running across the restart), signal handlers are reset, and a new server process is spawned

The UI shows a "Restarting..." indicator followed by "Reconnecting..." while it waits for the server to come back online (up to 45 seconds).

### Plex Sync Service Restart

The Plex Sync (Python) service can be restarted independently from the main server:

- Click the restart button on the Plex Sync Service health card
- Or click **"Restart Service"** on the alert banner when the service is down

The service restart process:

1. Existing Python processes are terminated gracefully (SIGTERM, then SIGKILL after 5 seconds)
2. The system waits for port 5005 to become available (up to 10 seconds)
3. A new instance is spawned (Gunicorn in production, Flask directly in development)
4. Health polling confirms the service is back online

---

## About Streamarr

The System page displays key information about your installation:

| Field              | Description                                          |
| ------------------ | ---------------------------------------------------- |
| **Version**        | Current version with update status badge             |
| **Total Users**    | Number of registered users                           |
| **Total Invites**  | Number of invites created                            |
| **Data Directory** | Path to the configuration directory                  |
| **Time Zone**      | Server timezone (if configured via `TZ` environment) |

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

| Endpoint                            | Method | Description                                |
| ----------------------------------- | ------ | ------------------------------------------ |
| `/api/v1/settings/restart-required` | GET    | Check if a restart is required             |
| `/api/v1/settings/restart`          | POST   | Trigger a server restart                   |
| `/api/v1/settings/python/status`    | GET    | Get Plex Sync service health status        |
| `/api/v1/settings/python/restart`   | POST   | Restart the Plex Sync service              |
| `/api/v1/status`                    | GET    | Get version, update availability           |
| `/api/v1/settings/about`            | GET    | Get version, user/invite counts, data path |

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

---

## Troubleshooting

### "Restart not completing"

1. Check Docker container logs: `docker logs streamarr`
2. Verify your container has a restart policy (`--restart unless-stopped`)
3. If running bare metal, check that the process has permission to spawn child processes
4. Try restarting the container manually: `docker restart streamarr`

### "Plex Sync Service won't start"

1. Check that Python 3 is installed and accessible
2. Verify port 5005 is not in use by another process
3. Check logs in `config/logs/` for Python service errors
4. Ensure the `server/python/plex_invite.py` file exists and is not corrupted
5. Try restarting the entire Streamarr container

### "Health status shows Unknown"

1. The server may still be initializing — wait a few seconds
2. Check the application logs for errors during startup
3. Verify the database is accessible and not corrupted

### "Restart required but I haven't changed anything"

This can occur if settings were modified directly in the `settings.json` file while the server was running. The restart manager compares current settings against the snapshot taken at boot time.
