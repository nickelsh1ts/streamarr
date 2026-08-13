import Index from '@app/components/Index';
import {
  generatePageMetadata,
  getServerUser,
} from '@app/utils/serverFetchHelpers';
import { redirect } from 'next/navigation';

export const generateMetadata = () =>
  generatePageMetadata('Stream the greatest Movies, Shows, Classics and more');

const IndexPage = async () => {
  const user = await getServerUser();
  if (user) {
    redirect(user.active ? '/watch' : '/profile');
  }

  return <Index />;
};

export default IndexPage;
