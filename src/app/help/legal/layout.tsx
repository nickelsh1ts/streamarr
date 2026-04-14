import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Legal');

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-100">
      <Header />
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
  );
}
