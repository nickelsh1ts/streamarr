'use client';
import { subscribeToUrl } from '@app/utils/subscribeToUrl';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

// The Next pathname whose URL has been seen in the browser since it changed
let committedPathname: string | null = null;

// Iframe wrappers sync the URL via replaceState, which Next's usePathname() ignores.
const useLocationPath = () => {
  const nextPathname = usePathname();
  return useSyncExternalStore(
    subscribeToUrl,
    () => {
      const locationPath = window.location.pathname;
      if (locationPath === nextPathname) {
        committedPathname = nextPathname;
      }
      // Mid-navigation the URL still holds the previous route; trust Next until it commits.
      return committedPathname === nextPathname ? locationPath : nextPathname;
    },
    () => nextPathname
  );
};

export default useLocationPath;
