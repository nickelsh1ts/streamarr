'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const SignUpDisabledContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="membership">
        <FormattedMessage
          id="help.becomeMember.closedTitle"
          defaultMessage="Membership is currently closed"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.becomeMember.closedDesc"
          defaultMessage="{appTitle} is not currently accepting new sign-ups. If you would like to join, please reach out to an existing member or the admin team to enquire about availability."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      {currentSettings.supportEmail && (
        <p className="my-4">
          <FormattedMessage
            id="help.becomeMember.contactAdmin"
            defaultMessage="You can contact the admin team at {email} to enquire about membership."
            values={{
              email: (
                <a
                  href={`mailto:${currentSettings.supportEmail}`}
                  className="link-primary font-bold"
                >
                  {currentSettings.supportEmail}
                </a>
              ),
            }}
          />
        </p>
      )}
    </>
  );
};

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="getting-an-invite">
        <FormattedMessage
          id="help.becomeMember.gettingInviteTitle"
          defaultMessage="Getting an invite"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.becomeMember.gettingInviteDesc"
          defaultMessage="{appTitle} is a private, invite-only streaming service. To join, you will need an invite code from an existing member. Reach out to a friend who is already a member and ask them to send you an invite."
          values={{
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
          id="help.becomeMember.inviteHelpLink"
          defaultMessage="Existing members can learn how to send invites in the {link} help article."
          values={{
            link: (
              <Link
                href="/help/watching-streamarr/invite-a-friend"
                className="link-primary font-bold"
              >
                <FormattedMessage
                  id="help.becomeMember.inviteAFriendLink"
                  defaultMessage="Invite a friend"
                />
              </Link>
            ),
          }}
        />
      </p>
      <div className="mt-5 font-extrabold" id="joining">
        <FormattedMessage
          id="help.becomeMember.joinTitle"
          defaultMessage="How to join {appTitle}:"
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.becomeMember.joinStep1"
            defaultMessage="Navigate to the {appTitle} sign-up page"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.becomeMember.joinStep2"
            defaultMessage="Enter the invite code you received and select the {button} button"
            values={{
              button: (
                <span className="font-bold">
                  <FormattedMessage
                    id="help.becomeMember.letsGetStarted"
                    defaultMessage="Let's Get Started"
                  />
                </span>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.becomeMember.joinStep3"
            defaultMessage="Sign in with your {plexLogo} account — if you don't have one, you can create one during this step"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.becomeMember.joinStep4"
            defaultMessage="Personalise your account — choose a display name, language, and configure your notification preferences"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.becomeMember.joinStep5"
            defaultMessage="Complete registration — your {plexLogo} libraries and access will be set up automatically"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.becomeMember.plexRequired"
            defaultMessage="A {plexLogo} account is required to access {appTitle} services"
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
        {currentSettings.localLogin && (
          <li>
            <FormattedMessage
              id="help.becomeMember.localLoginNote"
              defaultMessage="You can also set a local password during sign-up for an alternative way to sign in"
            />
          </li>
        )}
        {currentSettings.enableTrialPeriod && (
          <li>
            <FormattedMessage
              id="help.becomeMember.trialNote"
              defaultMessage="Once you have successfully joined {appTitle}, you may not invite your own friends until the {days}-day trial period has ended"
              values={{
                appTitle: (
                  <span className="text-primary font-bold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
                days: currentSettings.trialPeriodDays,
              }}
            />
          </li>
        )}
      </ul>
    </>
  );
};

const BecomeMember = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const anchorsSignUpEnabled = [
    {
      href: '#getting-an-invite',
      title: intl.formatMessage({
        id: 'help.becomeMember.gettingInviteAnchor',
        defaultMessage: 'Getting an Invite',
      }),
    },
    {
      href: '#joining',
      title: intl.formatMessage(
        {
          id: 'help.becomeMember.joiningAnchor',
          defaultMessage: 'Joining {appTitle}',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
  ];

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/become-a-member"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.gettingStarted.breadcrumb', defaultMessage: 'Getting Started' })},${intl.formatMessage({ id: 'help.becomeMember.breadcrumb', defaultMessage: 'How to Become a Member' })}`}
      />
      <HelpCard
        anchors={
          currentSettings.enableSignUp ? anchorsSignUpEnabled : undefined
        }
        content={
          currentSettings.enableSignUp ? (
            <HelpContent />
          ) : (
            <SignUpDisabledContent />
          )
        }
        heading={intl.formatMessage(
          {
            id: 'help.becomeMember.heading',
            defaultMessage: 'How to become a member of {appTitle}',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        subheading={
          currentSettings.enableSignUp
            ? intl.formatMessage(
                {
                  id: 'help.becomeMember.subheading',
                  defaultMessage:
                    '{appTitle} is a private, invite-only streaming service. To become a member, you will need an invite code from an existing member.',
                },
                {
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }
              )
            : intl.formatMessage(
                {
                  id: 'help.becomeMember.subheadingClosed',
                  defaultMessage:
                    '{appTitle} is a private streaming service that is not currently accepting new sign-ups.',
                },
                {
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }
              )
        }
      />
    </section>
  );
};

export default BecomeMember;
