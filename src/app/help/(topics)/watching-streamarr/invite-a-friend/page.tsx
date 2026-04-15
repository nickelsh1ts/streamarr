'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { useUser, Permission } from '@app/hooks/useUser';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const InviteLimitsSection = () => {
  const { currentSettings } = useSettings();
  const { user, hasPermission } = useUser();

  const isAdmin =
    hasPermission(Permission.ADMIN) ||
    hasPermission(Permission.MANAGE_INVITES, { type: 'or' });

  const defaultLimit = currentSettings.defaultInviteQuotas?.quotaLimit;
  const defaultDays = currentSettings.defaultInviteQuotas?.quotaDays;
  const defaultUsage = currentSettings.defaultInviteQuotas?.quotaUsage;
  const defaultExpiryLimit =
    currentSettings.defaultInviteQuotas?.quotaExpiryLimit;
  const defaultExpiryTime =
    currentSettings.defaultInviteQuotas?.quotaExpiryTime;
  const hasDefaults = defaultLimit !== undefined && defaultLimit > 0;

  const userLimit = user?.inviteQuotaLimit;
  const userDays = user?.inviteQuotaDays;
  const hasUserQuota = userLimit !== undefined && userLimit > 0;

  const formatExpiry = (limit?: number, unit?: string) => {
    if (!limit || limit <= 0) return null;
    const unitLabel =
      unit === 'months'
        ? limit === 1
          ? 'month'
          : 'months'
        : unit === 'weeks'
          ? limit === 1
            ? 'week'
            : 'weeks'
          : limit === 1
            ? 'day'
            : 'days';
    return `${limit} ${unitLabel}`;
  };

  return (
    <>
      <div className="mt-5 font-extrabold" id="invite-limits">
        <FormattedMessage
          id="help.invites.limitsTitle"
          defaultMessage="Invite Limits"
        />
      </div>
      {isAdmin && (
        <p className="my-4">
          <FormattedMessage
            id="help.invites.adminUnlimited"
            defaultMessage="As an admin, you have unlimited invites."
          />
        </p>
      )}
      {!isAdmin && hasUserQuota ? (
        <>
          <p className="my-4">
            <FormattedMessage
              id="help.invites.userQuotaDesc"
              defaultMessage="You are limited to {limit} {limit, plural, one {invite} other {invites}}{period}."
              values={{
                limit: userLimit,
                period:
                  userDays && userDays > 0
                    ? ` every ${userDays} ${userDays === 1 ? 'day' : 'days'}`
                    : '',
              }}
            />
          </p>
          <ul className="list list-disc ms-14 my-4">
            {defaultUsage !== undefined && (
              <li>
                <FormattedMessage
                  id="help.invites.usageLimit"
                  defaultMessage="Each invite code can be used by {usage, plural, =0 {unlimited members} one {1 member} other {{usage} members}}"
                  values={{ usage: defaultUsage }}
                />
              </li>
            )}
            {defaultExpiryLimit !== undefined && (
              <li>
                <FormattedMessage
                  id="help.invites.expiryLimit"
                  defaultMessage="Invite codes {expiry}"
                  values={{
                    expiry:
                      defaultExpiryLimit > 0
                        ? `expire after ${formatExpiry(defaultExpiryLimit, defaultExpiryTime)}`
                        : 'do not expire',
                  }}
                />
              </li>
            )}
          </ul>
        </>
      ) : hasDefaults ? (
        <>
          <p className="my-4">
            <FormattedMessage
              id="help.invites.limitsQuotaDesc"
              defaultMessage="{prefix} limited to {limit} {limit, plural, one {invite} other {invites}}{period}."
              values={{
                prefix: isAdmin ? 'Regular members are' : 'Each member is',
                limit: defaultLimit,
                period:
                  defaultDays && defaultDays > 0
                    ? ` every ${defaultDays} ${defaultDays === 1 ? 'day' : 'days'}`
                    : '',
              }}
            />
          </p>
          <ul className="list list-disc ms-14 my-4">
            {defaultUsage !== undefined && (
              <li>
                <FormattedMessage
                  id="help.invites.usageLimit"
                  defaultMessage="Each invite code can be used by {usage, plural, =0 {unlimited members} one {1 member} other {{usage} members}}"
                  values={{ usage: defaultUsage }}
                />
              </li>
            )}
            {defaultExpiryLimit !== undefined && (
              <li>
                <FormattedMessage
                  id="help.invites.expiryLimit"
                  defaultMessage="Invite codes {expiry}"
                  values={{
                    expiry:
                      defaultExpiryLimit > 0
                        ? `expire after ${formatExpiry(defaultExpiryLimit, defaultExpiryTime)}`
                        : 'do not expire',
                  }}
                />
              </li>
            )}
          </ul>
        </>
      ) : !isAdmin ? (
        <p className="my-4">
          <FormattedMessage
            id="help.invites.noLimitsDesc"
            defaultMessage="There are currently no invite limits configured on {appTitle}."
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </p>
      ) : null}
      {user && (user.inviteCount ?? 0) > 0 && (
        <p className="my-4">
          <FormattedMessage
            id="help.invites.yourUsage"
            defaultMessage="You have sent {sent} {sent, plural, one {invite} other {invites}} so far ({redeemed} redeemed)."
            values={{
              sent: user.inviteCount ?? 0,
              redeemed: user.inviteCountRedeemed ?? 0,
            }}
          />
        </p>
      )}
      {currentSettings.enableTrialPeriod && (
        <p className="italic text-sm my-4">
          <span className="text-info font-bold">
            <FormattedMessage id="help.common.note" defaultMessage="Note" />
          </span>
          :{' '}
          <FormattedMessage
            id="help.invites.trialNote"
            defaultMessage="Members in a trial period may not be able to send invites until the trial has ended."
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
      <div className="mt-5 font-extrabold" id="how-invites-work">
        <FormattedMessage
          id="help.invites.howTitle"
          defaultMessage="How Invites Work"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.invites.howDesc"
          defaultMessage="{appTitle} uses an invite system to manage new members. Existing members can generate invite codes that allow friends and family to join the service."
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
            id="help.invites.generated"
            defaultMessage="Invite codes are generated from your {appTitle} dashboard"
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
            id="help.invites.singleUse"
            defaultMessage="Each invite code can only be used once and may have an expiry date"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.invites.linked"
            defaultMessage="When someone uses your invite code, they will be linked to your account as the inviting member"
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="sending-invites">
        <FormattedMessage
          id="help.invites.sendingTitle"
          defaultMessage="Sending an Invite"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.invites.step1"
            defaultMessage="Sign in to {appTitle} and navigate to the Invites section"
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
            id="help.invites.step2"
            defaultMessage="Click the button to generate a new invite code"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.invites.step3"
            defaultMessage="Share the invite code or link with the person you would like to invite"
          />
        </li>
      </ul>
      <InviteLimitsSection />
      {currentSettings.enableSignUp && (
        <>
          <div className="mt-5 font-extrabold" id="redeeming">
            <FormattedMessage
              id="help.invites.redeemTitle"
              defaultMessage="Redeeming an Invite"
            />
          </div>
          <p className="my-4">
            <FormattedMessage
              id="help.invites.redeemDesc"
              defaultMessage="If you've received an invite code or link from an existing member, head to the {appTitle} sign-up page to create your account. For a full walkthrough of the sign-up process, see {link}."
              values={{
                appTitle: (
                  <span className="text-primary font-bold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
                link: (
                  <Link
                    href="/help/getting-started/become-a-member"
                    className="link-primary font-bold"
                  >
                    <FormattedMessage
                      id="help.invites.becomeMemberLink"
                      defaultMessage="How to become a member"
                    />
                  </Link>
                ),
              }}
            />
          </p>
        </>
      )}
    </>
  );
};

const SignUpDisabledContent = () => {
  const { currentSettings } = useSettings();

  return (
    <p className="my-4">
      <FormattedMessage
        id="help.invites.signUpDisabled"
        defaultMessage="Sign-up is currently closed on {appTitle}. Invites are not available at this time. If you believe this is an error, please contact the server admin."
        values={{
          appTitle: (
            <span className="text-primary font-bold">
              {currentSettings.applicationTitle}
            </span>
          ),
        }}
      />
    </p>
  );
};

const Invites = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const anchors = currentSettings.enableSignUp
    ? [
        { href: '#how-invites-work', title: 'How Invites Work' },
        { href: '#sending-invites', title: 'Sending an Invite' },
        { href: '#invite-limits', title: 'Invite Limits' },
        { href: '#redeeming', title: 'Redeeming an Invite' },
      ]
    : [];

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/invites"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.invites.breadcrumb', defaultMessage: 'How to invite your friends to {appTitle}' }, { appTitle: currentSettings.applicationTitle })}`}
      />
      <HelpCard
        heading={intl.formatMessage(
          {
            id: 'help.invites.heading',
            defaultMessage: 'How to invite your friends to {appTitle}',
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
                  id: 'help.invites.subheading',
                  defaultMessage:
                    "Learn how to invite friends and family to {appTitle}, and how to redeem an invite code you've received.",
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
                  id: 'help.invites.subheadingClosed',
                  defaultMessage: 'Sign-up is currently closed on {appTitle}.',
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
        anchors={anchors}
        content={
          currentSettings.enableSignUp ? (
            <HelpContent />
          ) : (
            <SignUpDisabledContent />
          )
        }
      />
    </section>
  );
};

export default Invites;
