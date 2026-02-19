# Onboarding

Streamarr includes an interactive onboarding system to welcome new users and guide them through key features. This page covers the configuration options for the welcome modal and tutorial system.

## Overview

The onboarding system consists of two components:

1. **Welcome Modal** — A carousel of slides shown on first login
2. **Interactive Tutorial** — A guided tour that highlights key UI elements

Streamarr provides **two separate onboarding tracks**:

- **User Onboarding** — Welcomes regular users and guides them through the main interface (watching, invites, schedule, etc.)
- **Admin Onboarding** — Welcomes administrators and guides them through admin-specific features (settings, services, user management)

Each track has its own welcome slides and tutorial steps, and is triggered independently based on the user's role. Both tracks are fully customizable by administrators.

---

## General Settings

### Enable Welcome Modal

When enabled, new users see a welcome carousel on their first login. The modal introduces them to your media server and can include custom content.

This setting is **enabled** by default.

### Enable Tutorial

When enabled, an interactive tutorial guides new users through key features. The tutorial can highlight UI elements (spotlight mode) or show informational slides (wizard mode).

This setting is **enabled** by default.

### Tutorial Mode

Choose how the tutorial guides users:

| Mode          | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| **Both**      | Combines spotlight highlighting with wizard slides (default) |
| **Spotlight** | Highlights specific UI elements with a tooltip overlay       |
| **Wizard**    | Shows carousel slides without element highlighting           |

### Allow Skip Welcome

When enabled, users can skip or dismiss the welcome modal. When disabled, users must view all slides before proceeding.

This setting is **enabled** by default.

### Allow Skip Tutorial

When enabled, users can skip the tutorial at any time. When disabled, users must complete all tutorial steps.

This setting is **enabled** by default.

### Auto-Start Tutorial

When enabled, the tutorial automatically starts after the welcome modal completes (or immediately if the welcome modal is disabled).

This setting is **enabled** by default.

### Auto-Start Delay

The delay in milliseconds before auto-starting the tutorial. Default is `500` (0.5 seconds).

{% hint style="info" %}
A short delay helps ensure the UI has fully loaded before the tutorial begins highlighting elements.
{% endhint %}

---

## Welcome Content

Configure the slides shown in the welcome modal carousel. Each slide can include:

| Field           | Description                                |
| --------------- | ------------------------------------------ |
| **Title**       | Slide heading (required)                   |
| **Description** | Body text explaining the feature           |
| **Image**       | Optional image (uploaded or external URL)  |
| **Video URL**   | YouTube video embed URL (privacy-enhanced) |
| **Autoplay**    | Auto-play video when slide is visible      |
| **Custom HTML** | Advanced: Custom HTML content (sanitized)  |

### Managing Slides

- **Add Slide** — Create a new slide at the end of the carousel
- **Edit Slide** — Modify an existing slide's content
- **Delete Slide** — Remove a slide (cannot be undone)
- **Reorder** — Drag and drop slides to change their order

### Default Content

Streamarr ships with four default welcome slides:

1. Welcome introduction
2. Library exploration guide
3. Release schedule and invites overview
4. Help and settings guidance

