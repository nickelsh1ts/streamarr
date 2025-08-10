'use client';
import BigCalendar from '@app/components/Common/BigCalendar';
import Header from '@app/components/Common/Header';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { FormattedMessage, useIntl } from 'react-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

enum Filter {
  ALL = 'all',
  MOVIES = 'movies',
  SHOWS = 'shows',
}

const Schedule = () => {
  const intl = useIntl();
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.ALL);

  // Fetch calendar events from API
  const { data: sonarrEvents } = useSWR('/api/v1/calendar/sonarr', fetcher);
  const { data: radarrEvents } = useSWR('/api/v1/calendar/radarr', fetcher);

  // Combine and filter events as needed
  const events = useMemo(() => {
    let allEvents = [...(sonarrEvents ?? []), ...(radarrEvents ?? [])];
    if (currentFilter === Filter.MOVIES) {
      allEvents = radarrEvents ?? [];
    } else if (currentFilter === Filter.SHOWS) {
      allEvents = sonarrEvents ?? [];
    } else {
      allEvents = [...(sonarrEvents ?? []), ...(radarrEvents ?? [])];
    }
    // Map API event fields to BigCalendar eventProps
    return allEvents.map((e, idx) => ({
      id: e.uid ?? idx,
      title:
        e.summary ??
        intl.formatMessage({
          id: 'schedule.untitled',
          defaultMessage: 'Untitled',
        }),
      start: new Date(e.start),
      end: new Date(e.end),
      description: e.description,
      categories: e.categories ?? [],
      status: e.status ?? 'unknown',
      type: radarrEvents?.includes(e) ? 'movie' : 'show',
    }));
  }, [sonarrEvents, radarrEvents, currentFilter, intl]);

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem(
      'schedule-filter-settings'
    );
    if (filterString) {
      const filterSettings = JSON.parse(filterString);
      setCurrentFilter(filterSettings.currentFilter);
    }
    setHasLoadedSettings(true);
  }, []);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    if (!hasLoadedSettings) return;
    window.localStorage.setItem(
      'schedule-filter-settings',
      JSON.stringify({ currentFilter })
    );
  }, [currentFilter, hasLoadedSettings]);

  return (
    <div className="relative max-sm:mb-16 flex flex-col">
      <div className="flex flex-col justify-between sm:flex-row sm:items-end px-4">
        <Header>
          <FormattedMessage
            id="common.releaseSchedule"
            defaultMessage="Release Schedule"
          />
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-grow-0 sm:flex-row">
          <div className="flex flex-grow sm:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm text-primary-content">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
              }}
              value={currentFilter}
              className="select select-sm select-primary rounded-md rounded-l-none flex-1"
            >
              <option value="all">
                <FormattedMessage id="common.all" defaultMessage="All" />
              </option>
              <option value="movies">
                <FormattedMessage id="common.movies" defaultMessage="Movies" />
              </option>
              <option value="shows">
                <FormattedMessage id="common.shows" defaultMessage="Shows" />
              </option>
            </select>
          </div>
        </div>
      </div>
      <BigCalendar events={events} />
    </div>
  );
};
export default Schedule;
