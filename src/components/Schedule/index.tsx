'use client';
import BigCalendar from '@app/components/Common/BigCalendar';
import Header from '@app/components/Common/Header';
import { FunnelIcon } from '@heroicons/react/24/solid';

const Schedule = () => {
    return (
      <div className="relative max-sm:mb-16">
        <div className="flex flex-col justify-between sm:flex-row sm:items-end max-w-screen-xl mx-auto px-2">
          <Header subtext="Movies & TV Shows">Release Schedule</Header>
          <div className="mt-2 flex flex-grow flex-col sm:flex-grow-0 sm:flex-row">
            <div className="flex flex-grow">
              <span className="btn btn-sm rounded-md btn-primary rounded-r-none pointer-events-none">
                <FunnelIcon className="h-6 w-6" />
              </span>
              <select
                id="filter"
                name="filter"
                onChange={() => {}}
                defaultValue={'all'}
                className="select select-sm select-primary rounded-l-none rounded-md"
              >
                <option value="all">All</option>
                <option value="movies">Movies only</option>
                <option value="shows">TV Shows only</option>
              </select>
            </div>
          </div>
        </div>
        <BigCalendar ReleaseEvents={[]} />
      </div>
    );
};
export default Schedule;
