# Fail2ban

Use fail2ban to block repeated failed sign-in attempts against Streamarr's local password and Plex auth flows.

This guide assumes:

- Streamarr writes logs to the default log directory
- fail2ban runs on the same host as Streamarr
- You want to protect local sign-in attempts (`/api/v1/auth/local`)

---

## 1. Verify Streamarr Logging

Streamarr writes a symlinked current log file named `streamarr.log` in:

- `config/logs/streamarr.log` (default)
- `${CONFIG_DIRECTORY}/logs/streamarr.log` (when `CONFIG_DIRECTORY` is set)

You should see lines like:

```text
2026-05-11T12:34:56.000Z [warn][API]: Failed sign-in attempt using invalid Streamarr password {"ip":"203.0.113.24","email":"user@example.com","userId":null}
```

---

## 2. Create a Fail2ban Filter

Create a new filter file:

```bash
sudo nano /etc/fail2ban/filter.d/streamarr-auth.conf
```

Add:

```ini
[Definition]
failregex = ^.*Failed sign-in attempt using invalid Streamarr password.*"ip":"<HOST>".*$
            ^.*Failed sign-in attempt by unimported Plex user with access to the media app.*"ip":"<HOST>".*$
            ^.*Failed sign-in attempt by Plex user without access to the media app.*"ip":"<HOST>".*$
            ^.*Failed sign-in attempt from Plex user without access to the media app.*"ip":"<HOST>".*$
ignoreregex =
```

---

## 3. Create a Jail

Create a dedicated jail config:

```bash
sudo nano /etc/fail2ban/jail.d/streamarr-auth.local
```

Add:

```ini
[streamarr-auth]
enabled = true
filter = streamarr-auth
logpath = /path/to/streamarr/config/logs/streamarr.log
backend = auto
port = http,https
maxretry = 5
findtime = 10m
bantime = 1h
```

Replace `logpath` with your actual Streamarr log path.

Suggested tuning:

- Lower `maxretry` for stricter protection
- Increase `bantime` if you see repeat abuse
- Add `ignoreip` globally in fail2ban for trusted internal addresses

---

## 4. Reload Fail2ban

```bash
sudo fail2ban-client reload
sudo fail2ban-client status streamarr-auth
```

You should see the jail as active.

---

## 5. Test the Rule

1. Attempt multiple failed local sign-ins from a test client.
2. Check jail status:

```bash
sudo fail2ban-client status streamarr-auth
```

3. Confirm your test IP appears under `Banned IP list`.

---

## Troubleshooting

### Jail does not ban

- Confirm Streamarr is logging failed sign-ins.
- Confirm `logpath` points to the active `streamarr.log` symlink.
- Test regex manually:

```bash
sudo fail2ban-regex /path/to/streamarr/config/logs/streamarr.log /etc/fail2ban/filter.d/streamarr-auth.conf
```

### Docker deployments

If Streamarr runs in Docker, make sure the log file is mounted to the host where fail2ban runs.

### Reverse proxy setups

To ensure real client IPs are logged, enable Trust Proxy in Streamarr settings when running behind a reverse proxy.
