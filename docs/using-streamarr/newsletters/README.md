# Newsletters

Newsletters let administrators compose, schedule, and send rich email updates to your users — for example a weekly digest of newly added content, the most-watched titles, or a curated set of tagged media. Each user controls their own subscription, and newsletters are delivered independently of the standard notification agents.

Newsletters are managed from **Admin → Settings → Newsletters**. The list can be filtered (All, Scheduled, Draft, Important) and sorted (Last Modified, Most Recent, Name); your filter, sort, and page-size choices are remembered between visits.

---

## Requirements

Newsletter delivery uses the same SMTP configuration as the Email notification agent, so the [Email agent](../notifications/email.md) must be enabled and configured before a newsletter can be sent.

Content blocks pull from your connected services, each of which is optional:

| Block            | Source               | Needs                                    |
| ---------------- | -------------------- | ---------------------------------------- |
| Recently Added   | Plex                 | At least one enabled Plex library        |
| Top Streams      | Tautulli             | Tautulli configured (hostname + API key) |
| By Tag (Plex)    | Plex labels          | Labeled items in a Plex library          |
| By Tag (Servarr) | Radarr / Sonarr tags | A configured Radarr and/or Sonarr server |

A newsletter with no available source simply omits that block. A block that resolves to no items is dropped entirely — including its heading — so an empty block never appears. If **every** configured block resolves empty, the newsletter is not sent (there is nothing to deliver); see [When a content source is unreachable](#when-a-content-source-is-unreachable). A plain newsletter with no content blocks configured always sends.

---

## Composing a newsletter

Create a newsletter with **Create Newsletter**, or edit an existing one. The editor has the following fields:

| Field           | Description                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **Name**        | Internal label shown in the admin list and the user's subscription settings.                      |
| **Description** | Optional summary shown to users under the newsletter name on their subscription page.             |
| **Subject**     | The email subject line. Supports tokens (see below).                                              |
| **Body format** | `Markdown` (default) or `HTML`. Markdown is converted to HTML; both are sanitized before sending. |
| **Body**        | The message content. Insert tokens and content blocks anywhere in the body.                       |

### Personalization tokens

Tokens are replaced when the newsletter is rendered. They work in the subject and body.

| Token                  | Replaced with                     |
| ---------------------- | --------------------------------- |
| `{{applicationTitle}}` | Your configured application title |
| `{{applicationUrl}}`   | Your configured application URL   |
| `{{recipientName}}`    | The recipient's display name      |
| `{{recipientEmail}}`   | The recipient's email address     |
| `{{date}}`             | The date the newsletter is sent   |

---

## Content blocks

Content blocks render a grid of posters with titles, and link back into your Plex web player where possible. Place a block by inserting its token in the body, or leave the token out and any enabled block is appended automatically.

| Block token         | Renders                                              |
| ------------------- | ---------------------------------------------------- |
| `{{recentlyAdded}}` | Recently added Plex media, grouped by library type   |
| `{{topStreams}}`    | The most-streamed media from Tautulli                |
| `{{byTag}}`         | Media matched by Plex label and/or Radarr/Sonarr tag |

### Recently Added

Enable per library type — Movies, TV Shows, Music, Photos, or Other. Each type has:

- **Past days** — how far back to look for new items.
- **Max items** — cap on how many to show (up to 24).
- **Libraries** — optionally limit to specific libraries of that type.
- **Section header** — an optional custom heading (otherwise a localized default is used).

TV episodes are grouped into their parent show with a "new episodes" count.

### Top Streams

The most-played Movies, TV, and Music over a period, sourced from Tautulli. Each type has its own **Past days**, **Max items**, optional **Libraries**, and **Section header**. (Tautulli only tracks playback for these three media types.)

### By Tag

Two independent sources under a single section, each toggled on its own:

- **By Plex Label** — items carrying a given Plex label. Because labels are applied per library, you can limit which movie/show libraries are searched.
- **By Radarr/Sonarr Tag** — items carrying a given Radarr (movies) and/or Sonarr (series) tag. These apply across the whole instance and are not library-scoped.

Both sources are merged, de-duplicated, and capped by the section's **Max items**, under one optional **Section header**.

---

## Recipients

- **All users** — every user, minus anyone who has unsubscribed.
- **Custom** — a specific list of users you choose.

### Important newsletters

Marking a newsletter **Important** flags it as high priority for mail clients and **overrides unsubscribes** — it is delivered to all selected recipients regardless of their subscription preference. Reserve this for genuinely critical or required communications.

---

## Scheduling

A newsletter is sent only while it is **enabled**.

- **One-time** — runs once at a specific date and time, then disables itself.
- **Recurring** — runs on a cron schedule. The editor shows a human-readable description of the expression as you type.

To prevent accidental spam, a schedule may run **at most once per hour**; anything more frequent (every-minute or seconds-level expressions) is rejected.

> If the server is offline when a one-time newsletter was due, it is skipped and automatically disabled the next time the server starts.

### When a content source is unreachable

If a scheduled newsletter cannot gather one of its content blocks because a service (Plex, Tautulli, or an \*Arr app) is unreachable, Streamarr does **not** send a half-empty email. It retries after a short delay and, if the source is still unavailable after the configured number of attempts, **aborts** the send — nothing is delivered, the failure is logged, and the run is recorded in the newsletter's [history](#history). One-time newsletters are disabled after an abort.

A block that is simply empty (no matching items) is not a failure — it is dropped and the rest of the newsletter still goes out. This is distinct from a failure: retries only apply to unreachable services, whereas an empty result is not retried. If every configured block is empty, the scheduled run is skipped (logged, not recorded in history, and not retried); a manual **Send Now** or **Test** in the same state reports that there is nothing to send. The number of retry attempts and the delay between them are configured under [Settings → Network](../settings/README.md#scheduled-retry-interval).

---

## Preview, test, and send

- **Preview** — renders the actual email (with your draft content) inside the editor so you can see exactly what recipients will receive.
- **Test** — sends the newsletter to your own account only.
- **Send Now** — sends immediately to all resolved recipients. This is irreversible, so it asks for confirmation first.

A newsletter cannot be sent again while a send is already in progress.

---

## History

Each newsletter keeps a paginated history of its sends, showing the date, what triggered it (manual, scheduled, or test), the recipient count, and the number of failures. Open it from the **History** action on the newsletter list.

An **aborted** scheduled send (see [When a content source is unreachable](#when-a-content-source-is-unreachable)) is recorded here too, with every intended recipient counted as a failure so the undelivered run stands out.

---

## User subscriptions

Users manage their own subscriptions under **Profile → Settings → Newsletters**. They see each newsletter they are eligible to receive, along with its description, and can unsubscribe from any that are not marked important. Unsubscribing stops future non-important sends for that user only.
