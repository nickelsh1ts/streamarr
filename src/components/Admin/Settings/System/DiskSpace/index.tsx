import Alert from '@app/components/Common/Alert';
import ProgressBar from '@app/components/Common/ProgressBar';
import { formatBytes } from '@app/utils/numberHelper';
import {
  ArrowTurnDownRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import type { SettingsAboutResponse } from '@server/interfaces/api/settingsInterfaces';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface DiskSpaceProps {
  data: SettingsAboutResponse;
}

const ROOT_NODE_KEY = '__root__';

const getDiskSpaceColor = (
  usedPercent: number
): 'primary' | 'warning' | 'error' => {
  if (usedPercent >= 85) return 'error';
  if (usedPercent >= 75) return 'warning';
  return 'primary';
};

const normalizePath = (p: string): string => p.replace(/\/+$/, '') || '/';

interface ExpandButtonProps {
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExpandButton = ({
  hasChildren,
  isExpanded,
  onToggle,
}: ExpandButtonProps) => {
  const intl = useIntl();
  if (!hasChildren) return null;
  return (
    <button
      type="button"
      className="rounded p-0.5 text-neutral transition hover:text-base-content"
      onClick={onToggle}
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

interface DiskMetricsProps {
  freeBytes: number;
  usedBytes: number;
  totalBytes: number;
}

const DiskMetrics = ({
  freeBytes,
  usedBytes,
  totalBytes,
}: DiskMetricsProps) => (
  <div className="grid grid-cols-3 gap-2 text-sm md:col-span-6 md:text-right">
    <div className="flex items-center justify-between md:block">
      <span className="text-xs text-neutral md:hidden">
        <FormattedMessage
          id="systemSettings.diskSpace.freeSpace"
          defaultMessage="Free Space"
        />
      </span>
      <span className="text-base-content">{formatBytes(freeBytes)}</span>
    </div>
    <div className="flex items-center justify-between md:block">
      <span className="text-xs text-neutral md:hidden">
        <FormattedMessage
          id="systemSettings.diskSpace.usedSpace"
          defaultMessage="Used Space"
        />
      </span>
      <span className="text-base-content">{formatBytes(usedBytes)}</span>
    </div>
    <div className="flex items-center justify-between md:block">
      <span className="text-xs text-neutral md:hidden">
        <FormattedMessage
          id="systemSettings.diskSpace.totalSpace"
          defaultMessage="Total Space"
        />
      </span>
      <span className="text-base-content">{formatBytes(totalBytes)}</span>
    </div>
  </div>
);

const DiskSpace = ({ data }: DiskSpaceProps) => {
  const intl = useIntl();

  const { items: diskSpaceItems, failedPaths } = data.diskSpace;
  const appDataNorm = normalizePath(data.appDataPath);
  const hasDiskSpaceWarning =
    failedPaths.length > 0 || diskSpaceItems.length === 0;

  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    () => new Set([ROOT_NODE_KEY])
  );

  const toggleRow = useCallback((key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  const { rootDiskItem, diskRows } = useMemo(() => {
    const appDataDirLabel =
      appDataNorm === '/'
        ? '/'
        : `/${appDataNorm.split('/').pop() ?? 'config'}`;

    const appDataItem =
      diskSpaceItems.find((d) => normalizePath(d.path) === appDataNorm) ?? null;
    const appDataUsedBytes = appDataItem?.pathUsedBytes ?? 0;
    const rootDiskItem = appDataItem ?? diskSpaceItems[0] ?? null;

    const diskRows = diskSpaceItems.map((disk) => {
      const path = normalizePath(disk.path);
      const isAppDataRow = path === appDataNorm;
      // The backend only sends immediate subdirectories, so a direct prefix
      // check is sufficient — no need to walk the full ancestor chain.
      const isSubDir =
        !isAppDataRow &&
        appDataNorm !== '/' &&
        path.startsWith(`${appDataNorm}/`);

      const displayPath = isAppDataRow
        ? appDataDirLabel
        : isSubDir
          ? `/${disk.name}`
          : disk.mountPoint;

      const usedBytes =
        isAppDataRow || isSubDir ? disk.pathUsedBytes : disk.usedBytes;
      const contextTotal = isAppDataRow
        ? disk.usedBytes
        : isSubDir
          ? appDataUsedBytes
          : disk.totalBytes;
      const totalBytes = contextTotal > 0 ? contextTotal : disk.totalBytes;
      const usedPercent =
        totalBytes > 0 ? Math.min((usedBytes / totalBytes) * 100, 100) : 0;

      const parentKey = isAppDataRow
        ? ROOT_NODE_KEY
        : isSubDir
          ? appDataNorm
          : null;

      return {
        disk,
        rowKey: path,
        parentKey,
        isChild: isAppDataRow || isSubDir,
        displayPath,
        usedBytes,
        totalBytes,
        usedPercent,
      };
    });

    return { rootDiskItem, diskRows };
  }, [diskSpaceItems, appDataNorm]);

  const childCountByParent = useMemo(() => {
    const map = new Map<string, number>();
    diskRows.forEach(({ parentKey }) => {
      if (parentKey) map.set(parentKey, (map.get(parentKey) ?? 0) + 1);
    });
    return map;
  }, [diskRows]);

  // Two-level hierarchy: ROOT_NODE_KEY → appData row → subDir rows.
  // A row is visible iff every ancestor key is expanded.
  const isRowVisible = (parentKey: string | null): boolean => {
    if (!parentKey) return true;
    if (!expandedRows.has(parentKey)) return false;
    // subDir rows have appDataNorm as parent; also check ROOT_NODE_KEY
    return parentKey === ROOT_NODE_KEY || expandedRows.has(ROOT_NODE_KEY);
  };

  const rootUsedPercent =
    rootDiskItem && rootDiskItem.totalBytes > 0
      ? (rootDiskItem.usedBytes / rootDiskItem.totalBytes) * 100
      : 0;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-extrabold gap-2 flex items-center">
          <FormattedMessage
            id="systemSettings.diskSpace.title"
            defaultMessage="Disk Space"
          />
        </h3>
      </div>
      {hasDiskSpaceWarning && (
        <Alert
          type="warning"
          title={intl.formatMessage({
            id: 'systemSettings.diskSpace.warningTitle',
            defaultMessage: 'Some disk metrics are unavailable',
          })}
        >
          <span>
            <FormattedMessage
              id="systemSettings.diskSpace.warningBody"
              defaultMessage="Streamarr could not read every configured local path. Available disk usage is shown below."
            />
          </span>
        </Alert>
      )}
      <div className="mt-4 overflow-hidden rounded-lg border border-base-content/10">
        <div className="hidden md:grid md:grid-cols-12 gap-3 border-b border-base-content/10 px-3 py-2 text-sm font-semibold text-base-content bg-base-200/50">
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
        <div>
          {rootDiskItem && (
            <div className="grid grid-cols-1 gap-3 px-3 py-3 md:grid-cols-12 md:items-center bg-base-200/50 hover:bg-base-200/30">
              <div className="min-w-0 md:col-span-4">
                <span className="flex items-center gap-2 text-sm text-base-content">
                  <ExpandButton
                    hasChildren={childCountByParent.has(ROOT_NODE_KEY)}
                    isExpanded={expandedRows.has(ROOT_NODE_KEY)}
                    onToggle={() => toggleRow(ROOT_NODE_KEY)}
                  />
                  <span className="min-w-0 truncate font-mono">
                    {rootDiskItem.mountPoint}
                  </span>
                </span>
              </div>
              <DiskMetrics
                freeBytes={rootDiskItem.freeBytes}
                usedBytes={rootDiskItem.usedBytes}
                totalBytes={rootDiskItem.totalBytes}
              />
              <div className="md:col-span-2">
                <ProgressBar
                  progress={rootUsedPercent}
                  color={getDiskSpaceColor(rootUsedPercent)}
                  showPercentage={false}
                  size="sm"
                />
              </div>
            </div>
          )}
          {diskRows.map((row) => {
            const hasChildren = childCountByParent.has(row.rowKey);
            const isExpanded = expandedRows.has(row.rowKey);
            const isVisible = isRowVisible(row.parentKey);
            return (
              <div
                key={`${row.disk.deviceId}-${row.disk.path}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none bg-base-200/50 hover:bg-base-200/30 ${
                  isVisible
                    ? 'max-h-40 border-t border-base-content/10 opacity-100 translate-y-0'
                    : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 gap-3 px-3 py-3 md:grid-cols-12 md:items-center">
                  <div className="min-w-0 md:col-span-4">
                    <span
                      className={`flex items-center gap-2 text-sm text-base-content ${
                        !row.isChild
                          ? ''
                          : row.parentKey === ROOT_NODE_KEY
                            ? 'pl-4'
                            : 'pl-16'
                      }`}
                    >
                      <ExpandButton
                        hasChildren={hasChildren}
                        isExpanded={isExpanded}
                        onToggle={() => toggleRow(row.rowKey)}
                      />
                      {row.isChild && (
                        <ArrowTurnDownRightIcon className="size-5 shrink-0 text-neutral" />
                      )}
                      <span className="min-w-0 truncate font-mono">
                        {row.displayPath}
                      </span>
                    </span>
                  </div>
                  <DiskMetrics
                    freeBytes={row.disk.freeBytes}
                    usedBytes={row.usedBytes}
                    totalBytes={row.totalBytes}
                  />
                  <div className="md:col-span-2">
                    <ProgressBar
                      progress={row.usedPercent}
                      color={getDiskSpaceColor(row.usedPercent)}
                      showPercentage={false}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiskSpace;
