import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Privacy from '@app/components/Help/Legal/Privacy';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Privacy Statement',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

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
