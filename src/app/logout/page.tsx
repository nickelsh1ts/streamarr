'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';

const LogOutPage = () => {
  const { revalidate } = useUser();
  const router = useRouter();
  const intl = useIntl();

  useEffect(() => {
    const logout = async () => {
      try {
        localStorage.removeItem('myPlexAccessToken');
      } catch {
        // fail silently
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
  }, [revalidate, router]);

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
