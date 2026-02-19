import MoreHelp from '@app/components/Help/MoreHelp';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Help Centre');

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
