# Frequently Asked Questions (FAQ)

{% hint style="info" %}
If you can't find the solution to your problem here, please read [Need Help?](./need-help.md) and reach out to us on [GitHub Discussions](https://github.com/nickelsh1ts/streamarr/discussions).

_Please do not post questions or support requests on the GitHub issue tracker!_
{% endhint %}

---

## General

### How do I keep Streamarr up-to-date?

Use a third-party update mechanism such as [Watchtower](https://github.com/containrrr/watchtower) or [Ouroboros](https://github.com/pyouroboros/ouroboros) to keep Streamarr up-to-date automatically.

Alternatively, manually pull the latest image and recreate the container:

```bash
docker pull ghcr.io/nickelsh1ts/streamarr:latest
docker stop streamarr && docker rm streamarr
docker run -d ... # your original run command
```

### How can I access Streamarr outside of my home network?

There are several methods, listed from most to least secure:

1. **VPN** — Set up a VPN tunnel to your home network. Access Streamarr via its local IP address.

2. **Reverse Proxy** — Set up a web server with SSL and use a reverse proxy. See our [reverse proxy examples](../extending-streamarr/reverse-proxy.md).

3. **Port Forwarding** — Forward an external port on your router to Streamarr's port. Access via `http://YOUR-EXTERNAL-IP:3000`. This is the least secure option.

### Are there mobile apps for Streamarr?

Streamarr is designed as a Progressive Web App (PWA) and provides a native-like experience when installed:

**To install on mobile:**

1. Access your Streamarr instance over HTTPS
2. In your browser, tap "Add to Home Screen" or "Install App"
3. Streamarr will appear as an app on your device

PWA features include:

- Offline support for basic functionality
- Push notifications
- Full-screen app experience
- App icon on home screen

See [Progressive Web App (PWA)](../using-streamarr/pwa.md) for detailed installation instructions.

### Where can I find the changelog?

You can find the changelog in:

- **Settings → System** in your Streamarr instance (see [System](../using-streamarr/settings/system.md))
- [GitHub Releases](https://github.com/nickelsh1ts/streamarr/releases) for stable releases
- [GitHub Commits](https://github.com/nickelsh1ts/streamarr/commits/develop) for development changes

### Where can I find the log files?

Logs are stored in `config/logs/` directory:

- `streamarr-YYYY-MM-DD.log` — Main application logs (rotated daily)

See [How can I share my logs?](./need-help.md#how-can-i-share-my-logs) for instructions on sharing logs when seeking help.

### What ports does Streamarr use?

| Port   | Service                    |
| ------ | -------------------------- |
| `3000` | Main web interface and API |

The Python service for Plex invites runs internally on port 5005 and does not need to be exposed.

---

## Users

### Why can't I see all of my Plex users?

Only users who have **accepted** their Plex server invite can be imported or will appear in Streamarr. Pending invites are not visible.

To import Plex users:

1. Go to **Settings → Plex**
2. Click **Import Plex Users**

### Can I create local users in Streamarr?

Yes! Local users authenticate with email/password instead of Plex.

See [Creating Local Users](../using-streamarr/users/README.md#creating-local-users) for instructions.

### What's the difference between Plex Home and Friend invites?

| Type          | Description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| **Friend**    | User is added as a friend to your Plex server. They have their own Plex account. |
| **Plex Home** | User is added as a managed/home user under your Plex account. Useful for family. |

---

## Invites

### Why can't users redeem invites?

Check the following:

1. **Sign Up Enabled** — Verify **Enable Sign Up** is turned on in Settings
2. **Invite Active** — Check the invite status isn't Expired or Inactive
3. **Usage Limit** — Verify the invite hasn't reached its usage limit
4. **Python Service** — Check the application logs for Python service errors

### Why don't invited users appear on my Plex server?

The internal Python service handles Plex invite operations:

1. Check the application logs for Python service errors
2. Look for errors in `config/logs/.machinelogs.json`
3. Verify your Plex token is valid

### Can I customize which libraries are shared per invite?

Yes! When creating an invite with **Advanced Invites** permission:

1. Select "Specific Libraries" under Shared Libraries
2. Choose which libraries to share
3. The invited user will only have access to those libraries

---

## Notifications

### Emails are not being sent

1. Verify email settings in **Settings → Notifications → Email**
2. Click **Test** to send a test email
3. Check spam/junk folder
4. Review application logs for SMTP errors

Common issues:

- Gmail requires [App Passwords](https://support.google.com/mail/answer/185833) with 2FA enabled
- Port 25 is often blocked by ISPs
- Self-signed certificates may need to be explicitly allowed

### Push notifications aren't working

1. Verify you're accessing Streamarr over HTTPS
2. Check browser notification permissions
3. Ensure service worker is registered (check browser dev tools)
4. Re-subscribe to push notifications in account settings

### In-app notifications are delayed

Real-time notifications require WebSocket support. Ensure your reverse proxy supports WebSocket connections. See [Reverse Proxy](../extending-streamarr/reverse-proxy.md).

---

## Integration

### I'm getting API errors with Sonarr/Radarr

1. Verify you're using v3 or newer of Sonarr/Radarr
2. Check API key is correct
3. Verify hostname/port are accessible from Streamarr
4. Check URL base if you're using one

### Calendar events aren't syncing

1. Verify calendar sync is enabled for the service
2. Check Past Days and Future Days settings
3. Flush the calendar cache in **Settings → Jobs & Cache**
4. Verify API connectivity

### Download client shows as unhealthy

1. Check the client is running
2. Verify Web UI is enabled
3. Test credentials directly in the client's Web UI
4. Check firewall rules

See [Client Health](../using-streamarr/downloads/README.md#client-health) for details on health states, cooldown behavior, and retry options.

---

## Performance

### Streamarr is slow

1. Check server resources (CPU, RAM)
2. Verify database isn't corrupted
3. Clear image cache if it's very large
4. Check network connectivity to external services

### High memory usage

1. Disable image caching if not needed
2. Reduce number of connected services
3. Restart the container periodically

### Database errors

SQLite database corruption can occur if:

- Container is improperly stopped
- Volume is mounted over SMB/NFS without proper locking

To recover:

1. Stop Streamarr
2. Backup `config/db/db.sqlite3`
3. Try running `sqlite3 db.sqlite3 "PRAGMA integrity_check;"`
4. If corrupted, restore from backup or delete and reconfigure

---

## Docker

### Config not persisting after restart

Ensure your volume mount is correct:

```bash
-v /path/to/config:/app/config
```

The path must be absolute and the directory must exist.

### Permission denied errors

Check file ownership:

```bash
chown -R 1001:1001 /path/to/config
```

Or run the container with your user ID:

```bash
--user $(id -u):$(id -g)
```
