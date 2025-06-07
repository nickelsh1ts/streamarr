'use client';
import { updateSession } from '@app/lib/session';
import { useEffect, useState } from 'react';

const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminUsers = localStorage?.getItem('users')
      ? JSON.parse(localStorage?.getItem('users'))['users'].filter(
          (item: { id: number }) =>
            item.id === +process.env.NEXT_PUBLIC_PLEX_ADMIN_ID
        )
      : null;

    const loggedInUser = localStorage?.getItem('myPlexAccessToken');

    const isAdmin =
      adminUsers === null
        ? false
        : ((loggedInUser === adminUsers[0]?.authToken) as boolean);

    try {
      updateSession(isAdmin);
      setIsAdmin(isAdmin);
    } catch (e) {
      console.error(e);
    }
  }, [isAdmin]);

  return isAdmin;
};

export default useIsAdmin;
