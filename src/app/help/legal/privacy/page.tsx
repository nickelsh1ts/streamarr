import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Privacy from '@app/components/Help/Legal/Privacy';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Privacy Statement');

const PrivacyPage = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/legal/privacy"
        homeElement={'Help Centre'}
        names="Legal,Privacy Statement"
      />
      <Privacy />
    </section>
  );
};

export default PrivacyPage;
