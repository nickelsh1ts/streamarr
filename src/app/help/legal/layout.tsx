import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Legal',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
