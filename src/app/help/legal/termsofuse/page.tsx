import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TermsOfUse from '@app/components/Help/Legal/TermsOfUse';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Terms of Use');

const TermsPage = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/legal/termsofuse"
        homeElement={'Help Centre'}
        names="Legal,Terms of Use"
      />
      <TermsOfUse />
    </section>
  );
};

export default TermsPage;
