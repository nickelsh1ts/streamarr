# Installation

{% hint style="info" %}
After running Streamarr for the first time, configure it by visiting the web UI at `http://[address]:3000` and completing the setup steps.
{% endhint %}

## Docker

{% hint style="warning" %}
Be sure to replace `/path/to/appdata/config` in the examples below with a valid host directory path. If this volume mount is not configured correctly, your Streamarr settings and data will not be persisted when the container is recreated.

The `TZ` environment variable should be set to the [TZ database name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) of your time zone.
{% endhint %}

{% tabs %}
{% tab title="Docker CLI" %}

For details on the Docker CLI, please [review the official `docker run` documentation](https://docs.docker.com/engine/reference/run/).

**Installation:**

```bash
docker run -d \
  --name streamarr \
  -e LOG_LEVEL=debug \
  -e TZ=America/New_York \
  -p 3000:3000 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
  ghcr.io/nickelsh1ts/streamarr:latest
```

To run the container as a specific user/group, you may optionally add `--user=[ user | user:group | uid | uid:gid | user:gid | uid:group ]` to the above command.

**Updating:**

Stop and remove the existing container:

```bash
docker stop streamarr && docker rm streamarr
```

Pull the latest image:

```bash
docker pull ghcr.io/nickelsh1ts/streamarr:latest
```

Finally, run the container with the same parameters originally used to create the container:

```bash
docker run -d ...
```

{% hint style="info" %}
You may alternatively use a third-party updating mechanism, such as [Watchtower](https://github.com/containrrr/watchtower) or [Ouroboros](https://github.com/pyouroboros/ouroboros), to keep Streamarr up-to-date automatically.
{% endhint %}

{% endtab %}

{% tab title="Docker Compose" %}

For details on how to use Docker Compose, please [review the official Compose documentation](https://docs.docker.com/compose/reference/).

**Installation:**

Define the `streamarr` service in your `docker-compose.yml` as follows:

```yaml
services:
  streamarr:
    image: ghcr.io/nickelsh1ts/streamarr:latest
    container_name: streamarr
    environment:
      - LOG_LEVEL=debug
      - TZ=America/New_York
    ports:
      - 3000:3000
    volumes:
      - /path/to/appdata/config:/app/config
    restart: unless-stopped
```

Then, start all services defined in the Compose file:

```bash
docker compose up -d
```

**Updating:**

Pull the latest image:

```bash
docker compose pull streamarr
```

Then, restart all services defined in the Compose file:

```bash
docker compose up -d
```

{% endtab %}
{% endtabs %}

## Environment Variables

| Variable           | Default       | Description                                          |
| ------------------ | ------------- | ---------------------------------------------------- |
| `CONFIG_DIRECTORY` | `/app/config` | Override the configuration directory path            |
| `NODE_ENV`         | `production`  | Set to `development` for development mode            |
| `LOG_LEVEL`        | `debug`       | Winston log level (`error`, `warn`, `info`, `debug`) |
| `TZ`               | `UTC`         | Timezone for the container                           |

## Ports

| Port   | Description                |
| ------ | -------------------------- |
| `3000` | Main web interface and API |

{% hint style="info" %}
Streamarr also runs an internal Python service on port 5005 for Plex invite operations. This service is called internally by the Streamarr API and does **not** need to be exposed publicly.
{% endhint %}

## Volume Mounts

| Path          | Description                                    |
| ------------- | ---------------------------------------------- |
| `/app/config` | Configuration files, database, cache, and logs |

The config directory contains:

- `settings.json` — Application settings
- `db/db.sqlite3` — SQLite database
- `cache/images/` — Cached images from TMDB and Plex
- `logs/` — Application logs (rotated daily)

## First-Time Setup

After starting Streamarr for the first time:

1. Navigate to `http://[your-server-ip]:3000` in your browser
2. Sign in with your Plex account (the first user becomes the admin)
3. Configure your Plex server connection
4. (Optional) Add your \*Arr services (Radarr, Sonarr, etc.)
5. (Optional) Configure notification agents

{% hint style="info" %}
The admin account is always user ID 1 and has full permissions. This user cannot be deleted.
{% endhint %}

<!-- TODO: Add screenshot of initial setup page -->
