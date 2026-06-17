'use client';
import DiscordIcon from '@app/assets/extlogos/discord.svg';
import GotifyIcon from '@app/assets/extlogos/gotify.svg';
import NtfyIcon from '@app/assets/extlogos/ntfy.svg';
import PushbulletIcon from '@app/assets/extlogos/pushbullet.svg';
import PushoverIcon from '@app/assets/extlogos/pushover.svg';
import SlackIcon from '@app/assets/extlogos/slack.svg';
import TelegramIcon from '@app/assets/extlogos/telegram.svg';
import AdminTabs from '@app/components/Common/AdminTabs';
import {
  BellAlertIcon,
  BoltIcon,
  CloudIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
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
          <EnvelopeIcon className="mr-1 mb-0.5 inline-flex size-4" />{' '}
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
          <CloudIcon className="mr-1 mb-0.5 inline-flex size-4" />{' '}
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
          <BellAlertIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <DiscordIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <GotifyIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <NtfyIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <PushbulletIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <PushoverIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <SlackIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <TelegramIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
          <BoltIcon className="mr-1 mb-0.5 inline-flex size-4" />
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
