import Schedule from '@app/components/Schedule';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Schedule',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const SchedulePage = () => {
  return <Schedule />;
};
export default SchedulePage;
