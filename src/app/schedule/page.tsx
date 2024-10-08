import BigCalendar from '@app/components/Common/BigCalendar';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Schedule',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const SchedulePage = () => {
  return (
    <div className="relative">
      <BigCalendar />
    </div>
  );
};
export default SchedulePage;
