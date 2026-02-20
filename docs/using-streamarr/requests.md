# Requests

The Requests page embeds Overseerr to enable users to request new content for your Plex server.

## Overview

Overseerr integration provides:

- Content discovery and search
- Request submission for movies and TV shows
- Request status tracking
- Integration with Radarr and Sonarr for automated fulfillment

Access Requests by clicking **Request** in the navigation menu (requires Overseerr configuration).

---

## Features

### Content Discovery

Browse and search for content:

- Popular and trending movies/TV shows
- Search by title, genre, or keywords
- View detailed information (ratings, cast, synopsis)

### Request Submission

Request content to be added to your media server:

- One-click request for movies
- Season/episode selection for TV shows
- Quality profile selection (if configured)

### Request Tracking

Monitor the status of your requests:

- Pending approval
- Processing (downloading)
- Available (added to Plex)
- Declined

---

## Configuration

Overseerr must be configured in Settings before the Requests page becomes available.

### Setup

1. Navigate to **Settings → Services → Overseerr**
2. Configure connection settings:

| Setting            | Description                                     |
| ------------------ | ----------------------------------------------- |
| **Hostname or IP** | Address of your Overseerr server                |
| **Port**           | Default is `5055`                               |
| **Use SSL**        | Enable for HTTPS connections                    |
| **API Key**        | Found in Overseerr → Settings → General         |
| **URL Base**       | Base path for the proxy (default: `/overseerr`) |

3. Click **Test** to verify connection
4. Click **Save**

### Permissions

Users need the **Request** permission to access the Requests page:

- **Request** — Access to browse and submit requests

Configure default permissions in **Settings → Users → Default Permissions**.

---

## Internal Proxy

Overseerr is accessed through Streamarr's internal proxy:

- URL path: Configured via `URL Base` setting
- Authentication can be handled through Streamarr
- Theme colors are synced with Streamarr

---

## Usage Guide

### Searching for Content

1. Navigate to the **Request** page
2. Use the search bar to find content
3. Click on a result to view details

### Requesting a Movie

1. Find the movie you want
2. Click **Request**
3. Select options (if available)
4. Confirm the request

### Requesting a TV Show

1. Find the TV show you want
2. Click **Request**
3. Choose:
   - **All Seasons** — Request the complete series
   - **Specific Seasons** — Select which seasons to request
4. Confirm the request

### Checking Request Status

1. View your requests in Overseerr's interface
2. Filter by status (pending, available, etc.)
3. Admins can approve or decline requests

---

## Troubleshooting

### "Request not appearing in navigation"

1. Verify Overseerr is configured in Settings → Services → Overseerr
2. Check that the service is enabled
3. Ensure you have the **Request** permission

### "Unable to connect to Overseerr"

1. Verify Overseerr is running
2. Check hostname and port are correct
3. Verify API key is valid
4. Test network connectivity

### "Login issues"

1. Overseerr may require its own authentication
2. Configure Overseerr to trust Streamarr's proxy headers
3. Alternatively, sign in with Plex in Overseerr

### "Requests not being fulfilled"

1. Check Overseerr's connection to Radarr/Sonarr
2. Verify download clients are configured in Overseerr
3. Check available disk space
