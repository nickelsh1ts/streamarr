import Badge from '@app/components/Common/Badge';
import CachedImage from '@app/components/Common/CachedImage';
import Toast from '@app/components/Toast';
import { useInView } from '@app/hooks/useElementInView';
import { Permission, useUser } from '@app/hooks/useUser';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { withProperties } from '@app/utils/typeHelpers';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';
import { InviteStatus } from '@server/constants/invite';
import type Invite from '@server/entity/Invite';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useClipboard from 'react-use-clipboard';

const InviteCardPlaceholder = () => {
  return (
    <div className="bg-base-200 relative w-72 animate-pulse rounded-xl p-4 sm:w-96">
      <div className="w-20 sm:w-28">
        <div className="w-full" style={{ paddingBottom: '150%' }} />
      </div>
    </div>
  );
};

interface RecentInviteProps {
  invite?: Invite;
}

const RecentInvite = ({ invite }: RecentInviteProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, 0.17);
  const { hasPermission } = useUser();
  const intl = useIntl();
  const [isCopied, setCopied] = useClipboard(invite?.icode ?? '', {
    successDuration: 1000,
  });

  useEffect(() => {
    if (isCopied) {
      Toast({
        icon: <ClipboardDocumentCheckIcon className="size-7" />,
        title: intl.formatMessage(
          {
            id: 'common.copiedToClipboard',
            defaultMessage: 'Copied {item} to Clipboard!',
          },
          { item: 'Invite Code' }
        ),
        message: invite?.icode,
        type: 'primary',
      });
    }
  }, [invite?.icode, isCopied, intl]);

  if (!isInView) {
    return (
      <div ref={ref}>
        <InviteCardPlaceholder />
      </div>
    );
  }

  return (
    <div className="border-primary bg-base-100 flex w-72 flex-col justify-between overflow-hidden rounded-xl border p-4 sm:w-96">
      <div className="flex w-full flex-row items-center justify-around">
        <div className="flex w-full items-start overflow-hidden">
          <div className="flex w-full flex-col items-start gap-1 truncate overflow-hidden">
            <p className="text-warning w-full truncate text-xs">
              {invite?.expiresAt != null
                ? `${moment(invite?.expiresAt).isAfter(moment()) ? intl.formatMessage({ id: 'common.expires', defaultMessage: 'Expires' }) : intl.formatMessage({ id: 'common.expired', defaultMessage: 'Expired' })} ${moment(invite?.expiresAt).fromNow()}`
                : intl.formatMessage({
                    id: 'invite.neverExpires',
                    defaultMessage: 'Never expires',
                  })}
            </p>
            <button
              type="button"
              className="m-0 cursor-pointer border-none bg-transparent p-0 align-top text-lg font-bold select-all"
              title={intl.formatMessage({
                id: 'invite.clickToCopy',
                defaultMessage: 'Click to copy invite code',
              })}
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                setCopied();
              }}
              onKeyDown={(e) => {
                e.preventDefault();
                setCopied();
              }}
            >
              {invite?.icode}{' '}
              {invite?.usageLimit === 0
                ? ' (∞)'
                : invite?.usageLimit
                  ? ` (${invite?.usageLimit})`
                  : ''}
            </button>
            <span className="flex items-center gap-2 truncate font-extrabold">
              <CachedImage
                src={
                  invite?.createdBy?.id
                    ? `/avatarproxy/${invite.createdBy.id}`
                    : undefined
                }
                alt=""
                className="rounded-full object-cover"
                width={20}
                height={20}
              />
              <span className="truncate font-semibold">
                {invite?.createdBy?.displayName ||
                  invite?.createdBy?.email ||
                  intl.formatMessage({
                    id: 'common.unknown',
                    defaultMessage: 'Unknown',
                  })}
              </span>
            </span>
            <div className="flex items-center truncate py-1 leading-5">
              <span className="mr-2 hidden font-bold sm:block">
                <FormattedMessage id="common.status" defaultMessage="Status" />
              </span>
              {invite?.status === InviteStatus.ACTIVE ? (
                <Badge badgeType="success" className="capitalize">
                  <FormattedMessage
                    id="common.active"
                    defaultMessage="Active"
                  />
                </Badge>
              ) : invite?.status === InviteStatus.EXPIRED ? (
                <Badge badgeType="error" className="capitalize">
                  <FormattedMessage
                    id="common.expired"
                    defaultMessage="Expired"
                  />
                </Badge>
              ) : invite?.status === InviteStatus.REDEEMED ? (
                <Badge badgeType="primary" className="capitalize">
                  <FormattedMessage
                    id="common.redeemed"
                    defaultMessage="Redeemed"
                  />
                </Badge>
              ) : (
                <Badge badgeType="warning" className="capitalize">
                  <FormattedMessage
                    id="common.inactive"
                    defaultMessage="Inactive"
                  />
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="">
          <div className="bg-primary/60 text-primary-content flex aspect-square h-full items-center justify-center rounded p-5">
            {(Array.isArray(invite?.redeemedBy) &&
              invite.redeemedBy.length > 0) ||
            invite?.status === InviteStatus.REDEEMED ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-11"
              >
                <path d="M19.5 22.5a3 3 0 0 0 3-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 1 1-.712 1.321l-5.683-3.06a1.5 1.5 0 0 0-1.422 0l-5.683 3.06a.75.75 0 0 1-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 0 0 3 3h15Z" />
                <path d="M1.5 9.589v-.745a3 3 0 0 1 1.578-2.642l7.5-4.038a3 3 0 0 1 2.844 0l7.5 4.038A3 3 0 0 1 22.5 8.844v.745l-8.426 4.926-.652-.351a3 3 0 0 0-2.844 0l-.652.351L1.5 9.589Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-11"
              >
                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
              </svg>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center truncate py-1 leading-5 whitespace-nowrap">
        <div className="hidden min-h-10 items-center sm:flex">
          {Array.isArray(invite?.redeemedBy) &&
            invite.redeemedBy.length > 0 && (
              <>
                <span className="mr-2 font-extrabold">
                  <FormattedMessage
                    id="common.redeemed"
                    defaultMessage="Redeemed"
                  />
                </span>
                <FormattedMessage id="common.by" defaultMessage="by" />
                <span className="ml-1 flex -space-x-2">
                  {invite.redeemedBy.map((user, idx) =>
                    hasPermission(Permission.MANAGE_USERS) ? (
                      <Link
                        key={user?.id || idx}
                        href={`/admin/users/${user?.id}`}
                        className="group"
                        title={
                          user?.displayName ||
                          user?.email ||
                          intl.formatMessage({
                            id: 'common.unknown',
                            defaultMessage: 'Unknown',
                          })
                        }
                      >
                        <CachedImage
                          src={user?.id ? `/avatarproxy/${user.id}` : undefined}
                          alt=""
                          className="border-base-100 group-hover:border-primary size-6 rounded-full border-2"
                          width={24}
                          height={24}
                        />
                      </Link>
                    ) : (
                      <span
                        key={user?.id || idx}
                        title={
                          user?.displayName ||
                          user?.email ||
                          intl.formatMessage({
                            id: 'common.unknown',
                            defaultMessage: 'Unknown',
                          })
                        }
                      >
                        <CachedImage
                          src={user?.id ? `/avatarproxy/${user.id}` : undefined}
                          alt=""
                          className="border-base-100 size-6 rounded-full border-2"
                          width={24}
                          height={24}
                        />
                      </span>
                    )
                  )}
                </span>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default withProperties(RecentInvite, {
  Placeholder: InviteCardPlaceholder,
});
