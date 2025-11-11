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

  const clearPlexToken = () => {
    try {
      localStorage.removeItem('myPlexAccessToken');
      sessionStorage.removeItem('myPlexAccessToken');
    } catch {
      // fail silently
    }
  };

  const logout = async () => {
    clearPlexToken();
    const response = await axios.post('/api/v1/auth/logout');

    if (response.data?.status === 'ok') {
      revalidate().then(() => {
        router.push('/');
      });
    }
  };

  useEffect(() => {
    logout();
  });

  return (
    <LoadingEllipsis
      text={intl.formatMessage({
        id: 'common.loggingOut',
        defaultMessage: 'Logging out...',
      })}
      fixed
    />
  );
};

export default LogOutPage;
