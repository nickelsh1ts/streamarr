# Plex Web

Streamarr embeds Plex Web directly into the application, allowing users to browse and stream content without leaving the dashboard.

## Overview

The embedded Plex Web interface provides:

- Full Plex browsing experience within Streamarr
- Integrated sidebar and navigation
- Library filtering based on user permissions
- PWA-friendly viewing experience

Access Plex Web by clicking **Watch** in the navigation menu or selecting a library from the sidebar.

---

## Features

### Embedded Experience

Plex Web is loaded within an iframe that syncs with Streamarr:

- **URL Synchronization** — Browser URL updates as you navigate within Plex
- **Theme Integration** — Streamarr's theme colors are applied to the Plex interface
- **Sidebar Access** — The application sidebar remains accessible for quick navigation

### Library Access

Users only see libraries they have been granted access to:

- **Admin**: Full access to all enabled libraries
- **Users**: Access based on shared library settings (configured per-user or using server defaults)

### Deep Links

Direct links to specific content work seamlessly:

- `/watch/web/index.html#!/media/{machineId}/...` — Opens specific media
- Library pins from the sidebar link directly to Plex Web

---

## Navigation

### From the Sidebar

1. Click the **Library Menu** in the sidebar
2. Select a library to browse
3. Plex Web opens filtered to that library

### From Media Cards

When viewing media on the home page or elsewhere:

1. Click the **Play** button or media card
2. Opens directly in Plex Web at that content

### Direct URL Access

Navigate directly to Plex Web at `/watch`:

- `/watch` — Opens Plex Web home
- `/watch/web/index.html#!/media/...` — Opens specific content

---

## Player Features

When playing content in Plex Web:

- **Full-Screen Mode** — Supported with automatic sidebar hiding
- **Subtitles** — Configure via Plex's built-in subtitle controls
- **Quality** — Automatic or manual quality selection
- **Watch History** — Synced with your Plex account

---

## Mobile Experience

On mobile devices:

- **PWA Installation** — Install Streamarr as an app for native-like experience
- **Back Button** — Dedicated back navigation in PWA mode
- **Touch Controls** — Full touch support for playback

{% hint style="info" %}
For the best mobile viewing experience, install Streamarr as a PWA from your browser's "Add to Home Screen" option.
{% endhint %}

---

## Configuration

Plex Web embedding is automatically configured when you set up your Plex server in Settings.

### Requirements

1. Configure Plex server in **Settings → Plex**
2. Enable at least one library
3. Users need **Streamarr** permission to access

### Library Settings

Configure which libraries users can access:

- **Settings → Plex → Shared Libraries (Default)** — Default libraries for all users
- **User Settings → Shared Libraries** — Per-user library overrides

---

## Troubleshooting

### "Plex Web not loading"

1. Verify Plex server is configured correctly in Settings
2. Check that your Plex server is running and accessible
3. Verify the internal proxy can reach your Plex server

### "Library not appearing"

1. Ensure the library is enabled in Settings → Plex → Libraries
2. Check user's shared library settings
3. Library must be included in the user's access list

### "Playback issues"

1. Check your Plex server's transcoding settings
2. Verify network connectivity to your Plex server
3. Try a lower quality setting in the Plex player

### "Theme not applying"

The automatic theme injection may not work in all browsers. This does not affect functionality.
