'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useEffect } from 'react';

const LogOutPage = () => {
  const { revalidate } = useUser();

  const logout = async () => {
    const response = await axios.post('/api/v1/auth/logout');

    if (response.data?.status === 'ok') {
      revalidate();
    }
  };

  useEffect(() => {
    logout();
  });

  return <LoadingEllipsis fixed />;
};

export default LogOutPage;
