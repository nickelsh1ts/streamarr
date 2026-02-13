# Calendar

The Calendar provides a unified view of upcoming media releases and custom events.

## Overview

Streamarr's calendar integrates with:

- **Sonarr** — TV series episode releases
- **Radarr** — Movie releases
- **Local Events** — Custom events created within Streamarr

<!-- TODO: Add screenshot of calendar view -->

---

## Calendar Views

### Month View

The default view showing all events in a monthly calendar format.

### Week View

A detailed week view showing events by day and time.

### Day View

Focus on a single day's events with detailed information.

### Agenda View

A list view of upcoming events, useful for quick scanning.

---

## Event Sources

### Sonarr Events

When Sonarr servers are configured with calendar sync enabled:

- Upcoming episode releases appear on the calendar
- Events include: series name, episode title, air date/time
- Click an event to view more details

Configure Sonarr calendar sync in **Settings → Services → Sonarr**:

| Setting         | Description                                 |
| --------------- | ------------------------------------------- |
| **Enable Sync** | Turn calendar sync on/off                   |
| **Past Days**   | How many days of past episodes to include   |
| **Future Days** | How many days of future episodes to include |

### Radarr Events

When Radarr servers are configured with calendar sync enabled:

- Upcoming movie releases appear on the calendar
- Events include: movie title, release type, release date
- Click an event to view more details

Configure Radarr calendar sync in **Settings → Services → Radarr**:

| Setting         | Description                                 |
| --------------- | ------------------------------------------- |
| **Enable Sync** | Turn calendar sync on/off                   |
| **Past Days**   | How many days of past releases to include   |
| **Future Days** | How many days of future releases to include |

### Local Events

Custom events created within Streamarr:

- Server announcements
- Maintenance windows
- Watch parties
- Any custom event

---

## Creating Local Events

Users with **Create Events** or **Manage Events** permission can create local events:

1. Click **Create Event** or click on a calendar date
2. Fill in event details:

| Field                 | Description                       |
| --------------------- | --------------------------------- |
| **Summary**           | Event title                       |
| **Description**       | Event details (supports Markdown) |
| **Start Date/Time**   | When the event starts             |
| **End Date/Time**     | When the event ends (optional)    |
| **All Day**           | Mark as an all-day event          |
| **Category**          | Event category for filtering      |
| **Send Notification** | Notify users about this event     |

3. Click **Create**

### Event Categories

Organize events with categories:

- **Announcement** — Server announcements
- **Maintenance** — Scheduled maintenance
- **Release** — Content releases
- **Watch Party** — Group watching events
- **Custom** — Other events

---

## Managing Events

### Editing Events

Users with **Manage Events** permission can:

1. Click on an event
2. Click **Edit**
3. Modify event details
4. Click **Save**

### Deleting Events

Users with **Manage Events** permission can:

1. Click on an event
2. Click **Delete**
3. Confirm deletion

{% hint style="info" %}
Only local events can be edited or deleted. Sonarr and Radarr events are read-only and synced from those services.
{% endhint %}

---

## Event Notifications

When **Send Notification** is enabled for an event:

- All users with **View Schedule** permission receive a notification
- Notification is sent when the event is created
- Admins can send reminders manually

---

## Calendar Sync

### How Caching Works

Sonarr and Radarr calendar data is cached for performance:

- Data is fetched from Sonarr/Radarr iCal feeds
- Cache expires after 1 hour
- Fresh data is automatically fetched when the cache expires
- No manual refresh is required

{% hint style="info" %}
If events appear stale, wait up to 1 hour for the cache to refresh automatically. For an immediate refresh, flush the Sonarr or Radarr cache in **Settings > Jobs & Cache**.
{% endhint %}

---

## Permissions

| Permission        | Capabilities                          |
| ----------------- | ------------------------------------- |
| **View Schedule** | View the calendar and all events      |
| **Create Events** | Create new local events               |
| **Manage Events** | Create, edit, and delete local events |

Users without **View Schedule** permission cannot access the calendar.

---

## Troubleshooting

### Events not appearing

1. Verify Sonarr/Radarr is configured in Settings
2. Check that calendar sync is enabled for the service
3. Verify Past Days and Future Days settings
4. Flush the Sonarr/Radarr cache in **Settings > Jobs & Cache** to force a refresh

### Wrong timezone

1. Verify your server timezone is set correctly (TZ environment variable)
2. Check your Sonarr/Radarr timezone settings
3. Browser time may affect display

### Missing episodes/movies

1. Ensure the content is monitored in Sonarr/Radarr
2. Check release date information is available
3. Verify API connectivity
