import WhatIsStreamarr from '@app/components/Help/Topics/GettingStarted/WhatIsStreamarr';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';

const messages = { title: 'Help Centre' };

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

const WhatIsStreamarrPage = () => {
  return <WhatIsStreamarr />;
};
export default WhatIsStreamarrPage;
