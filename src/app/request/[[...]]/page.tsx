/* eslint-disable @next/next/no-css-tags */
import Request from '@app/components/Request';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata, NextPage } from 'next';

const messages = { title: 'Request' };

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

const RequestPage: NextPage = () => {
  return (
    <Request>
      <link rel="stylesheet" href="/request.css" />
    </Request>
  );
};
export default RequestPage;
