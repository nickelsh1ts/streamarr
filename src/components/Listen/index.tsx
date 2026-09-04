'use client';
import Button from '@app/components/Common/Button';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import AudiobookshelfModal from '@app/components/UserProfile/UserSettings/UserSettingsAccounts/AudiobookshelfModal';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission, useUser } from '@app/hooks/useUser';
import { storeAudiobookshelfToken } from '@app/utils/audiobookshelf';
import { KeyIcon } from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

interface AudiobookshelfSession {
  loginPath: string;
}

interface AudiobookshelfIssue {
  status: number;
  message: string;
}

const Listen = ({ children }: { children?: React.ReactNode }) => {
  const intl = useIntl();
  useRouteGuard([Permission.LISTEN, Permission.STREAMARR], {
    type: 'or',
  });
  const { user, hasPermission } = useUser();
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const [session, setSession] = useState<AudiobookshelfSession | null>(null);
  const [authIssue, setAuthIssue] = useState<AudiobookshelfIssue | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const { data: userSettings, isLoading } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  const isConfigured =
    !!userSettings?.audiobooksBaseUrl && !!userSettings?.audiobooksEnabled;
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !isConfigured) return;

    let cancelled = false;
    axios
      .post(
        `/api/v1/user/${userId}/settings/linked-accounts/audiobookshelf/session`
      )
      .then(({ data }: { data: { accessToken: string } }) => {
        if (cancelled) return;
        storeAudiobookshelfToken(data.accessToken);
        setSession({ loginPath: `${userSettings?.audiobooksBaseUrl}/login` });
      })
      .catch((error) => {
        if (cancelled) return;
        setAuthIssue({
          status: error.response?.status ?? 0,
          message:
            error.response?.data?.message ??
            intl.formatMessage({
              id: 'listen.audiobookshelfSigninFailed',
              defaultMessage: 'Failed to sign in to Audiobookshelf.',
            }),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [intl, isConfigured, userId, userSettings?.audiobooksBaseUrl]);

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  if (isConfigured && authIssue) {
    // 409: no account linked yet. 422: linked account's password stopped
    // working. Both can be resolved by the user right here.
    const alreadyLinked = authIssue.status === 422;
    const canSelfService = authIssue.status === 409 || alreadyLinked;

    return (
      <div className="bg-base-300 flex h-[calc(100dvh-7.5rem)] flex-col items-center justify-center rounded-lg px-4 sm:h-[calc(100dvh-4.35rem)]">
        <div className="max-w-md text-center">
          <KeyIcon className="text-base-content/40 mx-auto mb-4 h-16 w-16" />
          <h2 className="text-base-content mb-2 text-2xl font-semibold">
            <FormattedMessage
              id="listen.audiobookshelfNotLinkedTitle"
              defaultMessage="Audiobookshelf Account Required"
            />
          </h2>
          <p className="text-base-content/70 mb-6">{authIssue.message}</p>
          {canSelfService && userId && (
            <Button
              buttonType="primary"
              buttonSize="sm"
              onClick={() => setShowLinkModal(true)}
            >
              {alreadyLinked ? (
                <FormattedMessage
                  id="common.resetPassword"
                  defaultMessage="Reset Password"
                />
              ) : (
                <FormattedMessage
                  id="listen.linkAccount"
                  defaultMessage="Link Audiobookshelf Account"
                />
              )}
            </Button>
          )}
        </div>
        {canSelfService && userId && (
          <AudiobookshelfModal
            userId={userId}
            show={showLinkModal}
            alreadyLinked={alreadyLinked}
            isManager={hasPermission(Permission.MANAGE_USERS)}
            alreadyNotified={!!user?.audiobookshelfPwNotifiedAt}
            onClose={() => setShowLinkModal(false)}
            onLinked={(accessToken) => {
              setShowLinkModal(false);
              if (accessToken) {
                setAuthIssue(null);
                storeAudiobookshelfToken(accessToken);
                setSession({
                  loginPath: `${userSettings?.audiobooksBaseUrl}/login`,
                });
              } else {
                setAuthIssue({
                  status: 422,
                  message: intl.formatMessage({
                    id: 'listen.audiobookshelfPasswordFailed',
                    defaultMessage:
                      'Please reset your Audiobookshelf password and try again.',
                  }),
                });
              }
            }}
          />
        )}
      </div>
    );
  }

  if (isConfigured && !session) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative">
      <DynamicFrame
        title="Audiobooks"
        domainURL={hostname}
        basePath={userSettings?.audiobooksBaseUrl}
        newBase="/listen"
        serviceName="Audiobookshelf"
        isConfigured={isConfigured}
        injectTheme
        initialAuthPath={session?.loginPath}
      >
        {children}
      </DynamicFrame>
    </div>
  );
};

export default Listen;
