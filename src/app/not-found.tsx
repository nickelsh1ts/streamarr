import NotFound from '@app/components/NotFound';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 – Streamarr',
};

export default function NotFoundPage() {
  return <NotFound />;
}
