import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Privacy from '@app/components/Help/Legal/Privacy';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';

const messages = { title: 'Privacy Statement' };

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
