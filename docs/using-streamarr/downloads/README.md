# Downloads

Streamarr provides a unified interface for managing torrent downloads across multiple clients.

## Supported Clients

| Client           | Status          |
| ---------------- | --------------- |
| **qBittorrent**  | Fully supported |
| **Deluge**       | Fully supported |
| **Transmission** | Fully supported |

---

## Configuration

Configure download clients in **Settings → Downloads**.

### Adding a Client

1. Click **Add Download Client**
2. Select the client type
3. Configure connection settings:

| Setting            | Description                               |
| ------------------ | ----------------------------------------- |
| **Client Name**    | Friendly name for this client             |
| **Client Type**    | qBittorrent, Deluge, or Transmission      |
| **Hostname or IP** | Address of the download client            |
| **Port**           | Web UI port                               |
| **Use SSL**        | Enable HTTPS connection                   |
| **Username**       | Authentication username                   |
| **Password**       | Authentication password                   |
| **External URL**   | External URL for direct access (optional) |

4. Click **Test** to verify connection
5. Click **Save**

### Client-Specific Setup

{% tabs %}
{% tab title="qBittorrent" %}

1. Enable the Web UI in qBittorrent:
   - Go to **Tools → Options → Web UI**
   - Check **Enable the Web UI**
   - Set a username and password
   - Default port: `8080`

2. Configure in Streamarr:
   - Hostname: Your qBittorrent server address
   - Port: `8080` (or your configured port)
   - Username/Password: Your Web UI credentials

{% endtab %}

{% tab title="Deluge" %}

1. Enable the Web UI plugin in Deluge:
   - Go to **Preferences → Plugins**
   - Enable **WebUi**
   - Configure the WebUi plugin settings
   - Default port: `8112`

2. Configure in Streamarr:
   - Hostname: Your Deluge server address
   - Port: `8112` (or your configured port)
   - Password: Your Deluge Web UI password

{% endtab %}

{% tab title="Transmission" %}

1. Enable the Web UI in Transmission:
   - Edit `settings.json` or use the Transmission settings
   - Set `rpc-enabled` to `true`
   - Configure `rpc-username` and `rpc-password`
   - Default port: `9091`

2. Configure in Streamarr:
   - Hostname: Your Transmission server address
   - Port: `9091` (or your configured port)
   - Username/Password: Your RPC credentials

{% endtab %}
{% endtabs %}

---

## Downloads Dashboard

The downloads page shows all active torrents across configured clients.

### Torrent List

For each torrent:

| Column       | Description                                        |
| ------------ | -------------------------------------------------- |
| **Name**     | Torrent name                                       |
| **Size**     | Total size                                         |
| **Progress** | Download progress percentage                       |
| **Status**   | Current state (downloading, seeding, paused, etc.) |
| **Speed**    | Download/upload speed                              |
| **ETA**      | Estimated time to completion                       |
| **Client**   | Which client this torrent belongs to               |

### Filtering

Filter torrents by:

- **Client** — Show torrents from specific clients
- **Status** — Downloading, seeding, paused, completed
- **Search** — Search by torrent name

### Sorting

Sort by:

- Name
- Size
- Progress
- Added date
- Speed

---

## Torrent Actions

### Individual Torrent Actions

Click on a torrent to access actions:

| Action          | Description                                 |
| --------------- | ------------------------------------------- |
| **Pause**       | Pause the torrent                           |
| **Resume**      | Resume a paused torrent                     |
| **Delete**      | Remove the torrent (optional: delete files) |
| **Recheck**     | Recheck/verify torrent files                |
| **Force Start** | Force start regardless of queue             |

### Bulk Actions

Select multiple torrents to perform bulk actions:

- Pause all selected
- Resume all selected
- Delete all selected

---

## Adding Torrents

{% hint style="info" %}
Adding torrents is typically done through your \*Arr applications (Sonarr, Radarr, etc.). Streamarr provides monitoring and management capabilities.
{% endhint %}

If direct torrent adding is supported:

1. Click **Add Torrent**
2. Choose input method:
   - **Torrent File** — Upload a .torrent file
   - **Magnet Link** — Paste a magnet URI
3. Select destination client
4. Configure options (category, save path)
5. Click **Add**

---

## Categories

Manage torrent categories per client:

### Viewing Categories

Categories help organize downloads by type:

- `movies` — Movie downloads
- `tv` — TV series downloads
- `music` — Music downloads

### Creating Categories

1. Go to **Downloads**
2. Click **Manage Categories**
3. Click **Add Category**
4. Enter category name and save path
5. Click **Save**

---

## Client Health

Streamarr monitors download client health automatically and protects against repeated connection failures.

### Health Status

Each client transitions through the following states:

| Status        | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| **Healthy**   | Client is responding normally                                      |
| **Retrying**  | First connection failure detected; retrying on next request        |
| **Unhealthy** | Two consecutive failures; client enters a 5-minute cooldown period |

### State Transitions

1. **Healthy → Retrying**: The first failed connection attempt marks the client as retrying
2. **Retrying → Unhealthy**: A second consecutive failure puts the client into a 5-minute cooldown
3. **Unhealthy → Healthy**: A successful connection (or manual retry) restores healthy status
4. **Retrying → Healthy**: A successful connection during the retrying state restores immediately

### Cooldown Behavior

When a client enters cooldown:

- No new connection attempts are made to the client for **5 minutes**
- The last successfully fetched data is served from cache during cooldown
- After the cooldown period expires, the next request will attempt a fresh connection

### Manual Retry

You can manually reset client health without waiting for cooldown to expire:

- **Retry a specific client** — Reset one client to healthy and retry immediately
- **Retry all clients** — Reset all unhealthy clients at once

### Health API

| Endpoint                                   | Method | Description                      |
| ------------------------------------------ | ------ | -------------------------------- |
| `/api/v1/downloads/health`                 | GET    | Get health status of all clients |
| `/api/v1/downloads/health/retry/:clientId` | POST   | Retry a specific client          |
| `/api/v1/downloads/health/retry`           | POST   | Retry all unhealthy clients      |

### Health Recovery

If a client enters cooldown:

1. Check the client is running and accessible
2. Verify network connectivity between Streamarr and the client
3. Use the retry button to reset health and attempt an immediate reconnection

---

## Statistics

The downloads dashboard shows:

- **Total Downloads** — Count across all clients
- **Active Downloads** — Currently downloading
- **Total Size** — Combined size of all torrents
- **Download Speed** — Aggregate download rate
- **Upload Speed** — Aggregate upload rate
- **Per-Client Stats** — Individual client statistics

---

## Permissions

Access to the Downloads page requires **Admin** permission.

---

## Troubleshooting

### "Unable to connect to client"

1. Verify the client is running
2. Check hostname and port are correct
3. Verify Web UI is enabled on the client
4. Check firewall rules
5. Test SSL settings

### Authentication failed

1. Verify username and password
2. Check the client's authentication settings
3. For Deluge, ensure you're using the Web UI password

### Torrents not appearing

1. Refresh the page
2. Check filter settings
3. Verify client connection is healthy
4. Check client health status in settings

### Slow performance

1. Reduce the number of torrent clients
2. Ensure clients are on a fast network connection
3. Check client responsiveness directly
