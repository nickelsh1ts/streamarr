import PathName from '@app/components/Common/PathName';
import Header from '@app/components/Layout/Header';
import Footer from '@app/components/Layout/Footer';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 – Streamarr',
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="my-auto text-center">
        <h1 className="text-9xl">404</h1>
        <h2 className="text-3xl my-3">
          <PathName />
        </h2>
        <p className="text-4xl mb-3">Not Found</p>
        <Link className="text-md" href="/">
          Return Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
