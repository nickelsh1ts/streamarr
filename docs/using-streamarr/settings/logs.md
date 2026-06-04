# Logs

The Logs page provides an in-app viewer for Streamarr's application logs, so you can troubleshoot issues without needing shell access to the server.

## Overview

Access the Logs page via **Settings → Logs** in the [Admin Panel](../admin.md).

{% hint style="info" %}
The Logs page requires **Admin** permission.
{% endhint %}

Each log entry shows its **timestamp**, **severity**, **label** (the part of the application that produced it), and **message**. Entries with extra context can be expanded to view their full details.

---

## Filtering by Severity

Use the severity filter to narrow the list to a specific log level:

| Level        | Description                                 |
| ------------ | ------------------------------------------- |
| **Show All** | Display entries of every severity           |
| **Debug**    | Verbose diagnostic detail (most noisy)      |
| **Info**     | Normal operational messages                 |
| **Warn**     | Recoverable problems and notable conditions |
| **Error**    | Failures that need attention                |

{% hint style="info" %}
The level of detail captured in the logs is controlled by the `LOG_LEVEL` environment variable. See [Installation → Environment Variables](../../getting-started/installation.md#environment-variables).
{% endhint %}

---

## Searching

Use the search box to filter entries by text in the message. This is helpful for tracing a specific operation, user, or service.

---

## Live Tailing (Pause / Resume)

The viewer streams new log entries as they are written. Use the **Pause** button to freeze the view—useful when you are reading a specific entry and do not want it to scroll away—and **Resume** to continue following new output.

---

## Pagination

Logs are paginated. You can choose how many entries to display per page and move through pages with **Previous** and **Next**.

---

## Viewing Entry Details

Click **View Details** on an entry to open a panel showing:

- **Severity**
- **Label**
- **Timestamp**
- **Message**
- **Additional Data** — any structured metadata attached to the entry

You can **Copy to Clipboard** from the details view to grab the message (and its data) for bug reports or further investigation.

---

## Viewing Logs Outside the App

The in-app viewer is convenient, but the same logs are also available directly:

- **Standard output** — visible via your container logs, e.g. `docker logs streamarr`
- **Log files** — written to the `logs/` folder inside your configuration directory (the in-app viewer reads `config/logs/.machinelogs.json`)

{% hint style="info" %}
When reporting a bug, the in-app **Copy to Clipboard** action or the files in `config/logs/` are the easiest way to share relevant log output. Remember to redact any sensitive values (tokens, API keys) before sharing.
{% endhint %}

---

## API Reference

| Endpoint                | Method | Description                                                       |
| ----------------------- | ------ | ----------------------------------------------------------------- |
| `/api/v1/settings/logs` | GET    | Retrieve application log entries (paginated, filterable by level) |
