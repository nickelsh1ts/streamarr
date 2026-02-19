# Need Help?

If you're having trouble with Streamarr, here's how to get support.

---

## Before Asking for Help

1. **Check the Documentation** — Many common questions are answered in these docs
2. **Search Existing Issues** — Your problem may have been reported and solved
3. **Check the FAQ** — See [Frequently Asked Questions](./faq.md)
4. **Gather Information** — Collect logs and error messages before asking

---

## Getting Help

### GitHub Discussions

For questions, feature ideas, and general discussion:

[GitHub Discussions](https://github.com/nickelsh1ts/streamarr/discussions)

This is the best place for:

- Usage questions
- Configuration help
- Feature requests
- Showing off your setup

### GitHub Issues

For bug reports only:

[GitHub Issues](https://github.com/nickelsh1ts/streamarr/issues)

{% hint style="warning" %}
Please do not use GitHub Issues for questions or support requests. Use Discussions instead.
{% endhint %}

When reporting a bug:

1. Search existing issues first
2. Use the bug report template
3. Include all requested information
4. Provide reproduction steps

---

## How Can I Share My Logs?

When asking for help, logs are essential for diagnosing issues.

### Location

Logs are stored in your config directory:

```
config/logs/streamarr-YYYY-MM-DD.log    # Main application logs
```

### Docker

To view logs directly:

```bash
# View container logs
docker logs streamarr

# Follow logs in real-time
docker logs -f streamarr

# View last 100 lines
docker logs --tail 100 streamarr
```

To copy log files from the container:

```bash
docker cp streamarr:/app/config/logs/. ./logs/
```

### Sharing Logs

{% hint style="danger" %}
**Review logs before sharing!** Remove any sensitive information such as:

- API keys
- Passwords
- Email addresses
- IP addresses (if concerned about privacy)
  {% endhint %}

For sharing logs:

1. **Pastebin Services** — Use [Pastebin](https://pastebin.com/), [GitHub Gist](https://gist.github.com/), or similar
2. **File Attachment** — Attach as a file in GitHub Issues/Discussions
3. **Code Blocks** — For short logs, use code blocks in your message

---

## Information to Include

When asking for help, include:

### Basic Information

- Streamarr version (found in Settings → System)
- Installation method (Docker, Docker Compose)
- Operating system
- Browser (for UI issues)

### Problem Description

- What you expected to happen
- What actually happened
- Steps to reproduce the issue
- Any error messages

### Logs

- Relevant log entries (see above)
- Browser console errors (for UI issues)
- Network requests (for API issues)

### Configuration

- Relevant settings (without sensitive data)
- Docker command or compose file
- Reverse proxy configuration (if applicable)

---

## Debug Mode

For more detailed logs, you can increase the log level:

```bash
# Docker CLI
docker run -e LOG_LEVEL=debug ...

# Docker Compose
environment:
  - LOG_LEVEL=debug
```

Available log levels:

- `error` — Errors only
- `warn` — Warnings and errors
- `info` — General information (default)
- `debug` — Detailed debugging information

---

## Common Solutions

### Restart the Container

Many issues can be resolved with a restart:

```bash
docker restart streamarr
```

### Clear Cache

Clear application caches in **Settings → Jobs & Cache**.

### Check Connectivity

Verify Streamarr can reach external services:

```bash
# Enter the container
docker exec -it streamarr sh

# Test connectivity
ping your-plex-server
curl -I http://your-radarr:7878
```

### Verify Configuration

Check `config/settings.json` for obviously incorrect values. You can manually edit this file if needed (restart required).

---

## Contributing

If you'd like to help improve Streamarr:

- [Contributing Guide](https://github.com/nickelsh1ts/streamarr/blob/develop/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/nickelsh1ts/streamarr/blob/develop/CODE_OF_CONDUCT.md)

We welcome:

- Bug fixes
- New features
- Documentation improvements
- Translations
