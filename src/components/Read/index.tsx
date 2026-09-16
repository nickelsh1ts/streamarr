'use client';
import Button from '@app/components/Common/Button';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission, useUser } from '@app/hooks/useUser';
import { KeyIcon } from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const Read = ({ children }: { children?: React.ReactNode }) => {
  useRouteGuard([Permission.READER, Permission.EBOOKS], { type: 'or' });
  const intl = useIntl();
  const pathname = usePathname();
  const isReaderRoute = /^\/read\/read\/[^/]+\/[^/]+/.test(pathname ?? '');
  const { user, loading: userLoading, revalidate: revalidateUser } = useUser();
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : ''
  );
  const { data: userSettings, isLoading } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user.id}/settings/main` : null
  );
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  if (userLoading || isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured =
    !!userSettings?.calibrewebBaseUrl && !!userSettings?.calibrewebEnabled;
  const notLinked = isConfigured && !user?.calibrewebUsername;

  const linkAccount = async () => {
    setLinking(true);
    setLinkError(null);
    try {
      await axios.post(
        `/api/v1/user/${user?.id}/settings/linked-accounts/calibreweb`
      );
      await revalidateUser();
    } catch (e) {
      setLinkError(
        e.response?.data?.message ??
          intl.formatMessage({
            id: 'read.calibrewebLinkFailed',
            defaultMessage: 'Failed to link Calibre-Web account',
          })
      );
    } finally {
      setLinking(false);
    }
  };

  if (notLinked) {
    return (
      <div className="bg-base-300 flex h-[calc(100dvh-7.5rem)] flex-col items-center justify-center rounded-lg px-4 sm:h-[calc(100dvh-4.35rem)]">
        <div className="max-w-md text-center">
          <KeyIcon className="text-base-content/40 mx-auto mb-4 h-16 w-16" />
          <h2 className="text-base-content mb-2 text-2xl font-semibold">
            <FormattedMessage
              id="read.calibrewebNotLinkedTitle"
              defaultMessage="Calibre-Web Account Required"
            />
          </h2>
          {userSettings?.calibrewebNewUserSignIn ? (
            <>
              <p className="text-base-content/70 mb-6">
                <FormattedMessage
                  id="read.calibrewebLinkPrompt"
                  defaultMessage="Link your Calibre-Web account to continue."
                />
              </p>
              {linkError && <p className="text-error mb-4">{linkError}</p>}
              <Button
                buttonType="primary"
                buttonSize="sm"
                onClick={linkAccount}
                disabled={linking}
                className="cursor-pointer"
              >
                {linking ? (
                  <FormattedMessage
                    id="common.linking"
                    defaultMessage="Linking…"
                  />
                ) : (
                  <FormattedMessage
                    id="common.linkAccount"
                    defaultMessage="Link Account"
                  />
                )}
              </Button>
            </>
          ) : (
            <p className="text-base-content/70 mb-6">
              <FormattedMessage
                id="read.calibrewebNotLinkedMessage"
                defaultMessage="Your Calibre-Web account must be linked by an administrator before you can access it."
              />
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <DynamicFrame
        title="Read"
        domainURL={hostname}
        basePath={userSettings?.calibrewebBaseUrl}
        newBase="/read"
        serviceName="Calibre-Web"
        isConfigured={isConfigured}
        injectTheme
        fullScreen={isReaderRoute}
      >
        {children}
      </DynamicFrame>
    </div>
  );
};

export default Read;
