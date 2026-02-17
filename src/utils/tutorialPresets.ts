/**
 * Tutorial Presets Registry
 *
 * Defines preset tutorial target selectors using data-tutorial attributes.
 */

import type { LayoutContext } from '@app/hooks/useBreakpoint';

export interface TutorialPreset {
  id: string;
  name: string;
  selector: string;
  description: string;
  route?: string;
  layouts?: LayoutContext[];
}

export const TUTORIAL_PRESETS: TutorialPreset[] = [
  // Navigation - Desktop/Tablet Sidebar
  {
    id: 'sidebar-nav',
    name: 'Sidebar Navigation',
    selector: '[data-tutorial="sidebar-nav"]',
    description: 'Main sidebar navigation menu (tablet)',
    route: undefined,
    layouts: ['tablet'],
  },
  {
    id: 'sidebar-menu',
    name: 'Sidebar Menu',
    selector: '[data-tutorial="sidebar-menu"]',
    description: 'Sidebar menu content area',
    route: undefined,
    layouts: ['tablet', 'desktop'],
  },

  // Navigation - Mobile Bottom Nav
  {
    id: 'mobile-nav',
    name: 'Mobile Navigation',
    selector: '[data-tutorial="mobile-nav"]',
    description: 'Bottom navigation bar (mobile only)',
    route: undefined,
    layouts: ['mobile'],
  },
  {
    id: 'mobile-menu-toggle',
    name: 'Mobile Menu Toggle',
    selector: '[data-tutorial="mobile-menu-toggle"]',
    description: 'Button to open mobile menu',
    route: undefined,
    layouts: ['mobile'],
  },

  // Navigation Links
  {
    id: 'nav-home',
    name: 'Home Link',
    selector: '[data-tutorial="nav-home"]',
    description: 'Home/Watch navigation link',
    route: undefined,
  },
  {
    id: 'nav-discover',
    name: 'Discover Link',
    selector: '[data-tutorial="nav-discover"]',
    description: 'Discover/News navigation link',
    route: undefined,
  },
  {
    id: 'nav-watchlist',
    name: 'Watchlist Link',
    selector: '[data-tutorial="nav-watchlist"]',
    description: 'Watchlist navigation link',
    route: undefined,
  },
  {
    id: 'nav-invites',
    name: 'Invites Link',
    selector: '[data-tutorial="nav-invites"]',
    description: 'Invites page navigation link',
    route: undefined,
  },
  {
    id: 'nav-schedule',
    name: 'Schedule Link',
    selector: '[data-tutorial="nav-schedule"]',
    description: 'Schedule/Calendar navigation link',
    route: undefined,
  },
  {
    id: 'nav-request',
    name: 'Request Link',
    selector: '[data-tutorial="nav-request"]',
    description: 'Request page navigation link',
    route: undefined,
  },

  // Header
  {
    id: 'main-header',
    name: 'Main Header',
    selector: '[data-tutorial="main-header"]',
    description: 'Site header bar',
    route: undefined,
  },
  {
    id: 'logo',
    name: 'Logo',
    selector: '[data-tutorial="logo"]',
    description: 'Application logo',
    route: undefined,
  },

  // User
  {
    id: 'user-dropdown',
    name: 'User Menu',
    selector: '[data-tutorial="user-dropdown"]',
    description: 'User profile dropdown menu',
    route: undefined,
  },
  {
    id: 'user-profile-btn',
    name: 'User Profile Button',
    selector: '[data-tutorial="user-profile-btn"]',
    description: 'Button to open user dropdown',
    route: undefined,
  },

  // Notifications
  {
    id: 'notifications-btn',
    name: 'Notifications',
    selector: '[data-tutorial="notifications-btn"]',
    description: 'Notification bell/indicator',
    route: undefined,
  },

  // Invites Page
  {
    id: 'create-invite-btn',
    name: 'Create Invite Button',
    selector: '[data-tutorial="create-invite-btn"]',
    description: 'Button to create a new invite',
    route: '/invites',
  },
  {
    id: 'invite-list',
    name: 'Invite List',
    selector: '[data-tutorial="invite-list"]',
    description: 'List of invites',
    route: '/invites',
  },

  // Admin
  {
    id: 'admin-tabs',
    name: 'Admin Navigation Tabs',
    selector: '[data-tutorial="admin-tabs"]',
    description: 'Admin settings navigation tabs',
    route: '/admin',
  },

  // Library
  {
    id: 'library-menu',
    name: 'Library Menu',
    selector: '[data-tutorial="library-menu"]',
    description: 'Library selection menu',
    route: undefined,
  },
];
