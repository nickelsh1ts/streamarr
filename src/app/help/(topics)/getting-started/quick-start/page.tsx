'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const anchors = [
  { href: '#first', title: 'Sign Up' },
  { href: '#second', title: 'Explore Your Library' },
  { href: '#third', title: 'Customise Your Experience' },
  { href: '#last', title: 'Start Watching' },
];

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="first">
        <FormattedMessage
          id="help.quickStart.firstTitle"
          defaultMessage="Sign up"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.quickStart.firstDesc"
          defaultMessage="Once you have an invite code, head to the {appTitle} sign-up page and enter it. You'll be asked to sign in with your {plexLogo} account (or create one if you don't have one yet). After authenticating, you can personalise your account settings — choose a display name, language, and set up your notification preferences. Once complete, your {plexLogo} library access is configured automatically."
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <p className="italic text-sm my-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.quickStart.signupTip"
          defaultMessage="For a detailed walkthrough of the sign-up process, see the {link} help article."
          values={{
            link: (
              <Link
                href="/help/getting-started/become-a-member"
                className="link-primary font-bold"
              >
                <FormattedMessage
                  id="help.quickStart.becomeMemberLink"
                  defaultMessage="How to become a member"
                />
              </Link>
            ),
          }}
        />
      </p>
      <div className="mt-5 font-extrabold" id="second">
        <FormattedMessage
          id="help.quickStart.secondTitle"
          defaultMessage="Explore your library"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.quickStart.secondDesc"
          defaultMessage="After signing up, the {appTitle} libraries are automatically added to your {plexLogo} account — no need to accept any invites or pin libraries manually. Sign in to {appTitle} or the {plexLogo2} app to start browsing the available content."
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
            plexLogo2: <PlexLogo className="inline-block size-9" />,
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <p className="italic text-sm mt-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.quickStart.reorderTip"
          defaultMessage="You can reorder the libraries in your {plexLogo} app so they appear on the home page in your preferred order."
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <div className="mt-5 font-extrabold" id="third">
        <FormattedMessage
          id="help.quickStart.thirdTitle"
          defaultMessage="Customise your experience"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.quickStart.thirdDesc"
          defaultMessage="By default, {plexLogo} may show additional content from its own free streaming service alongside {appTitle} content. If you'd prefer to only see {appTitle2} content, you can disable these in your account settings."
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            appTitle2: (
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
            id="help.quickStart.disableOnlineMedia"
            defaultMessage="Navigate to Account Settings → Online Media Sources and disable Live TV, Movies & TV, and Music"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.quickStart.discoveryNote"
            defaultMessage="You can also adjust your Discovery preferences, though we recommend leaving these on their defaults"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.quickStart.settingsLink"
          defaultMessage="For more details on account settings, see the {link} help article."
          values={{
            link: (
              <Link
                href="/help/manage-account/account-settings"
                className="link-primary font-bold"
              >
                <FormattedMessage
                  id="help.quickStart.accountSettingsLink"
                  defaultMessage="Account Settings"
                />
              </Link>
            ),
          }}
        />
      </p>
      <div className="mt-5 font-extrabold" id="last">
        <FormattedMessage
          id="help.quickStart.lastTitle"
          defaultMessage="Start watching!"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.quickStart.lastDesc"
          defaultMessage="You're all set! Browse the library, download the {plexLogo} app on your devices, and start watching. {seerrNote}"
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
            seerrNote: currentSettings.seerrEnabled ? (
              <FormattedMessage
                id="help.quickStart.seerrNote"
                defaultMessage="If something is missing, use Seerr to request it."
              />
            ) : (
              ''
            ),
          }}
        />
      </p>
      {currentSettings.enableTrialPeriod && (
        <p className="italic text-sm my-4">
          <span className="text-error font-bold">
            <FormattedMessage
              id="help.common.remember"
              defaultMessage="Remember"
            />
          </span>
          :{' '}
          <FormattedMessage
            id="help.quickStart.trialNote"
            defaultMessage="You won't be able to invite friends during your {days}-day trial period."
            values={{ days: currentSettings.trialPeriodDays }}
          />
        </p>
      )}
    </>
  );
};

const QuickStart = () => {
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/quick-start"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.gettingStarted.breadcrumb', defaultMessage: 'Getting Started' })},${intl.formatMessage({ id: 'help.quickStart.breadcrumb', defaultMessage: 'Quick Start Guide' })}`}
      />
      <HelpCard
        heading={intl.formatMessage({
          id: 'help.quickStart.heading',
          defaultMessage: 'Quick Start Guide',
        })}
        subheading={intl.formatMessage({
          id: 'help.quickStart.subheading',
          defaultMessage:
            'A simple guide to getting set up and watching in minutes.',
        })}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default QuickStart;
