import Setup from '@app/components/Setup';
import type { NextPage } from 'next';
import { redirect } from 'next/navigation';

const SetupPage: NextPage = () => {
  redirect('/');
  return <Setup />;
};

export default SetupPage;
