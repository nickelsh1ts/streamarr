# Stats

The Stats page embeds Tautulli to provide detailed Plex server statistics and activity monitoring.

## Overview

Tautulli integration provides:

- Real-time watch activity
- Playback history and statistics
- Library analytics
- User activity tracking

Access Stats by clicking **Stats** in the navigation menu (requires Tautulli configuration).

---

## Features

### Activity Monitoring

View real-time activity on your Plex server:

- Currently playing content
- Active streams and users
- Transcoding status
- Bandwidth usage

### History & Statistics

Browse detailed playback history:

- Watch history by user
- Most popular content
- Play counts and duration
- Trends over time

### Library Analytics

Analyze your media libraries:

- Library size and growth
- Content breakdown by type
- Storage statistics
- Recently added content

---

## Configuration

Tautulli must be configured in Settings before the Stats page becomes available.

### Setup

1. Navigate to **Settings → Services → Tautulli**
2. Configure connection settings:

| Setting            | Description                                    |
| ------------------ | ---------------------------------------------- |
| **Hostname or IP** | Address of your Tautulli server                |
| **Port**           | Default is `8181`                              |
| **Use SSL**        | Enable for HTTPS connections                   |
| **API Key**        | Found in Tautulli → Settings → Web Interface   |
| **URL Base**       | Base path for the proxy (default: `/tautulli`) |

3. Click **Test** to verify connection
4. Click **Save**

### User Access

Users see the Stats navigation item when Tautulli is configured. Access is controlled through the internal proxy system.

---

## Internal Proxy

Tautulli is accessed through Streamarr's internal proxy:

- URL path: `/stats` → proxies to Tautulli
- Authentication handled by Streamarr session
- No need to expose Tautulli directly to users

---

## Troubleshooting

### "Stats not appearing in navigation"

1. Verify Tautulli is configured in Settings → Services → Tautulli
2. Check that the service is enabled
3. Ensure you have the required permissions

### "Unable to connect to Tautulli"

1. Verify Tautulli is running
2. Check hostname and port are correct
3. Verify API key is valid
4. Test network connectivity

### "Page loads but shows errors"

1. Ensure URL Base is configured correctly
2. Check Tautulli logs for errors
3. Verify Tautulli can reach your Plex server
