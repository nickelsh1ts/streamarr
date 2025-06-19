import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TermsOfUse from '@app/components/Help/Legal/TermsOfUse';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';

const messages = { title: 'Terms of Use' };

export async function generateMetadata(): Promise<Metadata> {
  const res = await fetch(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`,
    { cache: 'no-store' }
  );
  const currentSettings: PublicSettingsResponse = await res.json();

  return {
    title: `${messages.title} - ${currentSettings.applicationTitle}`,
  };
}

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
