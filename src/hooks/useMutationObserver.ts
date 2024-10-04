'use client';
import { useEffect, useState } from 'react';

export const useMutationObserver = (ref, options) => {
  const [mutationList, setMutationList] = useState([]);

  useEffect(() => {
    if (ref) {
      const observer = new MutationObserver((mutations) => {
        setMutationList(mutations);
      });

      observer.observe(ref.current, options);

      return () => observer.disconnect();
    }
  }, [ref, options]);

  return mutationList;
};
