import Setup from '@app/components/Setup';
import type { Metadata, NextPage } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: `Setup - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const SetupPage: NextPage = () => {
  redirect('/');
  return <Setup />;
};

export default SetupPage;
