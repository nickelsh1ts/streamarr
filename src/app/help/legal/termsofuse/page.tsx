import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TermsOfUse from '@app/components/Help/Legal/TermsOfUse';
import type { Metadata } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr';

const messages = { title: 'Terms of Use' };

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

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
