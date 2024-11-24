'use client'; // Error components must be Client Components

import Alert from '@app/components/Common/Alert';
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useEffect } from 'react';

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
    <main className="w-full h-full place-items-center my-auto">
      <div className="flex flex-col items-center w-full">
        <ExclamationCircleIcon className="size-14 text-warning" />
        <h3 className="text-3xl font-bold mb-8 text-center">
          Oops! Something went wrong!
        </h3>
        <Alert type="error">
          <div className="flex flex-col w-full">
            <h2 className="text-xl -mt-1 mb-2 ml-2">{error.name}</h2>
            <code className="whitespace-normal">{error.message}</code>
          </div>
        </Alert>
        <Link
          className="btn btn-warning btn-sm rounded-md"
          href={''}
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again <ArrowPathIcon className="size-5" />
        </Link>
      </div>
    </main>
  );
}
