import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import ProgressBar from '@app/components/Common/ProgressBar';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { formatBytes } from '@app/utils/numberHelper';
import {
  ArrowPathIcon,
  ArrowTurnDownRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import type {
  DiskSpaceItem,
  SettingsAboutDiskSpaceResponse,
} from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

interface DiskSpaceProps {
  appDataPath: string;
}

const ROOT_KEY = 'root';

const getDiskSpaceColor = (
  usedPercent: number
): 'primary' | 'warning' | 'error' => {
  if (usedPercent >= 85) return 'error';
  if (usedPercent >= 75) return 'warning';
  return 'primary';
};

const ExpandButton = ({
  hasChildren,
  isExpanded,
  onToggle,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const intl = useIntl();
  if (!hasChildren) return <span className="size-5 shrink-0" />;

  return (
    <button
      type="button"
      className="text-neutral hover:text-base-content rounded p-0.5 transition hover:cursor-pointer"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-label={
        isExpanded
          ? intl.formatMessage({
              id: 'systemSettings.diskSpace.collapseChildren',
              defaultMessage: 'Collapse children',
            })
          : intl.formatMessage({
              id: 'systemSettings.diskSpace.expandChildren',
              defaultMessage: 'Expand children',
            })
      }
    >
      {isExpanded ? (
        <ChevronDownIcon className="size-4" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
    </button>
  );
};

const CapacityMetrics = ({
  item,
  isFilesystem,
  totalBytes,
}: {
  item: DiskSpaceItem;
  isFilesystem: boolean;
  totalBytes: number;
}) => (
  <div className="grid grid-cols-3 gap-2 text-sm md:col-span-6 md:text-right">
    <div className="flex flex-wrap items-center gap-x-4 max-sm:flex-col md:block">
      <span className="text-neutral text-xs md:hidden">
        <FormattedMessage
          id="systemSettings.diskSpace.freeSpace"
          defaultMessage="Free Space"
        />
      </span>
      <span className="text-base-content">{formatBytes(item.freeBytes)}</span>
    </div>
    <div className="flex flex-wrap items-center gap-x-4 max-sm:flex-col md:block">
      <span className="text-neutral text-xs md:hidden">
        <FormattedMessage
          id="systemSettings.diskSpace.usedSpace"
          defaultMessage="Used Space"
        />
      </span>
      <span className="text-base-content">
        {formatBytes(
          isFilesystem ? item.usedBytes : (item.directoryBytes ?? 0)
        )}
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-x-4 max-sm:flex-col md:block">
      <span className="text-neutral text-xs md:hidden">
        <FormattedMessage
          id="systemSettings.diskSpace.totalSpace"
          defaultMessage="Total Space"
        />
      </span>
      <span className="text-base-content">{formatBytes(totalBytes)}</span>
    </div>
  </div>
);

const DiskSpace = ({ appDataPath }: DiskSpaceProps) => {
  const intl = useIntl();
  const [now, setNow] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, error, mutate } = useSWR<SettingsAboutDiskSpaceResponse>(
    '/api/v1/settings/about/diskspace',
    {
      revalidateOnFocus: false,
      refreshInterval: (latest) => (latest?.refreshing ? 3000 : 0),
    }
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshDiskSpace = async () => {
    setIsRefreshing(true);
    try {
      const { data: freshDiskSpace } =
        await axios.get<SettingsAboutDiskSpaceResponse>(
          '/api/v1/settings/about/diskspace?force=true'
        );
      mutate(freshDiskSpace, { revalidate: false });
    } finally {
      setIsRefreshing(false);
    }
  };

  const items = data?.items ?? [];
  const rootItem = items.find((item) => item.kind === 'filesystem');
  const configItem = items.find(
    (item) => item.kind === 'directory' && item.path === appDataPath
  );
  const childItems = items
    .filter((item) => item.kind === 'directory' && item.path !== appDataPath)
    .sort((a, b) => a.path.localeCompare(b.path));
  const [expandedRows, setExpandedRows] = useState(() => new Set([ROOT_KEY]));
  const toggleRow = useCallback((key: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const rows = useMemo(
    () => [
      ...(rootItem
        ? [
            {
              item: rootItem,
              key: ROOT_KEY,
              label: '/',
              parentKey: null,
              isFilesystem: true,
              usagePercent: rootItem.usedPercent,
              totalBytes: rootItem.totalBytes,
            },
          ]
        : []),
      ...(configItem
        ? [
            {
              item: configItem,
              key: appDataPath,
              label: 'config',
              parentKey: ROOT_KEY,
              isFilesystem: false,
              usagePercent: configItem.directoryPercent ?? 0,
              totalBytes: configItem.totalBytes,
            },
          ]
        : []),
      ...childItems.map((item) => ({
        item,
        key: item.path,
        label: `/${item.name === 'Database' ? 'db' : item.name.toLowerCase()}`,
        parentKey: appDataPath,
        isFilesystem: false,
        usagePercent:
          configItem?.directoryBytes && configItem.directoryBytes > 0
            ? ((item.directoryBytes ?? 0) / configItem.directoryBytes) * 100
            : 0,
        totalBytes: configItem?.directoryBytes ?? item.totalBytes,
      })),
    ],
    [appDataPath, childItems, configItem, rootItem]
  );
  const hasDiskSpaceWarning =
    !!error || (data?.failedPaths.length ?? 0) > 0 || (!!data && !rootItem);

  const isVisible = (row: (typeof rows)[number]): boolean => {
    let parentKey = row.parentKey;

    while (parentKey) {
      if (!expandedRows.has(parentKey)) return false;

      const parentRow = rows.find((candidate) => candidate.key === parentKey);
      parentKey = parentRow?.parentKey ?? null;
    }

    return true;
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="systemSettings.diskSpace.title"
            defaultMessage="Disk Space"
          />
        </h3>
        <div className="flex items-center gap-3">
          {data?.cachedAt && (
            <span className="text-neutral text-xs">
              <FormattedMessage
                id="cache.lastUpdated"
                defaultMessage="Updated {time}"
                values={{
                  time: moment(data.cachedAt).from(
                    Math.max(now, data.cachedAt)
                  ),
                }}
              />
            </span>
          )}
          <Button
            type="button"
            buttonSize="xs"
            buttonType="ghost"
            disabled={isRefreshing || data?.refreshing}
            onClick={() => refreshDiskSpace()}
          >
            <ArrowPathIcon
              className={`size-5 ${isRefreshing || data?.refreshing ? 'animate-spin' : ''}`}
            />
            <span className="sr-only">
              <FormattedMessage id="cache.refresh" defaultMessage="Refresh" />
            </span>
          </Button>
        </div>
      </div>
      {!data && !error && <LoadingEllipsis />}
      {hasDiskSpaceWarning && (
        <Alert
          type="warning"
          title={intl.formatMessage({
            id: 'systemSettings.diskSpace.warningTitle',
            defaultMessage: 'Some disk metrics are unavailable',
          })}
        >
          <FormattedMessage
            id="systemSettings.diskSpace.warningBody"
            defaultMessage="Streamarr could not read every configured local path. Available disk usage is shown below."
          />
        </Alert>
      )}
      {(data || error) && (
        <div className="border-base-content/10 mt-4 overflow-hidden rounded-lg border">
          <div className="border-base-content/10 text-base-content bg-base-200/50 hidden gap-3 border-b px-3 py-2 text-sm font-semibold md:grid md:grid-cols-12">
            <span className="col-span-4">
              <FormattedMessage
                id="systemSettings.diskSpace.location"
                defaultMessage="Location"
              />
            </span>
            <span className="col-span-2 text-right">
              <FormattedMessage
                id="systemSettings.diskSpace.freeSpace"
                defaultMessage="Free Space"
              />
            </span>
            <span className="col-span-2 text-right">
              <FormattedMessage
                id="systemSettings.diskSpace.usedSpace"
                defaultMessage="Used Space"
              />
            </span>
            <span className="col-span-2 text-right">
              <FormattedMessage
                id="systemSettings.diskSpace.totalSpace"
                defaultMessage="Total Space"
              />
            </span>
            <span className="col-span-2" />
          </div>
          {rows.map((row) => {
            const visible = isVisible(row);
            const hasChildren = rows.some(
              (child) => child.parentKey === row.key
            );
            const isExpanded = expandedRows.has(row.key);
            return (
              <div
                key={row.key}
                className={`bg-base-200/50 hover:bg-base-200/30 overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                  visible
                    ? 'border-base-content/10 max-h-40 translate-y-0 border-t opacity-100'
                    : 'pointer-events-none max-h-0 -translate-y-1 opacity-0'
                }`}
              >
                <div className="grid grid-cols-1 gap-3 px-3 py-3 md:grid-cols-12 md:items-center">
                  <div className="min-w-0 md:col-span-4">
                    <span
                      className={`text-base-content flex items-center gap-2 truncate font-mono text-sm ${
                        row.parentKey === appDataPath
                          ? 'pl-8'
                          : row.parentKey
                            ? 'pl-4'
                            : ''
                      }`}
                    >
                      <ExpandButton
                        hasChildren={hasChildren}
                        isExpanded={isExpanded}
                        onToggle={() => toggleRow(row.key)}
                      />
                      {row.parentKey === appDataPath && (
                        <ArrowTurnDownRightIcon className="text-neutral size-5 shrink-0" />
                      )}
                      {row.label}
                    </span>
                  </div>
                  <CapacityMetrics
                    item={row.item}
                    isFilesystem={row.isFilesystem}
                    totalBytes={row.totalBytes}
                  />
                  <div className="md:col-span-2">
                    <ProgressBar
                      progress={Math.min(row.usagePercent, 100)}
                      color={getDiskSpaceColor(row.usagePercent)}
                      showPercentage={false}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiskSpace;
