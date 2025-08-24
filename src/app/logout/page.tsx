'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LogOutPage = () => {
  const { revalidate } = useUser();
  const router = useRouter();

  const logout = async () => {
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

  return <LoadingEllipsis fixed />;
};

export default LogOutPage;
