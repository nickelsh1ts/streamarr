# Help Centre

The Help Centre provides resources and documentation to help users get started and troubleshoot common issues.

## Overview

Access the Help Centre by clicking the **Help** link in the navigation or user dropdown menu.

The Help Centre includes:

- Getting started guides
- Feature explanations
- Troubleshooting tips
- Contact and support information

---

## Topics

### Getting Started

New user guides covering:

| Topic                  | Description                                |
| ---------------------- | ------------------------------------------ |
| **What is Streamarr?** | Introduction to Streamarr and its features |
| **What is Plex?**      | Overview of Plex media server              |
| **Quick Start**        | Getting up and running quickly             |
| **Download Plex**      | Links to Plex apps for all platforms       |
| **Download Streamarr** | PWA installation instructions              |
| **Become a Member**    | How to sign up and join the server         |

### Watching Content

Guides for streaming content:

| Topic                | Description                                   |
| -------------------- | --------------------------------------------- |
| **Devices**          | Supported devices and apps                    |
| **Watch on TV**      | Setting up on smart TVs and streaming devices |
| **Download Offline** | Downloading content for offline viewing       |
| **Requesting**       | How to request new content                    |
| **Reporting Issues** | How to report playback or content issues      |

### Legal

Legal documentation:

- **Terms of Use** — Usage terms and conditions
- **Privacy Policy** — Data handling and privacy information

---

## Features

### Popular Topics

Quick links to frequently accessed help articles.

### Contact Support

Information on how to reach administrators for additional help:

- Support email (if configured)
- Support URL (if configured)
- GitHub links for bug reports

### Server Status

If your administrator has configured a status page (e.g., Uptime Kuma), a link to check service status is displayed in the Help Centre. This allows users to check whether services are experiencing issues without needing to sign in.

See [Uptime Kuma](settings/README.md#uptime-kuma) in Settings for configuration.

### Display Language

Visitors browsing the Help Centre **without being signed in** can change the display language directly from the Help Centre. A language (globe) button appears in the top-right corner of the Help Centre header; clicking it opens a **Display Language** menu for selecting from the available languages.

This lets prospective members read the Help Centre in their preferred language before they have an account.

{% hint style="info" %}
The language picker in the Help Centre is intended for **unauthenticated visitors**. Once signed in, your display language follows your account's language preference instead.
{% endhint %}

The list of selectable languages is the same set Streamarr is translated into. See [Translations](../support/translations.md) for how languages are added and how to contribute new ones.

---

## Configuration

Administrators can customize support resources:

### Support URL

Configure a custom support page URL:

1. Navigate to **Settings → General**
2. Set the **Support URL** field
3. Save settings

This URL is displayed in the Help Centre and used for support links throughout the app.

### Support Email

Configure a support email address:

1. Navigate to **Settings → General**
2. Set the **Support Email** field
3. Save settings

This email is displayed when users need to contact support.

---

## Access

The Help Centre is accessible to all users, including unauthenticated visitors.

Administrators can disable the Help Centre entirely via **Settings → General → [Enable Help Centre](settings/README.md#enable-help-centre)**. When disabled:

- All Help Centre links are hidden from the navigation, footer, and user dropdown
- Direct navigation to `/help` redirects to the watch page
- Legal pages (Terms, Privacy, Cookies) are also hidden

---

## Integration with Onboarding

The Help Centre complements the onboarding system:

- New users are directed to relevant help topics during tutorials
- Tutorial steps can link to specific help articles
- Welcome slides can reference the Help Centre for more information

See [Onboarding](settings/onboarding.md) for tutorial configuration.

## Related Pages

- [Progressive Web App (PWA)](pwa.md) — Install Streamarr on your device
- [System](settings/system.md) — Server health, version info, and support links
- [Translations](../support/translations.md) — Supported languages and how to contribute
