'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import PlexLogo from '@app/assets/services/plex_dark.svg';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="profile">
        <FormattedMessage
          id="help.accountSettings.profileTitle"
          defaultMessage="Your Profile"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.accountSettings.profileDesc"
          defaultMessage="Your profile page in {appTitle} shows your account information and activity. You can access it by clicking on your avatar or username in the navigation bar."
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
          <FormattedMessage
            id="help.accountSettings.viewDetails"
            defaultMessage="View your account details and membership status"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.accountSettings.recentActivity"
            defaultMessage="See your recent activity and watch history"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.accountSettings.notifPrefs"
            defaultMessage="Access your notification preferences"
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="display-settings">
        <FormattedMessage
          id="help.accountSettings.displayTitle"
          defaultMessage="Display Settings"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.accountSettings.displayDesc"
          defaultMessage="You can customize how {appTitle} looks and behaves from your profile settings."
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
              id="help.accountSettings.language"
              defaultMessage="Language"
            />
          </span>{' '}
          —{' '}
          <FormattedMessage
            id="help.accountSettings.languageDesc"
            defaultMessage="Change the display language of the {appTitle} interface"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="notification-settings">
        <FormattedMessage
          id="help.accountSettings.notifTitle"
          defaultMessage="Notification Preferences"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.accountSettings.notifDesc"
          defaultMessage="Control which notifications you receive and how they are delivered. You can enable or disable individual notification channels from your profile settings."
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.accountSettings.toggleNotifs"
            defaultMessage="Toggle in-app, email, and push notifications independently"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.accountSettings.seerrNotifs"
            defaultMessage="Seerr request notifications are managed separately within the Seerr app"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.accountSettings.emailTip"
          defaultMessage="Keep your email address up to date to ensure you receive important account notifications."
        />
      </p>
      <div className="mt-5 font-extrabold" id="plex-account">
        <FormattedMessage
          id="help.accountSettings.plexAccountTitle"
          defaultMessage="{plexLogo} Account Preferences"
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.accountSettings.plexAccountDesc"
          defaultMessage="Some settings are managed directly through your {plexLogo} account. You can access these via the {appTitle} Watch portal without leaving the app."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <Link
            href="/watch/web/index.html#!/settings/account"
            className="link-primary font-bold"
          >
            <FormattedMessage
              id="help.accountSettings.plexAccountPrefs"
              defaultMessage="Account preferences"
            />
          </Link>{' '}
          —{' '}
          <FormattedMessage
            id="help.accountSettings.plexAccountPrefsDesc"
            defaultMessage="Manage your {plexLogo} username, email, password, and account details"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <Link
            href="/watch/web/index.html#!/settings/web/general"
            className="link-primary font-bold"
          >
            <FormattedMessage
              id="help.accountSettings.plexWebPrefs"
              defaultMessage="Web preferences"
            />
          </Link>{' '}
          —{' '}
          <FormattedMessage
            id="help.accountSettings.plexWebPrefsDesc"
            defaultMessage="Configure playback quality, subtitles, and other web player settings"
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="online-media">
        <FormattedMessage
          id="help.accountSettings.onlineMediaTitle"
          defaultMessage="Online Media Sources"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.accountSettings.onlineMediaDesc"
          defaultMessage="By default, {plexLogo} includes free content from its own streaming service (Live TV, Movies & Shows, Music). If you prefer to only see {appTitle} content, you can disable these sources."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.accountSettings.onlineMediaStep1"
            defaultMessage="Navigate to {link}"
            values={{
              link: (
                <Link
                  href="/watch/web/index.html#!/settings/online-media-sources"
                  className="link-primary font-bold"
                >
                  <FormattedMessage
                    id="help.accountSettings.onlineMediaLink"
                    defaultMessage="Online Media Sources"
                  />
                </Link>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.accountSettings.onlineMediaStep2"
            defaultMessage="Toggle off Live TV, Movies & TV, and Music as desired"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.accountSettings.onlineMediaStep3"
            defaultMessage="Your {plexLogo} home screen will now only show {appTitle} content"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.accountSettings.discoveryTip"
          defaultMessage="You can also adjust Discovery preferences from the same settings area. We recommend keeping the defaults unless you have a specific preference."
        />
      </p>
    </>
  );
};

const anchors = [
  { href: '#profile', title: 'Your Profile' },
  { href: '#display-settings', title: 'Display Settings' },
  { href: '#notification-settings', title: 'Notification Preferences' },
  { href: '#plex-account', title: 'Plex Account Preferences' },
  { href: '#online-media', title: 'Online Media Sources' },
];

const AccountSettings = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/manage-account/account-settings"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.manageAccount.breadcrumb', defaultMessage: 'Manage Account' })},${intl.formatMessage({ id: 'help.accountSettings.breadcrumb', defaultMessage: 'Account Settings & Preferences' })}`}
      />
      <HelpCard
        heading={intl.formatMessage({
          id: 'help.accountSettings.heading',
          defaultMessage: 'Account Settings & Preferences',
        })}
        subheading={intl.formatMessage(
          {
            id: 'help.accountSettings.subheading',
            defaultMessage:
              'Manage your {appTitle} profile, display preferences, notification settings, and {plexLogo} account options.',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }
        )}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default AccountSettings;
