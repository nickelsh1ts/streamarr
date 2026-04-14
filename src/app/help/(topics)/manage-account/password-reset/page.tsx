'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="reset-password">
        <FormattedMessage
          id="help.passwordReset.resetTitle"
          defaultMessage="Resetting Your Password"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.passwordReset.resetDesc"
          defaultMessage="Your {appTitle} account uses your {plexLogo} credentials for authentication. To reset your password, you will need to do so through {plexLogo}."
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
            id="help.passwordReset.step1"
            defaultMessage="Visit the {link} page"
            values={{
              link: (
                <Link
                  href="https://app.plex.tv/auth#?resetPassword"
                  target="_blank"
                  rel="noreferrer"
                  className="link-primary font-bold"
                >
                  <PlexLogo className="inline-block size-9" />{' '}
                  <FormattedMessage
                    id="help.passwordReset.plexResetLink"
                    defaultMessage="password reset"
                  />
                </Link>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.passwordReset.step2"
            defaultMessage="Enter the email address associated with your account"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.passwordReset.step3"
            defaultMessage="Follow the instructions in the password reset email"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.passwordReset.step4"
            defaultMessage="Once your {plexLogo} password has been updated, you can sign in to {appTitle} with your new credentials"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
      </ul>
      {currentSettings.localLogin && (
        <>
          <div className="mt-5 font-extrabold" id="local-password">
            <FormattedMessage
              id="help.passwordReset.localTitle"
              defaultMessage="Local Account Password"
            />
          </div>
          <p className="my-4">
            <FormattedMessage
              id="help.passwordReset.localDesc"
              defaultMessage="If you set a local password during sign-up, you can update it from your {link}. Your local password is separate from your {plexLogo} password and is used only for signing in to {appTitle} directly."
              values={{
                plexLogo: <PlexLogo className="inline-block size-9" />,
                appTitle: (
                  <span className="text-primary font-bold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
                link: (
                  <Link href="/profile" className="link-primary font-bold">
                    <FormattedMessage
                      id="help.passwordReset.profileLink"
                      defaultMessage="profile settings"
                    />
                  </Link>
                ),
              }}
            />
          </p>
        </>
      )}
      <div className="mt-5 font-extrabold" id="security-tips">
        <FormattedMessage
          id="help.passwordReset.securityTitle"
          defaultMessage="Security Tips"
        />
      </div>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.passwordReset.securityTip1"
            defaultMessage="Use a strong, unique password that you don't use on other services"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.passwordReset.securityTip2"
            defaultMessage="Enable two-factor authentication (2FA) on your {plexLogo} account for extra security"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.passwordReset.securityTip3"
            defaultMessage="Never share your password or invite codes publicly"
          />
        </li>
      </ul>
    </>
  );
};

const PasswordReset = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const anchors = [
    { href: '#reset-password', title: 'Resetting Your Password' },
    ...(currentSettings.localLogin
      ? [{ href: '#local-password', title: 'Local Account Password' }]
      : []),
    { href: '#security-tips', title: 'Security Tips' },
  ];

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/manage-account/password-reset"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.manageAccount.breadcrumb', defaultMessage: 'Manage Account' })},${intl.formatMessage({ id: 'help.passwordReset.breadcrumb', defaultMessage: 'Password & Security' })}`}
      />
      <HelpCard
        heading={intl.formatMessage({
          id: 'help.passwordReset.heading',
          defaultMessage: 'Password & Security',
        })}
        subheading={intl.formatMessage(
          {
            id: 'help.passwordReset.subheading',
            defaultMessage:
              'Learn how to reset your password and keep your {appTitle} account secure.',
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

export default PasswordReset;
