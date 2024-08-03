import Help from '@app/components/Help';
import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Help Centre',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const HelpPage: NextPage = () => {
  return <Help />;
};

export default HelpPage;
