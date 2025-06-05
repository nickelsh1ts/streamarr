'use client'; // Error components must be Client Components

import Alert from '@app/components/Common/Alert';
import {
  ArrowLeftCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import type { Metadata } from 'next';
import Link from 'next/link';
import { useEffect } from 'react';

export const metadata: Metadata = {
  title: `ERROR – ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    // global-error must include html and body tags
    <html lang="en">
      <body>
        <main className="w-full h-dvh place-items-center my-auto">
          <div className="flex flex-col items-center w-full h-full place-content-center">
            <ExclamationTriangleIcon className="size-14 text-error" />
            <h3 className="text-3xl font-bold mb-8 text-center">
              500 - Server Error
            </h3>
            <Alert type="error">
              <div className="flex flex-col w-full">
                <h2 className="text-xl -mt-1 mb-2 ml-2">{error.name}</h2>
                <code className="whitespace-normal">{error.message}</code>
              </div>
            </Alert>
            <Link
              className="btn btn-error btn-outline btn-sm rounded-md"
              href={'/'}
            >
              Home Page <ArrowLeftCircleIcon className="size-5" />
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
