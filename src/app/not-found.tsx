import PathName from '@app/components/Common/PathName';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 – Streamarr',
};

export default function NotFound() {
  return (
    <div className="text-center my-auto">
      <h1 className="text-9xl">404</h1>
      <p className="text-4xl mb-3 capitalize">
        <PathName /> Not Found
      </p>
      <Link className="text-md btn btn-sm btn-primary" href="/">
        Return Home{' '}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </Link>
    </div>
  );
}
