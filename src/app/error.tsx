'use client'; // Error components must be Client Components

import type { Metadata } from 'next';
import Link from 'next/link';
import { useEffect } from 'react';

export const metadata: Metadata = {
  title: 'ERROR – Streamarr',
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="mt-auto text-center">
      <h2 className="text-3xl my-3">Something went wrong!</h2>
      <Link
        className="text-md"
        href={''}
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Link>
    </main>
  );
}