{% hint style="info" %}
The `{applicationTitle}` placeholder in slide content is automatically replaced with your configured [Application Title](README.md#application-title).
{% endhint %}

---

## Tutorial Steps

Configure the interactive tutorial steps. Each step can include:

| Field                | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| **Title**            | Step heading                                                   |
| **Description**      | Explanation of the feature                                     |
| **Target Selector**  | CSS selector or `data-tutorial` attribute to highlight         |
| **Tooltip Position** | Where to position the tooltip (auto, top, bottom, left, right) |
| **Route**            | Optional URL path to navigate to for this step                 |
| **Step Mode**        | How this step renders (spotlight, wizard, or both)             |
| **Image/Video**      | Optional media content                                         |
| **Custom HTML**      | Advanced: Custom HTML content                                  |

### Target Selectors

Tutorial steps use CSS selectors to identify which UI element to highlight. Streamarr uses `data-tutorial` attributes on key elements:

| Preset              | Selector                              | Description            |
| ------------------- | ------------------------------------- | ---------------------- |
| `nav-home`          | `[data-tutorial="nav-home"]`          | Home navigation link   |
| `nav-invites`       | `[data-tutorial="nav-invites"]`       | Invites page link      |
| `nav-schedule`      | `[data-tutorial="nav-schedule"]`      | Release schedule link  |
| `library-menu`      | `[data-tutorial="library-menu"]`      | Library selection menu |
| `user-dropdown`     | `[data-tutorial="user-dropdown"]`     | User profile dropdown  |
| `notifications-btn` | `[data-tutorial="notifications-btn"]` | Notification bell      |

{% hint style="info" %}
You can use any valid CSS selector, but `data-tutorial` attributes are preferred for stability across UI changes.
{% endhint %}

### Managing Steps

- **Add Step** — Create a new tutorial step
- **Edit Step** — Modify step content and settings
- **Delete Step** — Remove a step
- **Reorder** — Drag and drop to change step order

### Default Steps

Streamarr includes default tutorial steps covering:

1. Home navigation
2. Library menu
3. Invites (if enabled)
4. Release schedule (if enabled)
5. User profile dropdown
6. Library pinning in user settings

Steps for disabled features (e.g., invites when sign-up is disabled) are automatically hidden.

---

## Preview & Test

Before deploying changes to users, you can preview the onboarding experience:

- **Preview Welcome** — Opens the welcome modal in preview mode
- **Preview Tutorial** — Starts the tutorial in preview mode

{% hint style="success" %}
Preview mode does not save progress or affect user data. Use it to test your customizations before enabling them for users.
{% endhint %}

---

## Reset Options

### Reset to Defaults

Reset all welcome content and tutorial steps to their default values. This deletes any custom content you have created.

{% hint style="warning" %}
This action cannot be undone. Any uploaded images will also be deleted.
{% endhint %}

### Reset All Users

Reset onboarding progress for all users. This causes every user to see the welcome modal and tutorial again on their next login.

Use this when you have made significant changes to the onboarding content and want all users to experience the updated flow.

---

## User-Level Controls

### Per-User Reset

Administrators can reset onboarding for individual users from the user settings page. Users can also reset their own onboarding from their account settings.

### Starting Tutorial Manually

Users who have not completed or skipped the tutorial can start it from the user dropdown menu (click your avatar, then "Start Tutorial").

Alternatively, users can reset their entire onboarding progress from their account settings, which will show both the welcome modal and tutorial again.

---

## Admin Onboarding

In addition to user onboarding, Streamarr includes a dedicated onboarding experience for administrators. This is triggered automatically when an admin first signs in, and is tracked separately from user onboarding.

### How It Works

1. When the admin first accesses Streamarr, the **admin welcome modal** is displayed
2. After completing or dismissing the welcome modal, the **admin tutorial** begins (if auto-start is enabled)
3. Once complete, admin onboarding is marked as finished via the `adminOnboardingCompleted` setting

Admin onboarding is independent of user onboarding — resetting user onboarding does not affect admin onboarding, and vice versa.

### Default Admin Welcome Slides

Streamarr ships with four admin-specific welcome slides:

| Order | Title                   | Description                                                                            |
| ----- | ----------------------- | -------------------------------------------------------------------------------------- |
| 1     | Welcome to Streamarr!   | Introduction to Streamarr as a media server management solution                        |
| 2     | Manage Your Users       | Overview of user management: permissions, quotas, library access, and Plex user import |
| 3     | Configure Your Services | Guide to integrating Radarr, Sonarr, download clients, and other services              |
| 4     | Set Up Notifications    | Introduction to email, web push, and in-app notification configuration                 |

### Default Admin Tutorial Steps

Streamarr ships with five admin-specific tutorial steps (all in spotlight mode):

| Order | Title             | Description                                                  | Navigates To                 |
| ----- | ----------------- | ------------------------------------------------------------ | ---------------------------- |
| 1     | Admin Navigation  | Overview of the admin tabs for settings, users, and services | `/admin`                     |
| 2     | General Settings  | Server-wide preferences and user experience customization    | `/admin/settings`            |
| 3     | User Onboarding   | Customize welcome slides and tutorial steps for new users    | `/admin/settings/onboarding` |
| 4     | Services Settings | Integrate with Seerr, Radarr, Sonarr, and other services     | `/admin/settings/services`   |
| 5     | Manage Users      | View and manage users, permissions, and library access       | `/admin/settings`            |

### Customizing Admin Onboarding

Admin welcome slides and tutorial steps can be customized using the same editor interface as user onboarding. The onboarding settings page separates content by type — switch between **User** and **Admin** content using the content type selector.

All the same features are available: custom images, video embeds, custom HTML, drag-and-drop reordering, and preview mode.

### Resetting Admin Onboarding

To trigger the admin onboarding again:

1. Navigate to **Settings → Onboarding**
2. Use the **Reset** option to reset admin onboarding
3. The admin welcome modal and tutorial will be shown again on next page load

---

## API Reference

The onboarding system exposes several API endpoints:

| Endpoint                                 | Method | Description                          |
| ---------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/settings/onboarding`            | GET    | Get onboarding settings              |
| `/api/v1/settings/onboarding`            | POST   | Update onboarding settings           |
| `/api/v1/settings/onboarding/welcome`    | GET    | Get all welcome content (user/admin) |
| `/api/v1/settings/onboarding/tutorial`   | GET    | Get all tutorial steps               |
| `/api/v1/user/{userId}/onboarding`       | GET    | Get user's onboarding data           |
| `/api/v1/user/{userId}/onboarding/reset` | POST   | Reset user's onboarding progress     |

See the [API Documentation](https://api-docs.streamarr.dev) for complete details.
