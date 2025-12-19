'use client';

import { useEffect, useState } from 'react';

const getHash = () =>
  typeof window !== 'undefined' ? window.location.hash : '';

const useHash = () => {
  const [hash, setHash] = useState(getHash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(getHash());
    };

    // Listen to hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Polling fallback for iframe navigation that may not trigger hashchange
    let lastHash = getHash();
    const interval = setInterval(() => {
      const newHash = getHash();
      if (newHash !== lastHash) {
        lastHash = newHash;
        setHash(newHash);
      }
    }, 100);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(interval);
    };
  }, []);

  return hash || null;
};

export default useHash;
