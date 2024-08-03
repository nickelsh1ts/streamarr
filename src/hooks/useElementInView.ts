'use client';
import type { RefObject } from 'react';
import { useEffect, useState, useRef } from 'react';

/**
 * Custom Hook to determine if an element is in the viewport.
 * @param threshold Margin around the root, similar to the CSS margin property.
 * @returns A boolean state indicating visibility.
 */
export const useInView = (
  ref: RefObject<HTMLElement>,
  threshold: number = 0.5
) => {
  const [isInView, setInView] = useState(false);

  // Use a single instance of IntersectionObserver
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect(); // Disconnect previous observer if it exists
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Set state based on whether the element is intersecting
        setInView(entries[0].isIntersecting);
      },
      { threshold }
    );

    const { current } = ref;
    if (current) {
      observerRef.current.observe(current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [ref, threshold]); // Re-run effect if ref or threshold changes

  return isInView;
};
