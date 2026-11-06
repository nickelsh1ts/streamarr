'use client';
import Error from '@app/app/error';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import SessionItem from '@app/components/UserProfile/UserSettings/UserSettingsSessions/SessionItem';
import { useUser } from '@app/hooks/useUser';
import {
  ArrowRightStartOnRectangleIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { UserSessionResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

type RevokeScope = 'others' | 'all';

const UserSettingsSessions = () => {
  const intl = useIntl();
  const router = useRouter();
  const params = useParams<{ userid: string }>();
  const { user: currentUser } = useUser();
  const { user } = useUser({ id: Number(params.userid) });
  const [pendingScope, setPendingScope] = useState<RevokeScope | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const {
    data: sessions,
    error,
    mutate: revalidate,
  } = useSWR<UserSessionResponse[]>(
    user ? `/api/v1/user/${user.id}/settings/sessions` : null
  );

  const isOwnAccount = currentUser?.id === user?.id;

  const revokeSession = async (id: string) => {
    try {
      await axios.delete(`/api/v1/user/${user?.id}/settings/sessions/${id}`);
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.sessions.signedOutOne',
          defaultMessage: 'Device signed out.',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.sessions.signOutError',
          defaultMessage: 'Something went wrong while signing out devices.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidate();
    }
  };

  const revokeSessions = async () => {
    if (!pendingScope) {
      return;
    }
    setIsRevoking(true);
    const signOutHere = isOwnAccount && pendingScope === 'all';
    try {
      // This session is ended by /logout so its cleanup runs and no request 401s first
      await axios.post(`/api/v1/user/${user?.id}/settings/sessions/revoke`, {
        scope: signOutHere ? 'others' : pendingScope,
      });

      if (signOutHere) {
        router.push('/logout');
        return;
      }

      Toast({
        title: intl.formatMessage({
          id: 'userSettings.sessions.signedOutMany',
          defaultMessage: 'Devices signed out.',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
      revalidate();
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.sessions.signOutError',
          defaultMessage: 'Something went wrong while signing out devices.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
      revalidate();
    } finally {
      setIsRevoking(false);
      setPendingScope(null);
    }
  };

  const header = (
    <div className="mt-3 mb-6">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="userSettings.sessions.title"
          defaultMessage="Devices"
        />
      </h3>
      <p>
        {isOwnAccount ? (
          <FormattedMessage
            id="userSettings.sessions.descriptionOwn"
            defaultMessage="Devices where you are signed in to Streamarr. Sign out any you don't recognize."
          />
        ) : (
          <FormattedMessage
            id="userSettings.sessions.descriptionOther"
            defaultMessage="Devices where this user is signed in to Streamarr."
          />
        )}
      </p>
    </div>
  );

  if (!sessions && !error) {
    return (
      <>
        {header}
        <LoadingEllipsis />
      </>
    );
  }

  if (!sessions) {
    return <Error statusCode={500} error={undefined} reset={() => {}} />;
  }

  const hasOtherSessions = sessions.some((session) => !session.current);

  return (
    <>
      {header}
      <Modal
        show={pendingScope !== null}
        title={
          pendingScope === 'others'
            ? intl.formatMessage({
                id: 'userSettings.sessions.signOutOthers',
                defaultMessage: 'Sign Out Other Devices',
              })
            : intl.formatMessage({
                id: 'userSettings.sessions.signOutAll',
                defaultMessage: 'Sign Out All Devices',
              })
        }
        onOk={revokeSessions}
        okText={intl.formatMessage({
          id: 'userSettings.sessions.signOut',
          defaultMessage: 'Sign Out',
        })}
        okButtonType="error"
        okDisabled={isRevoking}
        onCancel={() => setPendingScope(null)}
        cancelText={intl.formatMessage({
          id: 'common.cancel',
          defaultMessage: 'Cancel',
        })}
      >
        {pendingScope === 'others' ? (
          <FormattedMessage
            id="userSettings.sessions.signOutOthersConfirm"
            defaultMessage="Every device other than this one will be signed out and need to sign in again."
          />
        ) : isOwnAccount ? (
          <FormattedMessage
            id="userSettings.sessions.signOutAllOwnConfirm"
            defaultMessage="Every device, including this one, will be signed out and need to sign in again."
          />
        ) : (
          <FormattedMessage
            id="userSettings.sessions.signOutAllOtherConfirm"
            defaultMessage="This user will be signed out on every device and will need to sign in again."
          />
        )}
      </Modal>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {isOwnAccount && (
          <Button
            buttonType="warning"
            buttonSize="sm"
            disabled={!hasOtherSessions}
            onClick={() => setPendingScope('others')}
            data-testid="sessions-sign-out-others"
          >
            <ArrowRightStartOnRectangleIcon className="mr-2 size-5" />
            <span>
              <FormattedMessage
                id="userSettings.sessions.signOutOthers"
                defaultMessage="Sign Out Other Devices"
              />
            </span>
          </Button>
        )}
        <Button
          buttonType="error"
          buttonSize="sm"
          disabled={!sessions.length}
          onClick={() => setPendingScope('all')}
          data-testid="sessions-sign-out-all"
        >
          <ArrowRightStartOnRectangleIcon className="mr-2 size-5" />
          <span>
            <FormattedMessage
              id="userSettings.sessions.signOutAll"
              defaultMessage="Sign Out All Devices"
            />
          </span>
        </Button>
      </div>
      {sessions.length ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onRevoke={revokeSession}
            />
          ))}
        </div>
      ) : (
        <Alert
          title={intl.formatMessage({
            id: 'userSettings.sessions.none',
            defaultMessage: 'There are no signed-in devices.',
          })}
          type="info"
        />
      )}
    </>
  );
};

export default UserSettingsSessions;
