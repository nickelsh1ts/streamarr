import Bookmark from '@app/components/Bookmark';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Bookmark');

const BookmarkPage: NextPage = () => {
  return <Bookmark />;
};
export default BookmarkPage;
