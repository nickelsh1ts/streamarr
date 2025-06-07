import MoreHelp from '@app/components/Help/MoreHelp';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import type { Metadata } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr';

const messages = { title: 'Help Centre' };

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

export default function TopicsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main>
      <Header />
      {children}
      <MoreHelp />
      <Footer />
    </main>
  );
}
