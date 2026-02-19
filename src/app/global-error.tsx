'use client'; // Error components must be Client Components

import {
  ArrowLeftCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useEffect } from 'react';

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

  // global-error replaces the entire root layout, so no CSS is available.
  // All styles must be inline.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#1f1f1f',
          color: '#fff',
        }}
      >
        <main
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '2rem',
              maxWidth: '480px',
              textAlign: 'center',
            }}
          >
            <ExclamationTriangleIcon
              style={{ width: 56, height: 56, color: '#ffc107' }}
            />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              500 - Server Error
            </h3>
            <div
              style={{
                backgroundColor: '#2a1515',
                border: '1px solid #b91c1c',
                borderRadius: 8,
                padding: '1rem',
                width: '100%',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                {error.name}
              </h4>
              <code
                style={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  fontSize: '0.875rem',
                  color: '#f87171',
                }}
              >
                {error.message}
              </code>
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.5rem 1rem',
                border: '1px solid #b91c1c',
                borderRadius: 6,
                color: '#f87171',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Home Page
              <ArrowLeftCircleIcon style={{ width: 20, height: 20 }} />
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
