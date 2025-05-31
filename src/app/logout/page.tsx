'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { logout } from '@app/lib/auth';
import { useEffect } from 'react';

const LogOutPage = () => {
  useEffect(() => {
    async function logMeOut() {
      logout();
    }
    logMeOut();
  }, []);

  return <LoadingEllipsis fixed />;
};

export default LogOutPage;
