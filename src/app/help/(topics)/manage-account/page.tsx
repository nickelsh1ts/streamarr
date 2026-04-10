'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TopicsPage from '@app/components/Help/TopicsPage';
import useSettings from '@app/hooks/useSettings';
import { useIntl } from 'react-intl';

const ManageAccount = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const RelatedArticles = [
    {
      href: 'manage-account/account-settings',
      text: intl.formatMessage(
        {
          id: 'help.manageAccount.accountSettings',
          defaultMessage: 'Account settings & preferences',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'manage-account/password-reset',
      text: intl.formatMessage({
        id: 'help.manageAccount.passwordReset',
        defaultMessage: 'Password & security',
      }),
    },
    {
      href: '/watch/web/index.html#!/settings/account',
      text: intl.formatMessage({
        id: 'help.manageAccount.plexAccountPrefs',
        defaultMessage: 'Manage Plex account preferences',
      }),
    },
    {
      href: '/watch/web/index.html#!/settings/web/general',
      text: intl.formatMessage({
        id: 'help.manageAccount.plexWebPrefs',
        defaultMessage: 'Manage Plex web preferences',
      }),
    },
    {
      href: '/watch/web/index.html#!/settings/online-media-sources',
      text: intl.formatMessage({
        id: 'help.manageAccount.onlineMedia',
        defaultMessage: 'Online media sources',
      }),
    },
    {
      href: 'manage-account/notifications',
      text: intl.formatMessage({
        id: 'help.manageAccount.notifications',
        defaultMessage: 'Managing your notifications',
      }),
    },
  ];

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/manage-account"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={intl.formatMessage({
          id: 'help.manageAccount.breadcrumb',
          defaultMessage: 'Manage Account',
        })}
        print={false}
      />
      <TopicsPage
        heading={intl.formatMessage(
          {
            id: 'help.manageAccount.heading',
            defaultMessage:
              'Topics related to managing your {appTitle} account',
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        subheading={intl.formatMessage(
          {
            id: 'help.manageAccount.subheading',
            defaultMessage:
              'Learn how to manage your account settings, preferences, and personalise your {appTitle} experience.',
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        links={RelatedArticles}
      />
    </section>
  );
};

export default ManageAccount;
