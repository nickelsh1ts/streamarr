'use client';
import { subscribeToUrl } from '@app/utils/subscribeToUrl';
import { useSyncExternalStore } from 'react';

const useHash = () => {
  const hash = useSyncExternalStore(
    subscribeToUrl,
    () => window.location.hash,
    () => ''
  );

  return hash || null;
};

export default useHash;
