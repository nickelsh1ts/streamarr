'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import { useDownloadActions, useDownloads } from '@app/hooks/useDownloads';
import { momentWithLocale } from '@app/utils/momentLocale';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowsUpDownIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { DownloadClientSettings } from '@server/lib/settings';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import AddTorrentModal from './AddTorrentModal';
import DownloadRow from './DownloadRow';
import RemoveTorrentModal from './RemoveTorrentModal';
import StatsCard from './StatsCard';

enum Filter {
  ALL = 'all',
  DOWNLOADING = 'downloading',
  SEEDING = 'seeding',
  INCOMPLETE = 'incomplete',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ERROR = 'error',
  STALLED = 'stalled',
  MOVING = 'moving',
  METADATA = 'metadata',
}

type Client = 'all' | 'qbittorrent' | 'deluge' | 'transmission';

type Sort =
  | 'name'
  | 'size'
  | 'progress'
  | 'status'
  | 'eta'
  | 'ratio'
  | 'addedDate'
  | 'speed'
  | 'priority'
  | 'client';

const AdminDownloads = () => {
  const intl = useIntl();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentFilter, setCurrentFilter] = useState<Filter>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = window.localStorage.getItem(
        'downloads-filter-settings'
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.currentFilter || Filter.ALL;
      }
    }
    return Filter.ALL;
  });
  const [currentSort, setCurrentSort] = useState<Sort>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = window.localStorage.getItem(
        'downloads-filter-settings'
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.currentSort || 'progress';
      }
    }
    return 'progress';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = window.localStorage.getItem(
        'downloads-filter-settings'
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.sortDirection || 'desc';
      }
    }
    return 'desc';
  });
  const [currentPageSize, setCurrentPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = window.localStorage.getItem(
        'downloads-filter-settings'
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.currentPageSize || 25;
      }
    }
    return 25;
  });
  const [currentClient, setCurrentClient] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = window.localStorage.getItem(
        'downloads-filter-settings'
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.currentClient || 'all';
      }
    }
    return 'all';
  });
  const [refreshInterval, setRefreshInterval] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = window.localStorage.getItem(
        'downloads-filter-settings'
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.refreshInterval || 2000;
      }
    }
    return 2000;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [showBulkRemoveModal, setShowBulkRemoveModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const { performBulkAction, retryClient } = useDownloadActions();

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

  const handleSort = useCallback(
    (sortField: Sort) => {
      if (currentSort === sortField) {
        // Toggle direction if clicking the same column
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        // New column, default to ascending
        setCurrentSort(sortField);
        setSortDirection('asc');
      }
    },
    [currentSort]
  );

  // Handle individual checkbox toggle
  const handleToggleSelect = useCallback((hash: string) => {
    setSelectedHashes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hash)) {
        newSet.delete(hash);
      } else {
        newSet.add(hash);
      }
      return newSet;
    });
  }, []);

  // Clear selections when filter/page changes
  const selectionResetKey = `${currentFilter}|${currentClient}|${page}`;
  const [prevSelectionResetKey, setPrevSelectionResetKey] =
    useState(selectionResetKey);
  if (prevSelectionResetKey !== selectionResetKey) {
    setPrevSelectionResetKey(selectionResetKey);
    setSelectedHashes(new Set());
  }

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'downloads-filter-settings',
      JSON.stringify({
        currentFilter,
        currentSort,
        sortDirection,
        currentPageSize,
        currentClient,
        refreshInterval,
      })
    );
  }, [
    currentFilter,
    currentSort,
    sortDirection,
    currentPageSize,
    currentClient,
    refreshInterval,
  ]);

  const {
    data,
    isLoading: isLoadingDownloads,
    isRefreshing,
    refetch,
  } = useDownloads({
    page: pageIndex + 1,
    pageSize: currentPageSize,
    sort: currentSort,
    sortDirection,
    statusFilter: currentFilter !== 'all' ? currentFilter : undefined,
    clientFilter: currentClient !== 'all' ? Number(currentClient) : undefined,
    refreshInterval,
    isPaused,
  });

  const { data: clients, isLoading: isLoadingClients } = useSWR<
    DownloadClientSettings[]
  >('/api/v1/settings/downloads');

  // Whether every visible download is currently selected (derived state)
  const isSelectAllChecked = useMemo(() => {
    if (data?.results && selectedHashes.size > 0) {
      return data.results.every((t) => selectedHashes.has(t.hash));
    }
    return false;
  }, [selectedHashes, data]);

  // Handle select all checkbox
  const handleSelectAll = useCallback(() => {
    if (isSelectAllChecked) {
      setSelectedHashes(new Set());
    } else {
      if (data?.results) {
        const allHashes = new Set(data.results.map((t) => t.hash));
        setSelectedHashes(allHashes);
      }
    }
  }, [isSelectAllChecked, data]);

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (
      action:
        | 'pause'
        | 'resume'
        | 'forceRecheck'
        | 'remove'
        | 'queueUp'
        | 'queueDown'
        | 'topPriority'
        | 'bottomPriority'
    ) => {
      if (selectedHashes.size === 0 || !data?.results) return;

      // Show confirmation modal for remove action
      if (action === 'remove') {
        setShowBulkRemoveModal(true);
        return;
      }

      setIsBulkActing(true);
      try {
        const selectedTorrents = data.results
          .filter((t) => selectedHashes.has(t.hash))
          .map((t) => ({ hash: t.hash, clientId: t.clientId }));

        // Use bulk action API
        await performBulkAction(selectedTorrents, action);

        // Clear selection after action
        setSelectedHashes(new Set());

        // Refresh data
        refetch();
      } catch (e) {
        Toast({
          type: 'error',
          message:
            e.response?.data?.message ||
            intl.formatMessage({
              id: 'downloads.actionError',
              defaultMessage: 'An error occurred while performing the action.',
            }),
          icon: <XCircleIcon className="size-7" />,
        });
      } finally {
        setIsBulkActing(false);
      }
    },
    [selectedHashes, data, performBulkAction, refetch, intl]
  );

  const handleBulkRemoveConfirm = useCallback(
    async (deleteFiles: boolean) => {
      if (selectedHashes.size === 0 || !data?.results) return;

      setIsBulkActing(true);
      try {
        const selectedTorrents = data.results
          .filter((t) => selectedHashes.has(t.hash))
          .map((t) => ({ hash: t.hash, clientId: t.clientId }));

        // Use bulk action API with deleteFiles option
        await performBulkAction(selectedTorrents, 'remove', deleteFiles);

        // Clear selection after action
        setSelectedHashes(new Set());
        setShowBulkRemoveModal(false);

        // Refresh data
        refetch();
      } catch (e) {
        Toast({
          type: 'error',
          message:
            e.response?.data?.message ||
            intl.formatMessage({
              id: 'downloads.actionError',
              defaultMessage: 'An error occurred while performing the action.',
            }),
          icon: <XCircleIcon className="size-7" />,
        });
      } finally {
        setIsBulkActing(false);
      }
    },
    [selectedHashes, data, performBulkAction, refetch, intl]
  );

  // Handle retry of unhealthy clients
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await retryClient();
      // Refetch downloads after retry
      await refetch();
    } catch (e) {
      Toast({
        type: 'error',
        title: intl.formatMessage({
          id: 'downloads.retryError',
          defaultMessage: 'Failed to retry client connection',
        }),
        message: e?.response?.data?.message || String(e),
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsRetrying(false);
    }
  }, [retryClient, refetch, intl]);

  // Check if any clients are unhealthy
  const unhealthyClients =
    data?.stats.filter(
      (s) => s.health?.status === 'unhealthy' || s.health?.status === 'retrying'
    ) || [];
  const hasUnhealthyClients = unhealthyClients.length > 0;

  // Only show full page loading on initial load when we have no data yet
  const isInitialLoading = (isLoadingClients || isLoadingDownloads) && !data;

  if (isInitialLoading) {
    return <LoadingEllipsis />;
  }

  const hasClients = clients && clients.length > 0;
  const hasNextPage = (data?.pageInfo.pages ?? 0) > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <div className="mx-4 mt-2 flex flex-col gap-4">
        <div className="flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <FormattedMessage
                  id="downloads.downloadManagement"
                  defaultMessage="Download Management"
                />
                {isRefreshing && (
                  <span className="loading loading-spinner text-primary loading-sm opacity-50" />
                )}
              </h1>
            </div>
          </div>
          <div className="mt-2 flex grow flex-col md:flex-row xl:grow-0">
            <div className="mb-2 flex grow md:mr-2 md:mb-0 lg:grow-0">
              <span className="border-primary bg-base-100 inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 text-sm">
                <ArrowDownTrayIcon className="h-6 w-6" />
              </span>
              <select
                id="client"
                name="client"
                value={currentClient}
                onChange={(e) => {
                  setCurrentClient(e.target.value as Client);
                }}
                className="select select-sm select-primary w-full flex-1 rounded-l-none"
              >
                <option value="all">
                  <FormattedMessage
                    id="downloads.clientAll"
                    defaultMessage="All Clients"
                  />
                </option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2 flex grow md:mr-2 md:mb-0 lg:grow-0">
              <span className="border-primary bg-base-100 inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 text-sm">
                <FunnelIcon className="h-6 w-6" />
              </span>
              <select
                id="filter"
                name="filter"
                value={currentFilter}
                onChange={(e) => {
                  setCurrentFilter(e.target.value as Filter);
                }}
                className="select select-sm select-primary w-full flex-1 rounded-l-none"
              >
                <option value="all">
                  <FormattedMessage id="common.all" defaultMessage="All" />
                </option>
                <option value="downloading">
                  <FormattedMessage
                    id="common.downloading"
                    defaultMessage="Downloading"
                  />
                </option>
                <option value="seeding">
                  <FormattedMessage
                    id="downloads.filterSeeding"
                    defaultMessage="Seeding"
                  />
                </option>
                <option value="incomplete">
                  <FormattedMessage
                    id="downloads.filterIncomplete"
                    defaultMessage="Incomplete"
                  />
                </option>
                <option value="completed">
                  <FormattedMessage
                    id="common.completed"
                    defaultMessage="Completed"
                  />
                </option>
                <option value="paused">
                  <FormattedMessage
                    id="common.paused"
                    defaultMessage="Paused"
                  />
                </option>
                <option value="error">
                  <FormattedMessage id="common.error" defaultMessage="Error" />
                </option>
                <option value="stalled">
                  <FormattedMessage
                    id="downloads.filterStalled"
                    defaultMessage="Stalled"
                  />
                </option>
                <option value="moving">
                  <FormattedMessage
                    id="downloads.filterMoving"
                    defaultMessage="Moving"
                  />
                </option>
                <option value="metadata">
                  <FormattedMessage
                    id="downloads.filterMetadata"
                    defaultMessage="Fetching Metadata"
                  />
                </option>
              </select>
            </div>
            <div className="mb-2 flex grow gap-2 md:mr-2 md:mb-0">
              <div className="flex items-center">
                <Tooltip
                  content={intl.formatMessage({
                    id: 'downloads.refreshIntervalTooltip',
                    defaultMessage: 'Refresh Interval (seconds)',
                  })}
                >
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value={refreshInterval / 1000}
                    onChange={(e) =>
                      setRefreshInterval(Number(e.target.value) * 1000)
                    }
                    className="input input-sm input-primary w-16 text-center"
                  />
                </Tooltip>
              </div>
              <Button
                type="button"
                buttonType={isPaused ? 'primary' : 'default'}
                buttonSize="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="max-md:grow"
              >
                {isPaused ? (
                  <PlayIcon className="size-5" />
                ) : (
                  <PauseIcon className="size-5" />
                )}
                <span className="ml-1">
                  {!isPaused ? (
                    <FormattedMessage
                      id="common.pause"
                      defaultMessage="Pause"
                    />
                  ) : (
                    <FormattedMessage
                      id="common.resume"
                      defaultMessage="Resume"
                    />
                  )}
                </span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                buttonSize="sm"
                buttonType="primary"
                onClick={() => setIsAddModalOpen(true)}
                className="max-md:grow"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                <FormattedMessage
                  id="downloads.addTorrent"
                  defaultMessage="Add Torrent"
                />
              </Button>
              <Button
                as="link"
                buttonSize="sm"
                buttonType="ghost"
                href="/admin/settings/services/downloads"
              >
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                <FormattedMessage
                  id="common.settings"
                  defaultMessage="Settings"
                />
              </Button>
            </div>
          </div>
        </div>
        {hasClients &&
          data?.stats &&
          data.stats.length > 0 &&
          (() => {
            const totalStats = data.stats.reduce(
              (acc, stat) => ({
                totalTorrents: acc.totalTorrents + stat.totalTorrents,
                downloadSpeed: acc.downloadSpeed + stat.totalDownloadSpeed,
                uploadSpeed: acc.uploadSpeed + stat.totalUploadSpeed,
              }),
              { totalTorrents: 0, downloadSpeed: 0, uploadSpeed: 0 }
            );
            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title={intl.formatMessage({
                    id: 'downloads.totalDownloads',
                    defaultMessage: 'Total Downloads',
                  })}
                  value={totalStats.totalTorrents}
                  icon={<ArrowsUpDownIcon className="h-6 w-6" />}
                />
                <StatsCard
                  title={intl.formatMessage({
                    id: 'downloads.downloadSpeed',
                    defaultMessage: 'Download Speed',
                  })}
                  value={totalStats.downloadSpeed}
                  format="speed"
                  icon={<ArrowDownTrayIcon className="h-6 w-6" />}
                />
                <StatsCard
                  title={intl.formatMessage({
                    id: 'downloads.uploadSpeed',
                    defaultMessage: 'Upload Speed',
                  })}
                  value={totalStats.uploadSpeed}
                  format="speed"
                  icon={<ArrowUpTrayIcon className="h-6 w-6" />}
                />
                <StatsCard
                  title={intl.formatMessage({
                    id: 'downloads.activeClients',
                    defaultMessage: 'Active Clients',
                  })}
                  value={data.stats.filter((s) => s.connected).length}
                  icon={<GlobeAltIcon className="size-7" />}
                  badge={
                    hasUnhealthyClients ? (
                      <div className="group flex items-center gap-1">
                        <Tooltip
                          className="normal-case"
                          content={
                            <div className="text-sm">
                              <div className="mb-1 font-semibold">
                                <FormattedMessage
                                  id="downloads.clientsUnhealthy"
                                  defaultMessage="{count} {count, plural, one {client} other {clients}} unreachable"
                                  values={{ count: unhealthyClients.length }}
                                />
                              </div>
                              {unhealthyClients.map((client) => (
                                <div key={client.clientId} className="text-xs">
                                  {client.clientName}
                                  {client.health?.cooldownUntil && (
                                    <span className="ml-1 opacity-70">
                                      (
                                      <FormattedMessage
                                        id="downloads.retryingIn"
                                        defaultMessage="retry in {time}"
                                        values={{
                                          time: momentWithLocale(
                                            client.health.cooldownUntil
                                          ).fromNow(true),
                                        }}
                                      />
                                      )
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          }
                        >
                          <Button
                            onClick={handleRetry}
                            disabled={isRetrying}
                            buttonSize="xs"
                            buttonType="ghost"
                            className="btn-circle text-warning hover:text-warning-content rounded-full!"
                            aria-label="Retry unhealthy clients"
                          >
                            {isRetrying ? (
                              <span className="loading loading-spinner text-primary loading-xs" />
                            ) : (
                              <ExclamationTriangleIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </Tooltip>
                        {!isRetrying && (
                          <span className="mb-1 w-full overflow-visible text-xs underline underline-offset-4 opacity-100 transition-all duration-150 group-hover:underline-offset-2 sm:w-0 sm:opacity-0 sm:group-hover:w-full sm:group-hover:opacity-100">
                            <FormattedMessage
                              id="downloads.retry"
                              defaultMessage="Retry"
                            />
                          </span>
                        )}
                      </div>
                    ) : undefined
                  }
                />
              </div>
            );
          })()}
        {!hasClients ? (
          <div className="card bg-base-200">
            <div className="card-body items-center py-12 text-center">
              <ArrowDownTrayIcon className="text-neutral mb-4 h-16 w-16" />
              <h2 className="card-title">
                <FormattedMessage
                  id="downloads.noClientsConfigured"
                  defaultMessage="No Download Clients Configured"
                />
              </h2>
              <p className="text-neutral max-w-md">
                <FormattedMessage
                  id="downloads.addClientInstructions"
                  defaultMessage="Add a download client in settings to get started. Currently supports qBittorrent, Deluge, and Transmission."
                />
              </p>
              <div className="card-actions mt-4">
                <Button
                  as="link"
                  buttonSize="sm"
                  buttonType="primary"
                  href="/admin/settings/services/downloads"
                >
                  <Cog6ToothIcon className="mr-2 h-4 w-4" />
                  <FormattedMessage
                    id="downloads.configureClients"
                    defaultMessage="Configure Clients"
                  />
                </Button>
              </div>
            </div>
          </div>
        ) : data?.results && data.results.length > 0 ? (
          <div className="card bg-base-200">
            <div className="mb-2 flex min-h-10 items-end justify-between px-4 pt-4">
              {selectedHashes.size > 0 && (
                <>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {selectedHashes.size}{' '}
                    <FormattedMessage
                      id="downloads.selected"
                      defaultMessage="selected"
                    />
                  </span>
                  <div className="flex flex-wrap justify-end gap-2 sm:gap-6">
                    {(() => {
                      // Check if any selected torrent has valid priority for queue management
                      const hasValidPriority = data.results
                        .filter((t) => selectedHashes.has(t.hash))
                        .some(
                          (t) => t.priority !== undefined && t.priority > 0
                        );

                      return (
                        hasValidPriority && (
                          <>
                            <select
                              className="select select-xs select-primary block w-auto min-w-16 pr-1 sm:hidden"
                              disabled={isBulkActing}
                              defaultValue=""
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'top') {
                                  handleBulkAction('topPriority');
                                } else if (value === 'up') {
                                  handleBulkAction('queueUp');
                                } else if (value === 'down') {
                                  handleBulkAction('queueDown');
                                } else if (value === 'bottom') {
                                  handleBulkAction('bottomPriority');
                                }
                                // Reset to placeholder
                                e.target.value = '';
                              }}
                            >
                              <option value="" disabled>
                                <FormattedMessage
                                  id="downloads.queueAction"
                                  defaultMessage="Queue"
                                />
                              </option>
                              <option value="top">
                                ⏫{' '}
                                {intl.formatMessage({
                                  id: 'downloads.actionTopPriority',
                                  defaultMessage: 'Move to Top',
                                })}
                              </option>
                              <option value="up">
                                ⬆️{' '}
                                {intl.formatMessage({
                                  id: 'downloads.actionQueueUp',
                                  defaultMessage: 'Move Up',
                                })}
                              </option>
                              <option value="down">
                                ⬇️{' '}
                                {intl.formatMessage({
                                  id: 'downloads.actionQueueDown',
                                  defaultMessage: 'Move Down',
                                })}
                              </option>
                              <option value="bottom">
                                ⏬{' '}
                                {intl.formatMessage({
                                  id: 'downloads.actionBottomPriority',
                                  defaultMessage: 'Move to Bottom',
                                })}
                              </option>
                            </select>
                            <div className="hidden gap-1 sm:flex">
                              <Button
                                buttonSize="xs"
                                buttonType="ghost"
                                onClick={() => handleBulkAction('topPriority')}
                                disabled={isBulkActing}
                                title={intl.formatMessage({
                                  id: 'downloads.actionTopPriority',
                                  defaultMessage: 'Move to Top',
                                })}
                              >
                                <ChevronDoubleUpIcon className="size-4" />
                              </Button>
                              <Button
                                buttonSize="xs"
                                buttonType="ghost"
                                onClick={() => handleBulkAction('queueUp')}
                                disabled={isBulkActing}
                                title={intl.formatMessage({
                                  id: 'downloads.actionQueueUp',
                                  defaultMessage: 'Move Up',
                                })}
                              >
                                <ChevronUpIcon className="size-4" />
                              </Button>
                              <Button
                                buttonSize="xs"
                                buttonType="ghost"
                                onClick={() => handleBulkAction('queueDown')}
                                disabled={isBulkActing}
                                title={intl.formatMessage({
                                  id: 'downloads.actionQueueDown',
                                  defaultMessage: 'Move Down',
                                })}
                              >
                                <ChevronDownIcon className="size-4" />
                              </Button>
                              <Button
                                buttonSize="xs"
                                buttonType="ghost"
                                onClick={() =>
                                  handleBulkAction('bottomPriority')
                                }
                                disabled={isBulkActing}
                                title={intl.formatMessage({
                                  id: 'downloads.actionBottomPriority',
                                  defaultMessage: 'Move to Bottom',
                                })}
                              >
                                <ChevronDoubleDownIcon className="size-4" />
                              </Button>
                            </div>
                          </>
                        )
                      );
                    })()}
                    <>
                      <select
                        className="select select-xs select-primary block w-auto min-w-16 pr-1 sm:hidden"
                        disabled={isBulkActing}
                        defaultValue=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'resume') {
                            handleBulkAction('resume');
                          } else if (value === 'pause') {
                            handleBulkAction('pause');
                          } else if (value === 'recheck') {
                            handleBulkAction('forceRecheck');
                          } else if (value === 'remove') {
                            handleBulkAction('remove');
                          }
                          // Reset to placeholder
                          e.target.value = '';
                        }}
                      >
                        <option value="" disabled>
                          <FormattedMessage
                            id="common.actions"
                            defaultMessage="Actions"
                          />
                        </option>
                        <option value="resume">
                          ▶️{' '}
                          {intl.formatMessage({
                            id: 'common.resume',
                            defaultMessage: 'Resume',
                          })}
                        </option>
                        <option value="pause">
                          ⏸️{' '}
                          {intl.formatMessage({
                            id: 'common.pause',
                            defaultMessage: 'Pause',
                          })}
                        </option>
                        <option value="recheck">
                          🔄{' '}
                          {intl.formatMessage({
                            id: 'downloads.actionForceRecheck',
                            defaultMessage: 'Force Recheck',
                          })}
                        </option>
                        <option value="remove">
                          🗑️{' '}
                          {intl.formatMessage({
                            id: 'common.remove',
                            defaultMessage: 'Remove',
                          })}
                        </option>
                      </select>
                      <div className="hidden gap-1 sm:flex">
                        <Button
                          buttonSize="xs"
                          buttonType="success"
                          onClick={() => handleBulkAction('resume')}
                          disabled={isBulkActing}
                          title={intl.formatMessage({
                            id: 'downloads.bulkResume',
                            defaultMessage: 'Resume Selected',
                          })}
                        >
                          <PlayIcon className="size-4" />
                        </Button>
                        <Button
                          buttonSize="xs"
                          buttonType="warning"
                          onClick={() => handleBulkAction('pause')}
                          disabled={isBulkActing}
                          title={intl.formatMessage({
                            id: 'downloads.bulkPause',
                            defaultMessage: 'Pause Selected',
                          })}
                        >
                          <PauseIcon className="size-4" />
                        </Button>
                        <Button
                          buttonSize="xs"
                          buttonType="info"
                          onClick={() => handleBulkAction('forceRecheck')}
                          disabled={isBulkActing}
                          title={intl.formatMessage({
                            id: 'downloads.bulkForceRecheck',
                            defaultMessage: 'Recheck Selected',
                          })}
                        >
                          <ArrowPathIcon className="size-4" />
                        </Button>
                        <Button
                          buttonSize="xs"
                          buttonType="error"
                          onClick={() => handleBulkAction('remove')}
                          disabled={isBulkActing}
                          title={intl.formatMessage({
                            id: 'downloads.bulkRemove',
                            defaultMessage: 'Remove Selected',
                          })}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </>
                  </div>
                </>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isSelectAllChecked}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.name"
                            defaultMessage="Name"
                          />
                        </span>
                        {currentSort === 'name' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('progress')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.progress"
                            defaultMessage="Progress"
                          />
                        </span>
                        {currentSort === 'progress' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('size')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.size"
                            defaultMessage="Size"
                          />
                        </span>
                        {currentSort === 'size' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('speed')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.speed"
                            defaultMessage="Speed"
                          />
                        </span>
                        {currentSort === 'speed' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('eta')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.eta"
                            defaultMessage="ETA"
                          />
                        </span>
                        {currentSort === 'eta' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('ratio')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.ratio"
                            defaultMessage="Ratio"
                          />
                        </span>
                        {currentSort === 'ratio' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.status"
                            defaultMessage="Status"
                          />
                        </span>
                        {currentSort === 'status' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('client')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="downloads.client"
                            defaultMessage="Client"
                          />
                        </span>
                        {currentSort === 'client' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="hover:bg-base-300 cursor-pointer transition-colors select-none"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          <FormattedMessage
                            id="common.priority"
                            defaultMessage="Priority"
                          />
                        </span>
                        {currentSort === 'priority' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th>
                      <FormattedMessage
                        id="common.actions"
                        defaultMessage="Actions"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((torrent) => (
                    <DownloadRow
                      key={torrent.id}
                      torrent={torrent}
                      onRefresh={refetch}
                      isSelected={selectedHashes.has(torrent.hash)}
                      onToggleSelect={handleToggleSelect}
                      clients={clients ?? []}
                      stats={data.stats}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card bg-base-200">
            <div className="card-body items-center py-12 text-center">
              <ArrowsUpDownIcon className="text-neutral mb-4 size-12" />
              <h2 className="card-title">
                <FormattedMessage
                  id="common.noDownloadsFound"
                  defaultMessage="No Downloads Found"
                />
              </h2>
              <p className="text-neutral max-w-md">
                {currentFilter !== 'all' || currentClient !== 'all' ? (
                  <FormattedMessage
                    id="common.tryAdjustingFilters"
                    defaultMessage="Try adjusting your filters or add a new torrent."
                  />
                ) : (
                  <FormattedMessage
                    id="common.addFirstTorrent"
                    defaultMessage="Add your first torrent to get started."
                  />
                )}
              </p>
              <div className="card-actions mt-4">
                <Button
                  buttonSize="sm"
                  buttonType="primary"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  <FormattedMessage
                    id="downloads.addTorrent"
                    defaultMessage="Add Torrent"
                  />
                </Button>
              </div>
            </div>
          </div>
        )}
        <AddTorrentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          clients={clients ?? []}
        />
        <RemoveTorrentModal
          isOpen={showBulkRemoveModal}
          onClose={() => setShowBulkRemoveModal(false)}
          onConfirm={handleBulkRemoveConfirm}
          torrentName={intl.formatMessage(
            {
              id: 'downloads.bulkRemoveTorrents',
              defaultMessage:
                '{count} selected {count, plural, one {torrent} other {torrents}}',
            },
            { count: selectedHashes.size }
          )}
          torrentCount={selectedHashes.size}
          isProcessing={isBulkActing}
        />
      </div>
      <div className="border-primary mx-4 mt-8 mb-4 border-t pt-5">
        <nav
          className="flex flex-col items-center space-y-3 space-x-4 px-6 py-3 sm:flex-row sm:space-y-0 md:w-full"
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
            <span className="-mt-3 items-center text-sm sm:mt-0 sm:-ml-4 md:ml-0">
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
                      className="select select-sm select-primary mx-1 w-auto min-w-16 shrink-0"
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
