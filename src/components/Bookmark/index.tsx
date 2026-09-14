'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission, useUser } from '@app/hooks/useUser';
import { KeyIcon } from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';

const Bookmark = ({ children }: { children?: React.ReactNode }) => {
  useRouteGuard([Permission.BOOKMARK, Permission.READER], { type: 'or' });
  const { user } = useUser();
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : ''
  );
  const { data: userSettings, isLoading } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user.id}/settings/main` : null
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured =
    !!userSettings?.shelfmarkBaseUrl && !!userSettings?.shelfmarkEnabled;
  const requiresManagerLink =
    isConfigured &&
    !userSettings?.shelfmarkNewUserSignIn &&
    !user?.shelfmarkUsername;

  if (requiresManagerLink) {
    return (
      <div className="bg-base-300 flex h-[calc(100dvh-7.5rem)] flex-col items-center justify-center rounded-lg px-4 sm:h-[calc(100dvh-4.35rem)]">
        <div className="max-w-md text-center">
          <KeyIcon className="text-base-content/40 mx-auto mb-4 h-16 w-16" />
          <h2 className="text-base-content mb-2 text-2xl font-semibold">
            <FormattedMessage
              id="bookmark.shelfmarkNotLinkedTitle"
              defaultMessage="Shelfmark Account Required"
            />
          </h2>
          <p className="text-base-content/70 mb-6">
            <FormattedMessage
              id="bookmark.shelfmarkNotLinkedMessage"
              defaultMessage="Your Shelfmark account must be linked by an administrator before you can access it."
            />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <DynamicFrame
        title="Bookmark"
        domainURL={hostname}
        basePath={userSettings?.shelfmarkBaseUrl}
        newBase="/bookmark"
        serviceName="Shelfmark"
        isConfigured={isConfigured}
      >
        {children}
      </DynamicFrame>
    </div>
  );
};

export default Bookmark;
