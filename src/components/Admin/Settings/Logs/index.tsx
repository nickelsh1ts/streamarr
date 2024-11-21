'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CopyButton from '@app/components/Common/CopyButton';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Table from '@app/components/Common/Table';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import {
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  FunnelIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

type Filter = 'debug' | 'info' | 'warn' | 'error';

export type LogMessage = {
  timestamp: string;
  level: string;
  label?: string;
  message: string;
  data?: Record<string, unknown>;
};

const LogsSettings = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentFilter, setCurrentFilter] = useState<Filter>('debug');
  let refreshInterval = 5000;

  let data: LogMessage[] = [
    {
      timestamp: 'Nov 20, 2024, 4:51:00 PM',
      level: 'debug',
      label: 'Demo Log',
      message: 'This is a demo entry in the log system for reference.',
      data: { 'test data': null },
    },
    {
      timestamp: 'Nov 20, 2024, 4:51:00 PM',
      level: 'info',
      label: 'Demo Log',
      message: 'This is a demo info entry in the log system for reference.',
    },
    {
      timestamp: 'Nov 20, 2024, 4:51:00 PM',
      level: 'error',
      label: 'Demo ERROR',
      message: 'This is a demo ERROR entry in the log system for reference.',
    },
    {
      timestamp: 'Nov 20, 2024, 4:51:00 PM',
      level: 'warn',
      label: 'Demo WARN',
      message: 'This is a demo WARN entry in the log system for reference.',
      data: {
        mediaTitle: 'Suits',
        userId: 32,
      },
    },
  ];

  data = data.filter(
    (data) => currentFilter === data.level || currentFilter === 'debug'
  );

  return (
    <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
      <h3 className="text-2xl font-extrabold">Logs</h3>
      <p className="mb-5">
        You can also view these logs directly via <code>stdout</code>, or in{' '}
        <code>/app/config/logs/streamarr.log</code>.
      </p>
      <div className="mt-2 flex flex-grow flex-col sm:flex-grow-0 sm:flex-row sm:justify-end">
        <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 md:flex-grow-0">
          <span className="btn btn-sm rounded-md btn-primary rounded-r-none px-3 text-sm pointer-events-none">
            <MagnifyingGlassIcon className="size-5" />
          </span>
          <input
            type="text"
            className="input input-sm input-primary rounded-l-none rounded-md"
            onChange={() => {}}
          />
        </div>
        <div className="mb-2 flex flex-1 flex-row justify-between sm:mb-0 sm:flex-none">
          <Button
            type="button"
            className="mr-2 flex flex-grow rounded-md"
            buttonType={refreshInterval ? 'default' : 'primary'}
            buttonSize="sm"
            onClick={() => {
              refreshInterval = 0;
            }}
          >
            {refreshInterval > 0 ? (
              <PauseIcon className="size-5" />
            ) : (
              <PlayIcon className="size-5 font-bold" />
            )}
            <span className="ml-2">{refreshInterval ? 'Pause' : 'Resume'}</span>
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
                router.push(pathname);
              }}
              className="select select-sm select-primary rounded-l-none rounded-md"
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Table.TH>Timestamp</Table.TH>
            <Table.TH>Severity</Table.TH>
            <Table.TH>Label</Table.TH>
            <Table.TH>Message</Table.TH>
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
            data.map((row: LogMessage, index: number) => {
              return (
                <tr key={`log-list-${index}`}>
                  <Table.TD className="text-gray-300">{row.timestamp}</Table.TD>
                  <Table.TD className="text-gray-300">
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
                  <Table.TD className="text-gray-300">
                    {row.label ?? ''}
                  </Table.TD>
                  <Table.TD className="text-gray-300">{row.message}</Table.TD>
                  <Table.TD className="-m-1 flex flex-wrap items-center justify-end gap-1">
                    {row.data && (
                      <Tooltip
                        content="View Details"
                        tooltipConfig={{ placement: 'top' }}
                      >
                        <Button
                          buttonSize="sm"
                          buttonType="primary"
                          onClick={(e) => {
                            e.preventDefault();
                            Toast({
                              title: row.label,
                              message: JSON.stringify(row.data, null, ' '),
                              duration: Infinity,
                              type:
                                row.level === 'error'
                                  ? 'error'
                                  : row.level === 'warn'
                                    ? 'warning'
                                    : row.level === 'info'
                                      ? 'success'
                                      : 'primary',
                            });
                          }}
                        >
                          <DocumentMagnifyingGlassIcon className="size-5" />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip
                      content="Copy to clipboard"
                      tooltipConfig={{ placement: 'top' }}
                    >
                      <CopyButton
                        grouped={false}
                        textToCopy={row.message}
                        size="sm"
                      />
                    </Tooltip>
                  </Table.TD>
                </tr>
              );
            })
          )}

          {data?.length === 0 && (
            <tr className="relative h-24 p-2">
              <Table.TD colSpan={5} noPadding>
                <div className="flex w-screen flex-col items-center justify-center p-6 md:w-full">
                  <span className="text-base">No Results</span>
                  {currentFilter !== 'debug' && (
                    <div className="mt-4">
                      <Button
                        buttonSize="sm"
                        buttonType="primary"
                        onClick={() => setCurrentFilter('debug')}
                      >
                        Show All
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
                    {(data?.length ?? 0) > 0 && 'Showing 1 to 2 of 2 results'}
                  </p>
                </div>
                <div className="flex justify-center sm:flex-1 sm:justify-start md:justify-center">
                  <span className="-mt-3 items-center text-sm sm:-ml-4 sm:mt-0 md:ml-0">
                    Display
                    <select
                      id="pageSize"
                      name="pageSize"
                      onChange={() => {}}
                      className="select select-sm select-primary mx-1"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    results per page
                  </span>
                </div>
                <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
                  <Button buttonSize="sm" disabled={true} onClick={() => {}}>
                    <ChevronLeftIcon className="size-5" />
                    <span>Previous</span>
                  </Button>
                  <Button buttonSize="sm" disabled={false} onClick={() => {}}>
                    <span>Next</span>
                    <ChevronRightIcon className="size-5" />
                  </Button>
                </div>
              </nav>
            </Table.TD>
          </tr>
        </Table.TBody>
      </Table>
    </form>
  );
};
export default LogsSettings;
