'use client';
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export const useMutationObserver = (
  ref: RefObject<Element>,
  options: MutationObserverInit = { childList: true, subtree: true }
): MutationRecord[] => {
  const [mutationList, setMutationList] = useState<MutationRecord[]>([]);

  useEffect(() => {
    if (ref?.current) {
      const observer = new MutationObserver((mutations) => {
        setMutationList(mutations);
      });

      observer.observe(ref.current, options);

      return () => observer.disconnect();
    }
  }, [ref, options]);

  return mutationList;
};
