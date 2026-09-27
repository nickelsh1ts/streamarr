'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import { clearAudiobookshelfToken } from '@app/utils/audiobookshelf';
import { unsubscribeToPushNotifications } from '@app/utils/pushSubscriptionHelpers';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

const LogOutPage = () => {
  const { user, loading, revalidate } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (loading || logoutStarted.current) {
      return;
    }
    logoutStarted.current = true;

    const logout = async () => {
      try {
        localStorage.removeItem('myPlexAccessToken');
      } catch {
        // fail silently
      }

      clearAudiobookshelfToken();

      try {
        if (user?.id) {
          const endpoint = await unsubscribeToPushNotifications(user.id);
          if (endpoint) {
            await axios.delete(
              `/api/v1/user/${user.id}/pushSubscription/${encodeURIComponent(
                endpoint
              )}`,
              { timeout: 1500 }
            );
          }
        }
      } catch {
        // Push cleanup is best-effort; it must not block logout.
      } finally {
        try {
          localStorage.removeItem('pushNotificationsEnabled');
        } catch {
          // Storage access must not block logout.
        }
      }

      await axios
        .post('/api/v1/auth/logout')
        .then(() => {
          revalidate(undefined, false);
        })
        .finally(() => {
          router.replace('/signin');
        });
    };
    logout();
  }, [loading, revalidate, router, user?.id]);

  return (
    <LoadingEllipsis
      text={intl.formatMessage({
        id: 'common.loggingOut',
        defaultMessage: 'Logging out',
      })}
      fixed
    />
  );
};

export default LogOutPage;
