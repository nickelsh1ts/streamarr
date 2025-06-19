'use client'; // Error components must be Client Components

import Alert from '@app/components/Common/Alert';
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorProps {
  statusCode?: number;
  name?: string;
  message?: string;
}

export default function Error({
  error,
  statusCode,
  reset,
}: {
  error: (Error & { name: string; message: string }) | ErrorProps;
  statusCode?: ErrorProps['statusCode'];
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const getErrorMessage = (statusCode?: number) => {
    switch (statusCode) {
      case 500:
        return 'Internal Server Error';
      case 503:
        return 'Service Unavailable';
      default:
        return statusCode ? 'Something went wrong!' : 'Oops';
    }
  };

  return (
    <main className="w-full h-full place-items-center my-auto">
      <div className="flex flex-col items-center w-full">
        <ExclamationCircleIcon className="size-14 text-warning" />
        <h3 className="text-3xl font-bold mb-8 text-center">
          {statusCode
            ? statusCode + ' - ' + getErrorMessage(statusCode)
            : getErrorMessage(statusCode)}
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
