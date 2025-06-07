import NotFound from '@app/components/NotFound';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `404 – ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

export default function NotFoundPage() {
  return <NotFound />;
}
