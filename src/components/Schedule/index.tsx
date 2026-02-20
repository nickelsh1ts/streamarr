'use client';
import BigCalendar from '@app/components/Common/BigCalendar';
import Header from '@app/components/Common/Header';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useMemo } from 'react';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import useSWR from 'swr';
import { FormattedMessage, useIntl } from 'react-intl';

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

const calendarSwrOptions = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  keepPreviousData: true,
};

enum Filter {
  ALL = 'all',
  MOVIES = 'movies',
  SHOWS = 'shows',
  LOCAL = 'local',
}

const Schedule = () => {
  const intl = useIntl();
  const [currentFilter, setCurrentFilter] = useState<Filter>(() => {
    if (typeof window !== 'undefined') {
      const filterString = window.localStorage.getItem(
        'schedule-filter-settings'
      );
      if (filterString) {
        const filterSettings = JSON.parse(filterString);
        return filterSettings.currentFilter || Filter.ALL;
      }
    }
    return Filter.ALL;
  });

  // Fetch calendar events from API with SWR caching
  const {
    data: sonarrEvents,
    isLoading: isSonarrLoading,
    isValidating: isSonarrValidating,
  } = useSWR('/api/v1/calendar/sonarr', fetcher, calendarSwrOptions);
  const {
    data: radarrEvents,
    isLoading: isRadarrLoading,
    isValidating: isRadarrValidating,
  } = useSWR('/api/v1/calendar/radarr', fetcher, calendarSwrOptions);
  const {
    data: localEvents,
    isLoading: isLocalLoading,
    isValidating: isLocalValidating,
    mutate: revalidateEvents,
  } = useSWR('/api/v1/calendar/local', fetcher, calendarSwrOptions);

  // Loading states
  const isInitialLoading = isSonarrLoading || isRadarrLoading || isLocalLoading;
  const isRevalidating =
    !isInitialLoading &&
    (isSonarrValidating || isRadarrValidating || isLocalValidating);

  // Combine and filter events as needed
  const events = useMemo(() => {
    let allEvents = [
      ...(sonarrEvents ?? []),
      ...(radarrEvents ?? []),
      ...(localEvents ?? []),
    ];
    if (currentFilter === Filter.MOVIES) {
      allEvents = radarrEvents ?? [];
    } else if (currentFilter === Filter.SHOWS) {
      allEvents = sonarrEvents ?? [];
    } else if (currentFilter === Filter.LOCAL) {
      allEvents = localEvents ?? [];
    }
    // Map API event fields to BigCalendar eventProps
    return allEvents.map((e, idx) => ({
      id: e.id ?? idx,
      uid: e.uid ?? `unknown-${idx}`,
      title:
        e.summary ??
        intl.formatMessage({
          id: 'schedule.untitled',
          defaultMessage: 'Untitled',
        }),
      start: moment(e.start).toDate(),
      end: moment(e.end).toDate(),
      description: e.description,
      categories: e.categories ?? [],
      status: e.status ?? 'unknown',
      allDay: e.allDay ?? false,
      sendNotification: e.sendNotification ?? false,
      createdBy: e.createdBy,
      type: radarrEvents?.includes(e)
        ? 'movie'
        : sonarrEvents?.includes(e)
          ? 'show'
          : 'local',
    }));
  }, [sonarrEvents, radarrEvents, localEvents, currentFilter, intl]);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'schedule-filter-settings',
      JSON.stringify({ currentFilter })
    );
  }, [currentFilter]);

  return (
    <div className="relative max-sm:mb-16 flex flex-col">
      <div className="flex flex-col justify-between sm:flex-row sm:items-end px-4">
        <Header>
          <span className="flex items-center gap-2">
            <FormattedMessage
              id="common.releaseSchedule"
              defaultMessage="Release Schedule"
            />
            {(isRevalidating || isInitialLoading) && (
              <span className="loading loading-spinner text-primary loading-sm sm:loading-md opacity-50" />
            )}
          </span>
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-grow-0 sm:flex-row">
          <div className="flex flex-grow sm:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm">
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
              <option value="local">
                <FormattedMessage id="common.local" defaultMessage="Local" />
              </option>
            </select>
          </div>
        </div>
      </div>
      <BigCalendar events={events} revalidateEvents={revalidateEvents} />
    </div>
  );
};
export default Schedule;
