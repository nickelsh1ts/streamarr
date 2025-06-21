'use client';
import BigCalendar from '@app/components/Common/BigCalendar';
import Header from '@app/components/Common/Header';
import demoschedule from '@app/components/Schedule/demoschedule';
import { FunnelIcon } from '@heroicons/react/24/solid';

// TODO Implement the actual schedule functionality, including API calls and state management

const Schedule = () => {
  return (
    <div className="relative max-sm:mb-16 flex flex-col">
      <div className="flex flex-col justify-between sm:flex-row sm:items-end px-4">
        <Header>Release Schedule</Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-grow-0 sm:flex-row">
          <div className="flex flex-grow sm:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm text-primary-content">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              onChange={() => {}}
              defaultValue={'all'}
              className="select select-sm select-primary rounded-md rounded-l-none flex-1"
            >
              <option value="all">All</option>
              <option value="movies">Movies only</option>
              <option value="shows">TV Shows only</option>
            </select>
          </div>
        </div>
      </div>
      <BigCalendar ReleaseEvents={demoschedule} />
    </div>
  );
};
export default Schedule;
