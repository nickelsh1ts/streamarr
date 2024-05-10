import LoginPage from '@app/components/login-page';
import type { Metadata, NextPage } from 'next';

export const metadata: Metadata = {
  title: 'Stream the greatest Movies, Series, Classics and more - Streamarr',
};

const Index: NextPage = () => {
  return <LoginPage />;
};

export default Index;
