'use client';
import AdminTabs from '@app/components/Common/AdminTabs';
import {
  BoltIcon,
  EnvelopeIcon,
  CloudIcon,
  BellAlertIcon,
} from '@heroicons/react/24/solid';
import DiscordIcon from '@app/assets/extlogos/discord.svg';
import GotifyIcon from '@app/assets/extlogos/gotify.svg';
import NtfyIcon from '@app/assets/extlogos/ntfy.svg';
import PushbulletIcon from '@app/assets/extlogos/pushbullet.svg';
import PushoverIcon from '@app/assets/extlogos/pushover.svg';
import SlackIcon from '@app/assets/extlogos/slack.svg';
import TelegramIcon from '@app/assets/extlogos/telegram.svg';
import { FormattedMessage } from 'react-intl';

type NotificationsLayoutProps = {
  children: React.ReactNode;
};

const NotificationsLayout = ({ children }: NotificationsLayoutProps) => {
  const notificationTabs = [
    {
      text: 'Email',
      content: (
        <>
          <EnvelopeIcon className="size-4 inline-flex mb-0.5 mr-1" />{' '}
          <FormattedMessage id="common.email" defaultMessage="Email" />
        </>
      ),
      route: '/admin/settings/notifications/email',
      regex: /^\/admin\/settings\/notifications(\/email\/?(.*)?)?$/,
    },
    {
      text: 'Web Push',
      content: (
        <>
          <CloudIcon className="size-4 inline-flex mb-0.5 mr-1" />{' '}
          <FormattedMessage id="common.webPush" defaultMessage="Web Push" />
        </>
      ),
      route: '/admin/settings/notifications/webpush',
      regex: /^\/admin\/settings\/notifications\/webpush\/?/,
    },
    {
      text: 'In-App',
      content: (
        <>
          <BellAlertIcon className="size-4 inline-flex mb-0.5 mr-1" />
          <FormattedMessage id="common.inApp" defaultMessage="In-App" />
        </>
      ),
      route: '/admin/settings/notifications/inapp',
      regex: /^\/admin\/settings\/notifications\/inapp\/?/,
    },
    {
      text: 'Discord',
      content: (
        <>
          <DiscordIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Discord
        </>
      ),
      route: '/admin/settings/notifications/discord',
      regex: /^\/admin\/settings\/notifications\/discord\/?/,
    },
    {
      text: 'Gotify',
      content: (
        <>
          <GotifyIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Gotify
        </>
      ),
      route: '/admin/settings/notifications/gotify',
      regex: /^\/admin\/settings\/notifications\/gotify\/?/,
    },
    {
      text: 'ntfy',
      content: (
        <>
          <NtfyIcon className="size-4 inline-flex mb-0.5 mr-1" />
          ntfy
        </>
      ),
      route: '/admin/settings/notifications/ntfy',
      regex: /^\/admin\/settings\/notifications\/ntfy\/?/,
    },
    {
      text: 'Pushbullet',
      content: (
        <>
          <PushbulletIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Pushbullet
        </>
      ),
      route: '/admin/settings/notifications/pushbullet',
      regex: /^\/admin\/settings\/notifications\/pushbullet\/?/,
    },
    {
      text: 'Pushover',
      content: (
        <>
          <PushoverIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Pushover
        </>
      ),
      route: '/admin/settings/notifications/pushover',
      regex: /^\/admin\/settings\/notifications\/pushover\/?/,
    },
    {
      text: 'Slack',
      content: (
        <>
          <SlackIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Slack
        </>
      ),
      route: '/admin/settings/notifications/slack',
      regex: /^\/admin\/settings\/notifications\/slack\/?/,
    },
    {
      text: 'Telegram',
      content: (
        <>
          <TelegramIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Telegram
        </>
      ),
      route: '/admin/settings/notifications/telegram',
      regex: /^\/admin\/settings\/notifications\/telegram\/?/,
    },
    {
      text: 'Webhook',
      content: (
        <>
          <BoltIcon className="size-4 inline-flex mb-0.5 mr-1" />
          Webhook
        </>
      ),
      route: '/admin/settings/notifications/webhook',
      regex: /^\/admin\/settings\/notifications\/webhook\/?/,
    },
  ];

  return (
    <div className="my-6">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="notification.settings"
          defaultMessage="Notification Settings"
        />
      </h3>
      <p className="mb-5">
        <FormattedMessage
          id="settings.notifications.description"
          defaultMessage="Configure and enable notification agents."
        />
      </p>
      <AdminTabs tabType="button" AdminRoutes={notificationTabs} />
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default NotificationsLayout;
