import AdminMovies from '@app/components/Admin/Movies';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Movies - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const MoviesPage = () => {
  return <AdminMovies />;
};
export default MoviesPage;
