'use client';
import AudiobookshelfLogo from '@app/assets/services/audiobookshelf.svg';
import PlexLogo from '@app/assets/services/plex.svg';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import PlexOAuth from '@app/utils/plex';
import { TrashIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import AudiobookshelfModal from './AudiobookshelfModal';

const plexOAuth = new PlexOAuth();

enum LinkedAccountType {
  Plex = 'Plex',
  Audiobookshelf = 'Audiobookshelf',
}

type LinkedAccount = {
  type: LinkedAccountType;
  username: string;
};

const UserSettingsAccounts = () => {
  const intl = useIntl();
  const { user: currentUser, hasPermission: currentUserHasPermission } =
    useUser();
  const searchParams = useParams<{ userid: string }>();
  const { user, revalidate: revalidateUser } = useUser({
    id: Number(searchParams.userid),
  });
  const { data: passwordInfo } = useSWR<{ hasPassword: boolean }>(
    user ? `/api/v1/user/${user?.id}/settings/password` : null
  );
  const [error, setError] = useState<string | null>(null);
  const [showAudiobookshelfModal, setShowAudiobookshelfModal] = useState(false);

  const accounts: LinkedAccount[] = useMemo(() => {
    const accounts: LinkedAccount[] = [];
    if (!user) return accounts;
    if (user.userType === UserType.PLEX && user.plexUsername)
      accounts.push({
        type: LinkedAccountType.Plex,
        username: user.plexUsername,
      });
    if (user.audiobookshelfUsername)
      accounts.push({
        type: LinkedAccountType.Audiobookshelf,
        username: user.audiobookshelfUsername,
      });
    return accounts;
  }, [user]);

  const linkPlexAccount = async () => {
    setError(null);
    try {
      const pinId = await plexOAuth.login();
      await axios.post(
        `/api/v1/user/${user?.id}/settings/linked-accounts/plex`,
        {
          pinId,
        }
      );
      await revalidateUser();
    } catch (e) {
      setError(
        e.response?.data?.message ??
          intl.formatMessage({
            id: 'linkedAccounts.linkFailed',
            defaultMessage: 'An error occurred while linking your Plex account',
          })
      );
    }
  };

  const linkable = [
    {
      name: 'Plex',
      action: () => {
        plexOAuth.preparePopup();
        setTimeout(() => linkPlexAccount(), 1500);
      },
      hide:
        currentUser?.id !== user?.id ||
        accounts.some((a) => a.type === LinkedAccountType.Plex),
    },
    {
      name: 'Audiobookshelf',
      action: () => setShowAudiobookshelfModal(true),
      hide: accounts.some((a) => a.type === LinkedAccountType.Audiobookshelf),
    },
  ].filter((l) => !l.hide);

  const deleteRequest = async () => {
    try {
      await axios.delete(
        `/api/v1/user/${user?.id}/settings/linked-accounts/plex`
      );
      await revalidateUser();
    } catch {
      setError(
        intl.formatMessage({
          id: 'linkedAccounts.deleteFailed',
          defaultMessage: 'Failed to delete linked account',
        })
      );
    }
  };

  const deleteAudiobookshelfRequest = async () => {
    try {
      await axios.delete(
        `/api/v1/user/${user?.id}/settings/linked-accounts/audiobookshelf`
      );
      await revalidateUser();
    } catch {
      setError(
        intl.formatMessage({
          id: 'linkedAccounts.audiobookshelfUnlinkFailed',
          defaultMessage: 'Failed to unlink Audiobookshelf account',
        })
      );
    }
  };

  if (
    currentUser?.id !== user?.id &&
    !currentUserHasPermission(Permission.MANAGE_USERS)
  ) {
    return (
      <>
        <div className="mb-6">
          <h3 className="heading">
            <FormattedMessage
              id="linkedAccounts.title"
              defaultMessage="Linked Accounts"
            />
          </h3>
        </div>
        <Alert
          title={
            <FormattedMessage
              id="linkedAccounts.noPermissionDescription"
              defaultMessage="You do not have permission to view this user's linked accounts"
            />
          }
          type="error"
        />
      </>
    );
  }

  const enableMediaServerUnlink = user?.id !== 1 && passwordInfo?.hasPassword;

  return (
    <>
      <div className="mt-5 mb-6 flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-extrabold">
            <FormattedMessage
              id="linkedAccounts.title"
              defaultMessage="Linked Accounts"
            />
          </h3>
        </div>
      </div>
      {error && <Alert title={error} type="error" />}
      {(currentUser?.id === user?.id ||
        currentUserHasPermission(Permission.MANAGE_USERS)) &&
        !!linkable.length && (
          <ul className="mb-4 flex flex-col gap-4">
            {linkable.map(({ name, action }) => (
              <li
                key={name}
                className="bg-base-200/50 ring-neutral flex flex-wrap items-center gap-4 overflow-hidden rounded-lg px-4 py-5 shadow ring-1 sm:p-6"
              >
                <div className="w-12">
                  {name === 'Plex' ? (
                    <div className="flex aspect-square h-full items-center justify-center rounded-full bg-neutral-800">
                      <PlexLogo className="w-9" />
                    </div>
                  ) : (
                    <div className="flex aspect-square h-full items-center justify-center rounded-full bg-neutral-800">
                      <AudiobookshelfLogo className="w-9" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="truncate text-sm font-bold text-gray-300">
                    {name}
                  </div>
                  <div className="text-xl font-semibold text-white">
                    <FormattedMessage
                      id="linkedAccounts.notLinked"
                      defaultMessage="No Account Linked"
                      values={{ name }}
                    />
                  </div>
                </div>
                <div className="grow" />
                <Button
                  buttonSize="sm"
                  buttonType="primary"
                  onClick={action}
                  className="max-sm:btn-block cursor-pointer"
                >
                  <FormattedMessage
                    id="linkedAccounts.linkButton"
                    defaultMessage="Link {name} Account"
                    values={{ name }}
                  />
                </Button>
              </li>
            ))}
          </ul>
        )}
      {accounts.length ? (
        <ul className="flex flex-col gap-4">
          {accounts.map((acct, i) => (
            <li
              key={i}
              className="bg-base-200/50 ring-neutral flex flex-wrap items-center gap-4 overflow-hidden rounded-lg px-4 py-5 shadow ring-1 sm:p-6"
            >
              <div className="w-12">
                {acct.type === LinkedAccountType.Plex && (
                  <div className="flex aspect-square h-full items-center justify-center rounded-full bg-neutral-800">
                    <PlexLogo className="w-9" />
                  </div>
                )}
                {acct.type === LinkedAccountType.Audiobookshelf && (
                  <div className="flex aspect-square h-full items-center justify-center rounded-full bg-neutral-800">
                    <AudiobookshelfLogo className="w-9" />
                  </div>
                )}
              </div>
              <div>
                <div className="truncate text-sm font-bold text-gray-300">
                  {acct.type}
                </div>
                <div className="text-xl font-semibold text-white">
                  {acct.username}
                </div>
              </div>
              <div className="grow" />
              {acct.type === LinkedAccountType.Plex &&
                currentUser?.id === user?.id &&
                enableMediaServerUnlink && (
                  <ConfirmButton
                    buttonSize="sm"
                    onClick={() => {
                      deleteRequest();
                    }}
                    confirmText={
                      <FormattedMessage
                        id="common.areYouSure"
                        defaultMessage="Are you sure?"
                      />
                    }
                    className="max-sm:btn-block"
                  >
                    <TrashIcon className="mr-2 size-5" />
                    <span>
                      <FormattedMessage
                        id="common.unlinkAccount"
                        defaultMessage="Unlink Account"
                      />
                    </span>
                  </ConfirmButton>
                )}
              {acct.type === LinkedAccountType.Audiobookshelf &&
                (currentUser?.id === user?.id ||
                  currentUserHasPermission(Permission.MANAGE_USERS)) && (
                  <>
                    <Button
                      buttonSize="sm"
                      buttonType="warning"
                      onClick={() => setShowAudiobookshelfModal(true)}
                      className="max-sm:btn-block cursor-pointer"
                    >
                      <FormattedMessage
                        id="linkedAccounts.audiobookshelfResetButton"
                        defaultMessage="Reset Password"
                      />
                    </Button>
                    <ConfirmButton
                      buttonSize="sm"
                      onClick={deleteAudiobookshelfRequest}
                      confirmText={
                        <FormattedMessage
                          id="common.areYouSure"
                          defaultMessage="Are you sure?"
                        />
                      }
                      className="max-sm:btn-block"
                    >
                      <TrashIcon className="mr-2 size-5" />
                      <span>
                        <FormattedMessage
                          id="common.unlinkAccount"
                          defaultMessage="Unlink Account"
                        />
                      </span>
                    </ConfirmButton>
                  </>
                )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 text-center md:py-12">
          <h3 className="text-neutral text-lg font-semibold">
            {user?.id === currentUser?.id ? (
              <FormattedMessage
                id="linkedAccounts.noLinkedAccounts"
                defaultMessage="You do not have any external accounts linked to your account."
              />
            ) : (
              <FormattedMessage
                id="linkedAccounts.userNoLinkedAccounts"
                defaultMessage="This user does not have any external accounts linked to their account."
              />
            )}
          </h3>
        </div>
      )}
      {user && (
        <AudiobookshelfModal
          userId={user.id}
          show={showAudiobookshelfModal}
          alreadyLinked={!!user.audiobookshelfUsername}
          isManager={currentUserHasPermission(Permission.MANAGE_USERS)}
          alreadyNotified={!!user.audiobookshelfPwNotifiedAt}
          onClose={() => setShowAudiobookshelfModal(false)}
          onLinked={async () => {
            setShowAudiobookshelfModal(false);
            await revalidateUser();
          }}
        />
      )}
    </>
  );
};

export default UserSettingsAccounts;
