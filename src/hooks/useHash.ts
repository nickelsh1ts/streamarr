'use client';
import { useSyncExternalStore } from 'react';

// Polling covers iframe-driven replaceState, which fires no hashchange.
const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  const interval = setInterval(onChange, 100);
  return () => {
    window.removeEventListener('hashchange', onChange);
    clearInterval(interval);
  };
};

const useHash = () => {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => ''
  );

  return hash || null;
};

export default useHash;
