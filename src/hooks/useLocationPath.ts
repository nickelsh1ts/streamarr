'use client';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

// Iframe wrappers sync the URL via replaceState, which Next's usePathname() ignores.
const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  const interval = setInterval(onChange, 100);
  return () => {
    window.removeEventListener('popstate', onChange);
    clearInterval(interval);
  };
};

const firstSegment = (path: string) => path.split('/')[1] ?? '';

const useLocationPath = () => {
  const nextPathname = usePathname();
  return useSyncExternalStore(
    subscribe,
    () => {
      const locationPath = window.location.pathname;
      // Mid-navigation the URL still holds the previous route; trust Next until it commits.
      return firstSegment(locationPath) === firstSegment(nextPathname)
        ? locationPath
        : nextPathname;
    },
    () => nextPathname
  );
};

export default useLocationPath;
