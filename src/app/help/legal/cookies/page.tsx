import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Cookies from '@app/components/Help/Legal/Cookies';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Cookie Policy');

const CookiesPage = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/legal/cookies"
        homeElement={'Help Centre'}
        names="Legal,Cookie Policy"
      />
      <Cookies />
    </section>
  );
};

export default CookiesPage;
