'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import type { SeerrNotificationsResponse } from '@server/interfaces/api/seerrInterfaces';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const HelpContent = () => {
  const { currentSettings } = useSettings();
  const useSeerrNotifications = () => {
    const { data, error, isLoading } = useSWR<SeerrNotificationsResponse>(
      currentSettings.seerrEnabled
        ? '/api/v1/settings/public/seerr/notifications'
        : null,
      {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }
    );

    return {
      notifications: data,
      error,
      isLoading,
    };
  };
  const { notifications } = useSeerrNotifications();

  const enabledAgents = notifications?.enabledAgents ?? [];

  return (
    <>
      <div className="mt-5 font-extrabold" id="streamarr-notifications">
        <FormattedMessage
          id="help.notifications.streamarrTitle"
          defaultMessage="{appTitle} Notifications"
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.notifications.streamarrDesc"
          defaultMessage="{appTitle} can send you notifications to keep you informed about your account activity, invite updates, and important announcements. These are managed by the {appTitle} admin."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <span className="font-bold">
            <FormattedMessage
              id="help.notifications.inApp"
              defaultMessage="In-App"
            />
          </span>{' '}
          —{' '}
          <FormattedMessage
            id="help.notifications.inAppDesc"
            defaultMessage="Notifications appear directly within {appTitle} via the bell icon in the navigation bar."
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
        {currentSettings.emailEnabled && (
          <li>
            <span className="font-bold">
              <FormattedMessage
                id="help.notifications.email"
                defaultMessage="Email"
              />
            </span>{' '}
            —{' '}
            <FormattedMessage
              id="help.notifications.emailDesc"
              defaultMessage="Important updates may be sent to the email address associated with your account."
            />
          </li>
        )}
        {currentSettings.enablePushRegistration && (
          <li>
            <span className="font-bold">
              <FormattedMessage
                id="help.notifications.push"
                defaultMessage="Push Notifications"
              />
            </span>{' '}
            —{' '}
            <FormattedMessage
              id="help.notifications.pushDesc"
              defaultMessage="If you have installed the {appTitle} app (PWA), you can receive browser push notifications even when the app is not open."
              values={{
                appTitle: (
                  <span className="text-primary font-bold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </li>
        )}
      </ul>
      {currentSettings.seerrEnabled && (
        <>
          <div className="mt-5 font-extrabold" id="seerr-notifications">
            <FormattedMessage
              id="help.notifications.seerrTitle"
              defaultMessage="Seerr Request Notifications"
            />
          </div>
          <p className="my-4">
            <FormattedMessage
              id="help.notifications.seerrDesc"
              defaultMessage="When you make media requests through Seerr, you can receive notifications about the status of your requests — such as when they are approved, declined, or when the media becomes available."
            />
          </p>
          <ul className="list list-disc ms-14 my-4">
            {enabledAgents.includes('email') && (
              <li>
                <span className="font-bold">
                  <FormattedMessage
                    id="help.notifications.seerrEmail"
                    defaultMessage="Email"
                  />
                </span>{' '}
                —{' '}
                <FormattedMessage
                  id="help.notifications.seerrEmailDesc"
                  defaultMessage="Email notifications for request status changes."
                />
              </li>
            )}
            {enabledAgents.includes('webpush') && (
              <li>
                <span className="font-bold">
                  <FormattedMessage
                    id="help.notifications.seerrPush"
                    defaultMessage="Push Notifications"
                  />
                </span>{' '}
                —{' '}
                <FormattedMessage
                  id="help.notifications.seerrPushDesc"
                  defaultMessage="Browser push notifications for request updates."
                />
              </li>
            )}
            {enabledAgents.includes('discord') && (
              <li>
                <span className="font-bold">
                  <FormattedMessage
                    id="help.notifications.seerrDiscord"
                    defaultMessage="Discord"
                  />
                </span>{' '}
                —{' '}
                <FormattedMessage
                  id="help.notifications.seerrDiscordDesc"
                  defaultMessage="Notifications sent to a Discord channel via webhook."
                />
              </li>
            )}
            {enabledAgents.includes('slack') && (
              <li>
                <span className="font-bold">
                  <FormattedMessage
                    id="help.notifications.seerrSlack"
                    defaultMessage="Slack"
                  />
                </span>{' '}
                —{' '}
                <FormattedMessage
                  id="help.notifications.seerrSlackDesc"
                  defaultMessage="Notifications sent to a Slack channel via webhook."
                />
              </li>
            )}
            {enabledAgents.includes('telegram') && (
              <li>
                <span className="font-bold">
                  <FormattedMessage
                    id="help.notifications.seerrTelegram"
                    defaultMessage="Telegram"
                  />
                </span>{' '}
                —{' '}
                <FormattedMessage
                  id="help.notifications.seerrTelegramDesc"
                  defaultMessage="Notifications sent via Telegram bot."
                />
              </li>
            )}
            {enabledAgents.includes('pushover') && (
              <li>
                <span className="font-bold">
                  <FormattedMessage
                    id="help.notifications.seerrPushover"
                    defaultMessage="Pushover"
                  />
                </span>{' '}
                —{' '}
                <FormattedMessage
                  id="help.notifications.seerrPushoverDesc"
                  defaultMessage="Notifications sent via the Pushover service."
                />
              </li>
            )}
          </ul>
        </>
      )}
      <div className="mt-5 font-extrabold" id="managing-notifications">
        <FormattedMessage
          id="help.notifications.managingTitle"
          defaultMessage="Managing Your Notifications"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.notifications.managingDesc"
          defaultMessage="You can manage your {appTitle} notification preferences from your profile settings. Seerr notification preferences can be managed from within the Seerr app under your user settings."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      {currentSettings.enablePushRegistration && (
        <p className="italic text-sm my-4">
          <span className="text-info font-bold">
            <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
          </span>
          :{' '}
          <FormattedMessage
            id="help.notifications.pushTip"
            defaultMessage="For push notifications to work, you need to grant notification permissions in your browser when prompted."
          />
        </p>
      )}
    </>
  );
};

const Notifications = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const anchors = [
    {
      href: '#streamarr-notifications',
      title: 'Streamarr Notifications',
    },
    ...(currentSettings.seerrEnabled
      ? [{ href: '#seerr-notifications', title: 'Seerr Notifications' }]
      : []),
    { href: '#managing-notifications', title: 'Managing Notifications' },
  ];

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/manage-account/notifications"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.manageAccount.breadcrumb', defaultMessage: 'Manage Account' })},${intl.formatMessage({ id: 'help.notifications.breadcrumb', defaultMessage: 'Managing Your Notifications' })}`}
      />
      <HelpCard
        heading={intl.formatMessage({
          id: 'help.notifications.heading',
          defaultMessage: 'Managing Your Notifications',
        })}
        subheading={intl.formatMessage(
          {
            id: 'help.notifications.subheading',
            defaultMessage:
              'Stay informed about your {appTitle} account activity and media request updates through various notification channels.',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default Notifications;
