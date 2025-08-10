'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CopyButton from '@app/components/Common/CopyButton';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Table from '@app/components/Common/Table';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import useDebouncedState from '@app/hooks/useDebouncedState';
import { useIntl, FormattedMessage } from 'react-intl';
import {
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  FunnelIcon,
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import type {
  LogMessage,
  LogsResultsResponse,
} from '@server/interfaces/api/settingsInterfaces';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

type Filter = 'debug' | 'info' | 'warn' | 'error';

const LogsSettings = () => {
  const intl = useIntl();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<Filter>('debug');
  const [currentPageSize, setCurrentPageSize] = useState(25);
  const [searchFilter, debouncedSearchFilter, setSearchFilter] =
    useDebouncedState('');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [activeLog, setActiveLog] = useState<{
    isOpen: boolean;
    log?: LogMessage;
  }>({ isOpen: false });

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

  const toggleLogs = () => {
    setRefreshInterval(refreshInterval === 5000 ? 0 : 5000);
  };

  const { data, error } = useSWR<LogsResultsResponse>(
    `/api/v1/settings/logs?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}${
      debouncedSearchFilter ? `&search=${debouncedSearchFilter}` : ''
    }`,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: false,
    }
  );

  const { data: appData } = useSWR('/api/v1/status/appdata');

  useEffect(() => {
    const filterString = window.localStorage.getItem('logs-display-settings');
    if (filterString) {
      const filterSettings = JSON.parse(filterString);
      setCurrentFilter(filterSettings.currentFilter);
      setCurrentPageSize(filterSettings.currentPageSize);
    }
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) return;
    window.localStorage.setItem(
      'logs-display-settings',
      JSON.stringify({
        currentFilter,
        currentPageSize,
      })
    );
  }, [currentFilter, currentPageSize, hasLoadedSettings]);

  const copyLogString = (log: LogMessage) => {
    return `${log.timestamp} [${log.level}]${log.label ? `[${log.label}]` : ''}: ${
      log.message
    }${log.data ? `${JSON.stringify(log.data)}` : ''}`;
  };

  const handleCopyLog = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      Toast({
        icon: <ClipboardDocumentCheckIcon className="size-7" />,
        title: intl.formatMessage(
          {
            id: 'common.copied',
          },
          {
            item: intl.formatMessage({
              id: 'logs.logMessage',
              defaultMessage: 'Log Message',
            }),
          }
        ),
        type: 'primary',
      });
    } catch {
      Toast({
        icon: <ClipboardDocumentCheckIcon className="size-7" />,
        title: intl.formatMessage({
          id: 'logs.copyError',
          defaultMessage: 'Failed to copy log message.',
        }),
        type: 'error',
      });
    }
  };

  if (!data && error) {
    throw new Error(error);
  }

  const hasNextPage = (data?.pageInfo.pages ?? 0) > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <div className="my-6">
      <Modal
        title={intl.formatMessage({
          id: 'logs.modal.title',
          defaultMessage: 'Log Details',
        })}
        onCancel={() => setActiveLog({ log: activeLog.log, isOpen: false })}
        onOk={() => handleCopyLog(copyLogString(activeLog.log))}
        okText={intl.formatMessage({
          id: 'copyButton.tooltip',
          defaultMessage: 'Copy to Clipboard',
        })}
        show={activeLog.isOpen}
      >
        {activeLog && (
          <>
            <div className="grid mt-5 grid-cols-3 items-start gap-4">
              <div>
                <FormattedMessage
                  id="logs.modal.timestamp"
                  defaultMessage="Timestamp"
                />
              </div>
              <div className="mb-1 text-sm font-medium leading-5 text-neutral-400 sm:mt-2">
                <div className="flex max-w-lg items-center">
                  {moment(activeLog.log?.timestamp).format('lll').toString()}
                </div>
              </div>
            </div>
            <div className="grid mt-5 grid-cols-3 items-start gap-4">
              <div>
                <FormattedMessage
                  id="logs.modal.severity"
                  defaultMessage="Severity"
                />
              </div>
              <div className="mb-1 text-sm font-medium leading-5 text-neutral-400 sm:mt-2">
                <div className="flex max-w-lg items-center">
                  <Badge
                    badgeType={
                      activeLog.log?.level === 'error'
                        ? 'error'
                        : activeLog.log?.level === 'warn'
                          ? 'warning'
                          : activeLog.log?.level === 'info'
                            ? 'success'
                            : 'default'
                    }
                  >
                    {activeLog.log?.level.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid mt-5 grid-cols-3 items-start gap-4">
              <div>
                <FormattedMessage
                  id="logs.modal.label"
                  defaultMessage="Label"
                />
              </div>
              <div className="mb-1 text-sm font-medium leading-5 text-neutral-400 sm:mt-2">
                <div className="flex max-w-lg items-center">
                  {activeLog.log?.label}
                </div>
              </div>
            </div>
            <div className="grid mt-5 grid-cols-3 items-start gap-4">
              <div>
                <FormattedMessage
                  id="logs.modal.message"
                  defaultMessage="Message"
                />
              </div>
              <div className="col-span-2 mb-1 text-sm font-medium leading-5 text-neutral-400 sm:mt-2">
                <div className="flex max-w-lg items-center">
                  {activeLog.log?.message}
                </div>
              </div>
            </div>
            {activeLog.log?.data && (
              <div className="grid grid-cols-1 space-y-4 mt-5">
                <div>
                  <FormattedMessage
                    id="logs.modal.additionalData"
                    defaultMessage="Additional Data"
                  />
                </div>
                <div className="col-span-2 mb-1 text-sm font-medium leading-5 text-neutral-400 sm:mt-2">
                  <code className="block max-h-64 w-full overflow-auto text-clip whitespace-pre bg-neutral-800 px-6 py-4 ring-1 ring-neutral-700">
                    {JSON.stringify(activeLog.log?.data, null, ' ')}
                  </code>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage id="logs.title" defaultMessage="Logs" />
      </h3>
      <p className="mb-5 overflow-hidden w-full">
        <FormattedMessage
          id="logs.description"
          defaultMessage="You can also view these logs directly via {stdout}, or in {logPath}"
          values={{
            stdout: <code>stdout</code>,
            logPath: (
              <code className="max-sm:block overflow-hidden text-ellipsis">
                ${appData ? appData.appDataPath : '/app/config'}
                /logs/streamarr.log
              </code>
            ),
          }}
        />
      </p>
      <div className="mt-2 flex flex-grow flex-col md:flex-grow-0 sm:flex-row sm:justify-end">
        <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 md:flex-grow-0">
          <span className="btn btn-sm rounded-md btn-primary rounded-r-none px-3 text-sm pointer-events-none">
            <MagnifyingGlassIcon className="size-5" />
          </span>
          <input
            type="text"
            className="input input-sm input-primary rounded-l-none rounded-md flex-1"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value as string)}
          />
        </div>
        <div className="mb-2 flex flex-1 flex-row justify-between sm:mb-0 sm:flex-none">
          <Button
            type="button"
            className="mr-2 flex flex-grow rounded-md"
            buttonType={refreshInterval ? 'default' : 'primary'}
            buttonSize="sm"
            onClick={() => toggleLogs()}
          >
            {refreshInterval > 0 ? (
              <PauseIcon className="size-5" />
            ) : (
              <PlayIcon className="size-5 font-bold" />
            )}
            <span className="ml-2">
              {refreshInterval ? (
                <FormattedMessage id="logs.pause" defaultMessage="Pause" />
              ) : (
                <FormattedMessage id="logs.resume" defaultMessage="Resume" />
              )}
            </span>
          </Button>
          <div className="flex flex-grow">
            <span className="btn btn-sm rounded-md btn-primary rounded-r-none pointer-events-none">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              value={currentFilter}
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
              }}
              className="select select-sm select-primary rounded-l-none rounded-md flex-1"
            >
              <option value="debug">
                {intl.formatMessage({
                  id: 'logs.filter.debug',
                  defaultMessage: 'Debug',
                })}
              </option>
              <option value="info">
                {intl.formatMessage({
                  id: 'logs.filter.info',
                  defaultMessage: 'Info',
                })}
              </option>
              <option value="warn">
                {intl.formatMessage({
                  id: 'logs.filter.warn',
                  defaultMessage: 'Warn',
                })}
              </option>
              <option value="error">
                {intl.formatMessage({
                  id: 'logs.filter.error',
                  defaultMessage: 'Error',
                })}
              </option>
            </select>
          </div>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Table.TH>
              <FormattedMessage
                id="logs.modal.timestamp"
                defaultMessage="Timestamp"
              />
            </Table.TH>
            <Table.TH>
              <FormattedMessage
                id="logs.modal.severity"
                defaultMessage="Severity"
              />
            </Table.TH>
            <Table.TH>
              <FormattedMessage id="logs.modal.label" defaultMessage="Label" />
            </Table.TH>
            <Table.TH>
              <FormattedMessage
                id="logs.modal.message"
                defaultMessage="Message"
              />
            </Table.TH>
            <Table.TH></Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {!data ? (
            <tr>
              <Table.TD colSpan={5} noPadding>
                <LoadingEllipsis />
              </Table.TD>
            </tr>
          ) : (
            data.results.map((row: LogMessage, index: number) => {
              return (
                <tr key={`log-list-${index}`}>
                  <Table.TD className="text-neutral-300">
                    {moment(row.timestamp).format('lll').toString()}
                  </Table.TD>
                  <Table.TD className="text-neutral-300">
                    <Badge
                      badgeType={
                        row.level === 'error'
                          ? 'error'
                          : row.level === 'warn'
                            ? 'warning'
                            : row.level === 'info'
                              ? 'success'
                              : 'default'
                      }
                    >
                      {row.level?.toUpperCase()}
                    </Badge>
                  </Table.TD>
                  <Table.TD className="text-neutral-300">
                    {row.label ?? ''}
                  </Table.TD>
                  <Table.TD className="text-neutral-300">
                    {row.message}
                  </Table.TD>
                  <Table.TD className="-m-1 flex flex-wrap items-center justify-end gap-1">
                    {row.data && (
                      <Tooltip
                        content={intl.formatMessage({
                          id: 'logs.table.viewDetails',
                          defaultMessage: 'View Details',
                        })}
                        tooltipConfig={{
                          placement: 'top-end',
                          followCursor: true,
                        }}
                      >
                        <Button
                          buttonSize="sm"
                          buttonType="primary"
                          onClick={() =>
                            setActiveLog({ log: row, isOpen: true })
                          }
                        >
                          <DocumentMagnifyingGlassIcon className="size-5" />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip
                      content={intl.formatMessage({
                        id: 'logs.table.copyToClipboard',
                        defaultMessage: 'Copy to clipboard',
                      })}
                      tooltipConfig={{ placement: 'top' }}
                    >
                      <CopyButton
                        grouped={false}
                        textToCopy={copyLogString(row)}
                        itemTitle={intl.formatMessage({
                          id: 'logs.table.logMessage',
                          defaultMessage: 'log message',
                        })}
                        size="sm"
                      />
                    </Tooltip>
                  </Table.TD>
                </tr>
              );
            })
          )}
          {data?.results.length === 0 && (
            <tr className="relative h-24 p-2">
              <Table.TD colSpan={5} noPadding>
                <div className="flex w-screen flex-col items-center justify-center p-6 md:w-full">
                  <span className="text-base">
                    <FormattedMessage
                      id="common.noResults"
                      defaultMessage="No Results"
                    />
                  </span>
                  {currentFilter !== 'debug' && (
                    <div className="mt-4">
                      <Button
                        buttonSize="sm"
                        buttonType="primary"
                        onClick={() => setCurrentFilter('debug')}
                      >
                        <FormattedMessage
                          id="common.showAll"
                          defaultMessage="Show All"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </Table.TD>
            </tr>
          )}
          <tr className="bg-base-100">
            <Table.TD colSpan={5} noPadding>
              <nav
                className="flex w-screen flex-col items-center space-x-4 space-y-3 px-6 py-3 sm:flex-row sm:space-y-0 md:w-full"
                aria-label="Pagination"
              >
                <div className="hidden lg:flex lg:flex-1">
                  <p className="text-sm">
                    {(data?.results.length ?? 0) > 0 &&
                      intl.formatMessage(
                        {
                          id: 'common.showingResults',
                        },
                        {
                          start: pageIndex * currentPageSize + 1,
                          end:
                            (data?.results.length ?? 0 < currentPageSize)
                              ? pageIndex * currentPageSize +
                                (data?.results.length ?? 0)
                              : (pageIndex + 1) * currentPageSize,
                          total: data?.pageInfo.results ?? 0,
                        }
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
                    disabled={!hasPrevPage}
                    buttonSize="sm"
                    buttonType="primary"
                    onClick={() =>
                      updateQueryParams('page', (page - 1).toString())
                    }
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
                    disabled={!hasNextPage}
                    buttonType="primary"
                    onClick={() =>
                      updateQueryParams('page', (page + 1).toString())
                    }
                  >
                    <span>
                      <FormattedMessage
                        id="common.next"
                        defaultMessage="Next"
                      />
                    </span>
                    <ChevronRightIcon className="size-5" />
                  </Button>
                </div>
              </nav>
            </Table.TD>
          </tr>
        </Table.TBody>
      </Table>
    </div>
  );
};
export default LogsSettings;
