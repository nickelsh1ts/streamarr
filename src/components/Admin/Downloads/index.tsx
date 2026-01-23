'use client';
import Alert from '@app/components/Common/Alert';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { DownloadClientSettings } from '@server/lib/settings';
import type { DownloadResultsResponse } from '@server/interfaces/api/downloadsInterfaces';
import {
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  FunnelIcon,
  BarsArrowDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/solid';
import useSWR from 'swr';
import Button from '@app/components/Common/Button';
import { FormattedMessage } from 'react-intl';
import { useCallback, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

enum Filter {
  ALL = 'all',
  ACTIVE = 'downloading',
  SEEDING = 'seeding',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ERRORED = 'errored',
}

type Client = 'all' | 'qbittorrent' | 'deluge' | 'transmission';

type Sort =
  | 'name'
  | 'size'
  | 'done'
  | 'status'
  | 'eta'
  | 'category'
  | 'down speed'
  | 'up speed'
  | 'ratio'
  | 'added on';

const AdminDownloads = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.ALL);
  const [currentSort, setCurrentSort] = useState<Sort>('done');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);
  const [currentClient, setCurrentClient] = useState<string>('all');

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const pageIndex = page - 1;

  const updateQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      router.push(pathname + '?' + params.toString());
    },
    [pathname, router, searchParams]
  );

  const { data } = useSWR<DownloadResultsResponse>(
    `/api/v1/downloads?filter=${currentFilter}&sort=${currentSort}&page=${
      pageIndex + 1
    }&pageSize=${currentPageSize}`
  );
  const { data: clients, isLoading } = useSWR<DownloadClientSettings[]>(
    '/api/v1/settings/downloads'
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const hasClients = clients && clients.length > 0;
  const hasNextPage = (data?.pageInfo.pages ?? 0) > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <div className="flex flex-col gap-4 mx-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Download Management</h1>
              <p className="text-sm text-gray-400">
                {hasClients
                  ? `${clients.length} client${clients.length !== 1 ? 's' : ''} configured`
                  : 'No clients configured'}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-grow flex-col sm:flex-row xl:flex-grow-0">
            <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 xl:flex-grow-0">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm">
                <ArrowDownTrayIcon className="h-6 w-6" />
              </span>
              <select
                id="client"
                name="client"
                value={currentClient}
                onChange={(e) => {
                  setCurrentClient(e.target.value as Client);
                }}
                className="select select-sm select-primary rounded-l-none w-full flex-1"
              >
                <option value="all">
                  <FormattedMessage id="downloads.clientAll" defaultMessage="All Clients" />
                </option>
                {clients?.map((client) => (
                  <option key={client.client} value={client.client}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 xl:flex-grow-0">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm">
                <FunnelIcon className="h-6 w-6" />
              </span>
              <select
                id="filter"
                name="filter"
                value={currentFilter}
                onChange={(e) => {
                  setCurrentFilter(e.target.value as Filter);
                }}
                className="select select-sm select-primary rounded-l-none w-full flex-1"
              >
                <option value="all">
                  <FormattedMessage id="common.all" defaultMessage="All" />
                </option>
                <option value="downloading">
                  <FormattedMessage
                    id="downloads.filterDownloading"
                    defaultMessage="Downloading"
                  />
                </option>
                <option value="seeding">
                  <FormattedMessage
                    id="downloads.filterSeeding"
                    defaultMessage="Seeding"
                  />
                </option>
                <option value="completed">
                  <FormattedMessage
                    id="downloads.filterCompleted"
                    defaultMessage="Completed"
                  />
                </option>
                <option value="paused">
                  <FormattedMessage
                    id="downloads.filterPaused"
                    defaultMessage="Paused"
                  />
                </option>
                <option value="errored">
                  <FormattedMessage
                    id="downloads.filterErrored"
                    defaultMessage="Errored"
                  />
                </option>
              </select>
            </div>
            <div className="mb-2 flex flex-grow sm:mb-0 xl:flex-grow-0 sm:mr-2">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 sm:text-sm">
                <BarsArrowDownIcon className="h-6 w-6" />
              </span>
              <select
                id="sort"
                name="sort"
                onChange={(e) => {
                  setCurrentSort(e.target.value as Sort);
                }}
                value={currentSort}
                className="select select-sm select-primary rounded-l-none block w-full flex-1"
              >
                <option value="name">
                  <FormattedMessage
                    id="downloads.sortName"
                    defaultMessage="Name"
                  />
                </option>
                <option value="size">
                  <FormattedMessage
                    id="downloads.sortSize"
                    defaultMessage="Size"
                  />
                </option>
                <option value="done">
                  <FormattedMessage
                    id="downloads.sortDone"
                    defaultMessage="Done"
                  />
                </option>
                <option value="status">
                  <FormattedMessage
                    id="downloads.sortStatus"
                    defaultMessage="Status"
                  />
                </option>
                <option value="eta">
                  <FormattedMessage
                    id="downloads.sortETA"
                    defaultMessage="ETA"
                  />
                </option>
                <option value="category">
                  <FormattedMessage
                    id="downloads.sortCategory"
                    defaultMessage="Category"
                  />
                </option>
                <option value="down speed">
                  <FormattedMessage
                    id="downloads.sortDownSpeed"
                    defaultMessage="Down Speed"
                  />
                </option>
                <option value="up speed">
                  <FormattedMessage
                    id="downloads.sortUpSpeed"
                    defaultMessage="Up Speed"
                  />
                </option>
                <option value="ratio">
                  <FormattedMessage
                    id="downloads.sortRatio"
                    defaultMessage="Ratio"
                  />
                </option>
                <option value="added on">
                  <FormattedMessage
                    id="downloads.sortAddedOn"
                    defaultMessage="Added On"
                  />
                </option>
              </select>
            </div>
            <Button
              as="link"
              buttonSize="sm"
              buttonType="primary"
              href="/admin/settings/services/downloads"
            >
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        <Alert type="info" title="Coming Soon">
          <div className="flex flex-col gap-2">
            <p>
              A unified download management interface is under development. This
              will allow you to manage torrents across all your configured
              download clients from a single view.
            </p>
          </div>
        </Alert>
        {!hasClients ? (
          <div className="card bg-base-200">
            <div className="card-body items-center text-center py-12">
              <ArrowDownTrayIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title">No Download Clients Configured</h2>
              <p className="text-gray-400 max-w-md">
                Add a download client in settings to get started. Currently
                supports qBittorrent, Deluge, and Transmission.
              </p>
              <div className="card-actions mt-4">
                <Button
                  as="link"
                  buttonSize="sm"
                  buttonType="primary"
                  href="/admin/settings/services/downloads"
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Configure Clients
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-base-200 border-2 border-dashed border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-full">
                <div className="flex items-center justify-between border-b border-base-300 pb-3 mb-4 opacity-40">
                  <div className="flex gap-2">
                    <div className="w-24 h-8 bg-base-300 rounded animate-pulse"></div>
                    <div className="w-24 h-8 bg-base-300 rounded animate-pulse"></div>
                  </div>
                  <div className="w-48 h-8 bg-base-300 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3 opacity-30">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 bg-base-300 rounded"
                    >
                      <div className="w-8 h-8 bg-base-100 rounded"></div>
                      <div className="flex-1 h-4 bg-base-100 rounded"></div>
                      <div className="w-16 h-4 bg-base-100 rounded"></div>
                      <div className="w-24 h-4 bg-base-100 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-gray-500 mt-6 text-sm">
                Torrent list will appear here
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8 mb-4 border-t border-primary pt-5 mx-4">
        <nav
          className="flex flex-col items-center space-x-4 space-y-3 px-6 py-3 sm:flex-row sm:space-y-0 md:w-full"
          aria-label="Pagination"
        >
          <div className="hidden lg:flex lg:flex-1">
            <p className="text-sm">
              {(data?.results.length ?? 0) > 0 && (
                <FormattedMessage
                  id="common.showingResults"
                  defaultMessage="Showing {start} to {end} of {total} results"
                  values={{
                    start: pageIndex * currentPageSize + 1,
                    end:
                      (data?.results.length ?? 0 < currentPageSize)
                        ? pageIndex * currentPageSize +
                          (data?.results.length ?? 0)
                        : (pageIndex + 1) * currentPageSize,
                    total: data?.pageInfo.results ?? 0,
                  }}
                />
              )}
            </p>
          </div>
          <div className="flex justify-center sm:flex-1 sm:justify-start md:justify-center">
            <span className="-mt-3 items-center text-sm sm:-ml-4 sm:mt-0 md:ml-0">
              <FormattedMessage
                id="common.resultsDisplay"
                defaultMessage="Display {select} results per page"
                values={{
                  select: (
                    <select
                      id="pageSize"
                      name="pageSize"
                      onChange={(e) => {
                        setCurrentPageSize(Number(e.target.value));
                      }}
                      value={currentPageSize}
                      className="select select-sm select-primary mx-1"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  ),
                }}
              />
            </span>
          </div>
          <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
            <Button
              buttonSize="sm"
              buttonType="primary"
              disabled={!hasPrevPage}
              onClick={() => updateQueryParams('page', (page - 1).toString())}
            >
              <ChevronLeftIcon className="size-5" />
              <span>
                <FormattedMessage
                  id="common.previous"
                  defaultMessage="Previous"
                />
              </span>
            </Button>
            <Button
              buttonSize="sm"
              buttonType="primary"
              disabled={!hasNextPage}
              onClick={() => updateQueryParams('page', (page + 1).toString())}
            >
              <span>
                <FormattedMessage id="common.next" defaultMessage="Next" />
              </span>
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default AdminDownloads;
