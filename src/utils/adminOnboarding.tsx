'use client';
import type {
  TutorialStepResponse,
  WelcomeContentResponse,
} from '@server/interfaces/api/onboardingInterfaces';
import { WelcomeContentType } from '@server/entity/WelcomeContent';
import { TutorialMode, TooltipPosition } from '@server/entity/TutorialStep';
import {
  BellAlertIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import type { IntlShape } from 'react-intl';
import React from 'react';
import Image from 'next/image';

export interface AdminWelcomeSlide extends WelcomeContentResponse {
  icon?: React.ReactNode;
}

export function getAdminWelcomeSlides(intl: IntlShape): AdminWelcomeSlide[] {
  const now = new Date().toISOString();

  return [
    {
      id: -1,
      type: WelcomeContentType.ADMIN,
      order: 0,
      enabled: true,
      title: intl.formatMessage({
        id: 'adminOnboarding.welcome.title',
        defaultMessage: 'Welcome to Streamarr!',
      }),
      description: intl.formatMessage({
        id: 'adminOnboarding.welcome.description',
        defaultMessage:
          "Streamarr is your all-in-one media server management solution. Let's get you set up with some quick tips to get started and make the most of your new server.",
      }),
      videoAutoplay: false,
      createdAt: now,
      updatedAt: now,
      icon: (
        <span className="flex justify-center">
          <Image
            src={'/streamarr-logo-512x512.png'}
            alt="logo"
            width={96}
            height={96}
            unoptimized
            className="w-24 h-24 object-contain"
          />
        </span>
      ),
    },
    {
      id: -2,
      type: WelcomeContentType.ADMIN,
      order: 1,
      enabled: true,
      title: intl.formatMessage({
        id: 'adminOnboarding.users.title',
        defaultMessage: 'Manage Your Users',
      }),
      description: intl.formatMessage({
        id: 'adminOnboarding.users.description',
        defaultMessage:
          'Control who has access to your Plex media. You can set defaults, import existing users, manage permissions, set quotas, and change library access from the User settings.',
      }),
      videoAutoplay: false,
      createdAt: now,
      updatedAt: now,
      icon: <UserGroupIcon className="h-24 w-24 text-primary mx-auto" />,
    },
    {
      id: -3,
      type: WelcomeContentType.ADMIN,
      order: 2,
      enabled: true,
      title: intl.formatMessage({
        id: 'adminOnboarding.services.title',
        defaultMessage: 'Configure Your Services',
      }),
      description: intl.formatMessage({
        id: 'adminOnboarding.services.description',
        defaultMessage:
          'Expand the functionality of your server by integrating with external services. You can set up Radarr and Sonarr for automated downloads, connect to download clients and other integrations in the Services settings.',
      }),
      videoAutoplay: false,
      createdAt: now,
      updatedAt: now,
      icon: <Cog6ToothIcon className="h-24 w-24 text-primary mx-auto" />,
    },
    {
      id: -4,
      type: WelcomeContentType.ADMIN,
      order: 3,
      enabled: true,
      title: intl.formatMessage({
        id: 'adminOnboarding.notifications.title',
        defaultMessage: 'Set Up Notifications',
      }),
      description: intl.formatMessage({
        id: 'adminOnboarding.notifications.description',
        defaultMessage:
          "Keep your users informed with email notifications, web push alerts, and in-app messages. Configure these in the Notifications settings when you're ready.",
      }),
      videoAutoplay: false,
      createdAt: now,
      updatedAt: now,
      icon: <BellAlertIcon className="h-24 w-24 text-primary mx-auto" />,
    },
  ];
}

export function getAdminTutorialSteps(intl: IntlShape): TutorialStepResponse[] {
  const now = new Date().toISOString();

  return [
    {
      id: -1,
      order: 0,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="admin-tabs"]',
      title: intl.formatMessage({
        id: 'adminTutorial.tabs.title',
        defaultMessage: 'Admin Navigation',
      }),
      description: intl.formatMessage({
        id: 'adminTutorial.tabs.description',
        defaultMessage:
          'Use these tabs to navigate between different admin features. Settings, Users, and your enabled media services are all accessible from here.',
      }),
      tooltipPosition: TooltipPosition.BOTTOM,
      route: '/admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: -2,
      order: 1,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="general-settings-tab"]',
      title: intl.formatMessage({
        id: 'adminTutorial.generalSettings.title',
        defaultMessage: 'General Settings',
      }),
      description: intl.formatMessage({
        id: 'adminTutorial.generalSettings.description',
        defaultMessage:
          'General settings are where you can configure your server-wide preferences and customize the user experience.',
      }),
      tooltipPosition: TooltipPosition.BOTTOM,
      route: '/admin/settings',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: -3,
      order: 2,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="admin-settings-onboarding"]',
      title: intl.formatMessage({
        id: 'adminTutorial.onboarding.title',
        defaultMessage: 'User Onboarding',
      }),
      description: intl.formatMessage({
        id: 'adminTutorial.onboarding.description',
        defaultMessage:
          'Customize the welcome experience for new users. Create welcome slides, tutorial steps, and control how users are introduced to your server.',
      }),
      tooltipPosition: TooltipPosition.BOTTOM,
      route: '/admin/settings/onboarding',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: -4,
      order: 3,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="services-settings-tab"]',
      title: intl.formatMessage({
        id: 'adminTutorial.servicesSettings.title',
        defaultMessage: 'Services Settings',
      }),
      description: intl.formatMessage({
        id: 'adminTutorial.servicesSettings.description',
        defaultMessage:
          "Integrate with external services to expand your server's capabilities. Configure Seerr, Radarr, Sonarr, and other integrations here.",
      }),
      tooltipPosition: TooltipPosition.BOTTOM,
      route: '/admin/settings/services',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: -5,
      order: 4,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="admin-users-tab"]',
      title: intl.formatMessage({
        id: 'adminTutorial.manageUsers.title',
        defaultMessage: 'Manage Users',
      }),
      description: intl.formatMessage({
        id: 'adminTutorial.manageUsers.description',
        defaultMessage:
          'View and manage your users, update their permissions, and control their access to your media libraries.',
      }),
      tooltipPosition: TooltipPosition.BOTTOM,
      route: '/admin/settings',
      createdAt: now,
      updatedAt: now,
    },
  ];
}
