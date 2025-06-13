import Setup from '@app/components/Setup';
import type { Metadata, NextPage } from 'next';

export const metadata: Metadata = {
  title: `Setup - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const SetupPage: NextPage = () => {
  return <Setup />;
};

export default SetupPage;
