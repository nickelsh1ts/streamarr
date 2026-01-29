import Badge from '@app/components/Common/Badge';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import Link from 'next/link';
import { InviteStatus } from '@server/constants/invite';
import type Invite from '@server/entity/Invite';
import CachedImage from '@app/components/Common/CachedImage';
import {
  CheckCircleIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { Permission, useUser } from '@app/hooks/useUser';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import type { Library } from '@server/lib/settings';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Toast from '@app/components/Toast';
import { useEffect } from 'react';
import useClipboard from 'react-use-clipboard';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { FormattedMessage, useIntl } from 'react-intl';

interface InviteCardProps {
  invite: Invite;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  serverValue?: string;
}

const InviteCard = ({ invite, onEdit, onDelete, onShare }: InviteCardProps) => {
  const intl = useIntl();
  const searchParams = useParams<{ userid: string }>();
  const { user } = useUser({
    id: Number(searchParams.userid),
  });
  const { user: currentUser, hasPermission } = useUser();
  const { data } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );
  const { data: Libraries } = useSWR<Library[]>('/api/v1/libraries');

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
  }, [intl, invite?.icode, isCopied]);

  return (
    <li className="mb-2">
      <div className="flex w-full flex-col justify-between xl:flex-row border border-primary bg-base-100 p-4 rounded-xl overflow-hidden">
        <div className="flex flex-col justify-between items-center space-x-0 md:space-x-3 sm:flex-row w-full">
          <div className="flex w-full items-start overflow-hidden">
            <div className="pt-2">
              <div className="aspect-square p-5 h-full rounded flex items-center justify-center bg-primary/60 text-primary-content">
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
            <div className="flex flex-col justify-center overflow-hidden pl-2 lg:pl-4">
              <div className="flex flex-col items-start justify-between w-full overflow-hidden truncate space-y-1">
                <button
                  type="button"
                  className="font-bold text-lg cursor-pointer select-all bg-transparent border-none p-0 m-0 align-top"
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
                <p className="text-xs truncate w-full text-warning">
                  {invite?.expiresAt != null &&
                  (invite?.status !== InviteStatus.REDEEMED ||
                    moment(invite?.expiresAt).isAfter(moment()))
                    ? `${moment(invite?.expiresAt).isAfter(moment()) ? intl.formatMessage({ id: 'common.expires', defaultMessage: 'Expires' }) : intl.formatMessage({ id: 'common.expired', defaultMessage: 'Expired' })} ${moment(invite?.expiresAt).fromNow()}`
                    : invite?.status !== InviteStatus.REDEEMED && (
                        <FormattedMessage
                          id="invite.neverExpires"
                          defaultMessage="Never expires"
                        />
                      )}
                </p>
                <div className="flex flex-wrap w-full items-center gap-x-2 gap-y-1">
                  <p className="text-xs flex items-center">
                    <FormattedMessage
                      id="common.downloads"
                      defaultMessage="Downloads"
                    />{' '}
                    {invite?.downloads ? (
                      <CheckCircleIcon className="inline-block size-5 text-success ml-1" />
                    ) : (
                      <XCircleIcon className="inline-block size-5 text-error ml-1" />
                    )}
                  </p>
                  <p className="text-xs flex items-center">
                    <FormattedMessage
                      id="library.liveTV"
                      defaultMessage="Live TV"
                    />{' '}
                    {invite?.liveTv ? (
                      <CheckCircleIcon className="inline-block size-5 text-success ml-1" />
                    ) : (
                      <XCircleIcon className="inline-block size-5 text-error ml-1" />
                    )}
                  </p>
                  <p className="text-xs flex items-center">
                    <FormattedMessage
                      id="invite.plexHome"
                      defaultMessage="Plex Home"
                    />{' '}
                    {invite?.plexHome ? (
                      <CheckCircleIcon className="inline-block size-5 text-success ml-1" />
                    ) : (
                      <XCircleIcon className="inline-block size-5 text-error ml-1" />
                    )}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="whitespace-normal break-words">
                    <span className="font-bold whitespace-nowrap">
                      <FormattedMessage
                        id="invite.sharedLibraries"
                        defaultMessage="Shared Libraries:"
                      />{' '}
                    </span>
                    <span className="whitespace-normal break-words align-baseline text-neutral">
                      {(() => {
                        if (!Libraries) return null;
                        const allIds = Libraries.map((lib) => lib.id).sort();
                        const selected =
                          invite?.sharedLibraries === undefined ||
                          invite?.sharedLibraries === null
                            ? ''
                            : invite?.sharedLibraries;
                        // All Libraries
                        if (
                          selected === 'all' ||
                          (selected &&
                            selected.split('|').sort().join('|') ===
                              allIds.join('|'))
                        ) {
                          return (
                            <FormattedMessage
                              id="invite.allLibraries"
                              defaultMessage="All Libraries"
                            />
                          );
                        }
                        // Default (server) value
                        if (selected === '' || selected === 'server') {
                          // Use user settings default/server value
                          const defaultIds = (data?.globalSharedLibraries || '')
                            .split('|')
                            .filter(Boolean);
                          const defaultNames = defaultIds
                            .map(
                              (id) =>
                                Libraries.find((lib) => lib.id === id)?.name
                            )
                            .filter(Boolean)
                            .join(', ');
                          return defaultNames ? (
                            <FormattedMessage
                              id="invite.defaultLibraries"
                              defaultMessage="Default ({libraries})"
                              values={{ libraries: defaultNames }}
                            />
                          ) : (
                            <FormattedMessage
                              id="invite.defaultLibrariesAll"
                              defaultMessage="Default (All Libraries)"
                            />
                          );
                        }
                        // Otherwise, show selected library names
                        const selectedIds = selected.split('|').filter(Boolean);
                        const selectedNames = selectedIds
                          .map(
                            (id) => Libraries.find((lib) => lib.id === id)?.name
                          )
                          .filter(Boolean)
                          .join(', ');
                        return selectedNames;
                      })()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:pr-0">
            <div className="py-1 flex items-center truncate leading-5">
              <span className="font-extrabold mr-2">
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
            <div className="flex overflow-hidden items-center py-1 truncate whitespace-nowrap leading-5">
              <span className="font-extrabold mr-2">
                <FormattedMessage
                  id="invite.created"
                  defaultMessage="Created"
                />
              </span>
              {moment(invite?.createdAt).fromNow()}
              {hasPermission(Permission.MANAGE_USERS) && invite?.createdBy ? (
                <>
                  {' '}
                  <FormattedMessage id="common.by" defaultMessage="by" />{' '}
                  <Link
                    className="link-hover font-extrabold flex items-center truncate"
                    href={`/admin/users/${invite?.createdBy?.id}`}
                  >
                    <CachedImage
                      src={invite?.createdBy?.avatar}
                      alt=""
                      className="size-5 mr-1 ml-1.5 object-cover rounded-full"
                      width={20}
                      height={20}
                    />
                    <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                      {invite?.createdBy?.displayName}
                    </span>
                  </Link>
                </>
              ) : currentUser?.id === invite?.createdBy?.id ? (
                <>
                  {' '}
                  <FormattedMessage id="common.by" defaultMessage="by" />{' '}
                  <Link
                    className="link-hover font-extrabold flex items-center truncate"
                    href={`/profile`}
                  >
                    <CachedImage
                      src={invite?.createdBy?.avatar}
                      alt=""
                      className="size-5 mr-1 ml-1.5 object-cover rounded-full"
                      width={20}
                      height={20}
                    />
                    <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                      {invite?.createdBy?.displayName}
                    </span>
                  </Link>
                </>
              ) : (
                invite?.createdBy && (
                  <>
                    {' '}
                    <FormattedMessage id="common.by" defaultMessage="by" />{' '}
                    <span className="font-extrabold flex items-center truncate">
                      <CachedImage
                        src={invite?.createdBy?.avatar}
                        alt=""
                        className="size-5 mr-1 ml-1.5 object-cover rounded-full"
                        width={20}
                        height={20}
                      />
                      <span className="truncate text-sm font-semibold">
                        {invite?.createdBy?.displayName}
                      </span>
                    </span>
                  </>
                )
              )}
            </div>
            <div className="flex items-center py-1 truncate whitespace-nowrap leading-5">
              <span className="font-extrabold mr-2">
                <FormattedMessage
                  id="invite.modified"
                  defaultMessage="Modified"
                />
              </span>
              {moment(invite?.updatedAt).fromNow()}
              {hasPermission(Permission.MANAGE_USERS) && invite?.updatedBy ? (
                <>
                  {' '}
                  <FormattedMessage id="common.by" defaultMessage="by" />{' '}
                  <Link
                    className="link-hover font-extrabold flex items-center truncate"
                    href={`/admin/users/${invite?.updatedBy?.id}`}
                  >
                    <CachedImage
                      src={invite?.updatedBy?.avatar}
                      alt=""
                      className="size-5 mr-1 ml-1.5 object-cover rounded-full"
                      width={20}
                      height={20}
                    />
                    <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                      {invite?.updatedBy?.displayName}
                    </span>
                  </Link>
                </>
              ) : currentUser?.id === invite?.updatedBy?.id ? (
                <>
                  <FormattedMessage id="common.by" defaultMessage="by" />{' '}
                  <Link
                    className="link-hover font-extrabold flex items-center truncate"
                    href={`/profile`}
                  >
                    <CachedImage
                      src={invite?.updatedBy?.avatar}
                      alt=""
                      className="size-5 mr-1 ml-1.5 object-cover rounded-full"
                      width={20}
                      height={20}
                    />
                    <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                      {invite?.updatedBy?.displayName}
                    </span>
                  </Link>
                </>
              ) : (
                invite?.updatedBy && (
                  <>
                    {' '}
                    <FormattedMessage id="common.by" defaultMessage="by" />{' '}
                    <span className="font-extrabold flex items-center truncate">
                      <CachedImage
                        src={invite?.updatedBy?.avatar}
                        alt=""
                        className="size-5 mr-1 ml-1.5 object-cover rounded-full"
                        width={20}
                        height={20}
                      />
                      <span className="truncate text-sm font-semibold">
                        {invite?.updatedBy?.displayName}
                      </span>
                    </span>
                  </>
                )
              )}
            </div>
            <div className="flex items-center py-1 truncate whitespace-nowrap leading-5">
              {Array.isArray(invite?.redeemedBy) &&
              invite.redeemedBy.length > 0 ? (
                <div className="inline-flex items-center">
                  <span className="font-extrabold mr-2">
                    <FormattedMessage
                      id="common.redeemed"
                      defaultMessage="Redeemed"
                    />
                  </span>{' '}
                  <FormattedMessage id="common.by" defaultMessage="by" />
                  <span className="ml-1 flex -space-x-2">
                    {invite.redeemedBy.map((user, idx) =>
                      hasPermission(Permission.MANAGE_USERS) ? (
                        <Link
                          key={user?.id || idx}
                          href={`/admin/users/${user?.id}`}
                          className="group"
                          title={user?.displayName}
                        >
                          <CachedImage
                            src={user?.avatar}
                            alt=""
                            className="size-6 rounded-full border-2 border-base-100 group-hover:border-primary"
                            width={24}
                            height={24}
                          />
                        </Link>
                      ) : (
                        <span key={user?.id || idx} title={user?.displayName}>
                          <CachedImage
                            src={user?.avatar}
                            alt=""
                            className="size-6 rounded-full border-2 border-base-100"
                            width={24}
                            height={24}
                          />
                        </span>
                      )
                    )}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-4 xl:mt-0 xl:w-1/3 xl:max-w-xs">
          <div className="w-full flex flex-col gap-2">
            {(moment(invite?.expiresAt).isAfter(moment()) ||
              invite?.expiresAt === null) &&
              invite?.status === InviteStatus.ACTIVE &&
              (invite?.uses < invite?.usageLimit || invite?.usageLimit === 0) &&
              (hasPermission(Permission.ADMIN) ||
                invite?.createdBy?.id === currentUser?.id) && (
                <button
                  onClick={() => onShare()}
                  className="btn btn-sm btn-block btn-neutral rounded-md flex-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                      clipRule="evenodd"
                    />
                  </svg>{' '}
                  <FormattedMessage
                    id="invite.shareInvite"
                    defaultMessage="Share Invite"
                  />
                </button>
              )}
            {(moment(invite?.expiresAt).isAfter(moment()) ||
              !invite?.expiresAt) &&
              (invite?.createdBy?.id === currentUser?.id ||
                hasPermission(Permission.MANAGE_INVITES)) && (
                <button
                  onClick={() => onEdit()}
                  className="btn btn-sm btn-block btn-neutral rounded-md flex-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                    <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                  </svg>{' '}
                  <FormattedMessage
                    id="invite.editInvite"
                    defaultMessage="Edit Invite"
                  />
                </button>
              )}
            {((Array.isArray(invite?.redeemedBy) &&
              invite.redeemedBy.length === 0) ||
              hasPermission(Permission.ADMIN)) &&
              (invite?.createdBy?.id === currentUser?.id ||
                hasPermission(Permission.MANAGE_INVITES)) && (
                <ConfirmButton
                  onClick={() => onDelete()}
                  buttonSize="sm"
                  confirmText={intl.formatMessage({
                    id: 'common.areYouSure',
                    defaultMessage: 'Are you sure?',
                  })}
                  className="w-full flex-1"
                >
                  <TrashIcon className="size-5 mr-2" />
                  <span>
                    <FormattedMessage
                      id="invite.deleteInvite"
                      defaultMessage="Delete Invite"
                    />
                  </span>
                </ConfirmButton>
              )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default InviteCard;
