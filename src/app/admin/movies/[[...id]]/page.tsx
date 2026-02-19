import AdminMovies from '@app/components/Admin/Movies';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Movies');

const MoviesPage = () => {
  return <AdminMovies />;
};
export default MoviesPage;
