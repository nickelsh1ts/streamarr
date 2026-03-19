# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

Only the latest release of Streamarr receives security updates. We recommend always running the most recent version.

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Streamarr, please report it responsibly by emailing:

**security@streamarr.dev**

Alternatively, you can use [GitHub's private vulnerability reporting](https://github.com/nickelsh1ts/streamarr/security/advisories/new) to submit a report directly on the repository.

### What to Include

When reporting a vulnerability, please provide as much of the following as possible:

- A description of the vulnerability and its potential impact.
- Steps to reproduce or a proof-of-concept.
- The version(s) of Streamarr affected.
- Any suggested fixes or mitigations, if applicable.

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within **48 hours**.
- **Assessment**: We will investigate and assess the severity of the issue.
- **Updates**: We will keep you informed of our progress toward a fix.
- **Disclosure**: Once a fix is released, we will coordinate public disclosure with you. We ask that you do not publicly disclose the vulnerability until a fix is available.
- **Credit**: We are happy to credit you in the release notes (unless you prefer to remain anonymous).

## Security Best Practices for Deployers

- **Keep Streamarr up to date** — always run the latest version.
- **Use a reverse proxy** (e.g., Nginx, Caddy, Traefik) with HTTPS in front of Streamarr.
- **Do not expose Streamarr directly to the internet** without a reverse proxy and proper firewall rules.
- **Restrict access** to the `CONFIG_DIRECTORY` — it contains the database, settings, and session data.
- **Use strong, unique passwords** for all integrated services (Plex, Sonarr, Radarr, etc.).
- **Review permissions** — Streamarr uses granular, bitwise permissions. Grant users only the access they need.

## Scope

The following are considered **in scope** for security reports:

- Authentication and authorization bypasses
- Injection vulnerabilities (SQL, XSS, command injection)
- Server-side request forgery (SSRF)
- Sensitive data exposure
- Privilege escalation
- CSRF bypass

The following are considered **out of scope**:

- Vulnerabilities in third-party services that Streamarr integrates with (Plex, Sonarr, Radarr, etc.)
- Issues requiring physical access to the server
- Social engineering attacks
- Denial of service (DoS) attacks
- Issues in dependencies — please report these to the upstream project. However, if a vulnerable dependency directly impacts Streamarr, let us know.

## Thank You

We appreciate the security research community's efforts in helping keep Streamarr and its users safe. Thank you for practicing responsible disclosure.
