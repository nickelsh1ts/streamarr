import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type {
  NormalizedDownloadItem,
  DownloadClientStats,
} from '@server/interfaces/api/downloadsInterfaces';
import type { DownloadClientSettings } from '@server/lib/settings';
import ProgressBar from '@app/components/Common/ProgressBar';
import Toast from '@app/components/Toast';
import TorrentDetailsModal from './TorrentDetailsModal';
import RemoveTorrentModal from './RemoveTorrentModal';
import { useDownloadActions } from '@app/hooks/useDownloads';
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronDoubleUpIcon,
  ChevronDoubleDownIcon,
  InformationCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import Button from '@app/components/Common/Button';
import Tooltip from '@app/components/Common/ToolTip';

interface DownloadRowProps {
  torrent: NormalizedDownloadItem;
  onRefresh?: () => void;
  isSelected: boolean;
  onToggleSelect: (hash: string) => void;
  clients: DownloadClientSettings[];
  stats: DownloadClientStats[];
}

const DownloadRow: React.FC<DownloadRowProps> = ({
  torrent,
  onRefresh,
  isSelected,
  onToggleSelect,
  clients,
  stats,
}) => {
  const isStale = useMemo(() => {
    const clientStat = stats.find((s) => s.clientId === torrent.clientId);
    return clientStat?.health?.isStale === true;
  }, [stats, torrent.clientId]);

  const [isActing, setIsActing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const {
    pause,
    resume,
    remove,
    forceRecheck,
    queueUp,
    queueDown,
    topPriority,
    bottomPriority,
  } = useDownloadActions();
  const intl = useIntl();

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatSpeed = (speed: number): string => {
    if (speed === 0) return '-';
    return `${formatBytes(speed)}/s`;
  };

  const formatEta = (seconds: number | null): string => {
    if (!seconds || seconds <= 0) return '-';
    if (seconds === Infinity) return '∞';
    // qBittorrent uses 8640000 (100 days) as magic number for "no ETA"
    if (seconds >= 8640000) return '∞';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      downloading: 'badge-primary',
      seeding: 'badge-info',
      paused: 'badge-warning',
      completed: 'badge-success',
      checking: 'badge-info',
      queued: 'badge-neutral',
      error: 'badge-error',
      stalled: 'badge-warning',
      moving: 'badge-primary',
      metadata: 'badge-info whitespace-nowrap',
    };

    const statusMessages: Record<
      string,
      { id: string; defaultMessage: string }
    > = {
      downloading: {
        id: 'downloads.statusDownloading',
        defaultMessage: 'Downloading',
      },
      seeding: { id: 'downloads.statusSeeding', defaultMessage: 'Seeding' },
      paused: { id: 'downloads.statusPaused', defaultMessage: 'Paused' },
      completed: {
        id: 'downloads.statusCompleted',
        defaultMessage: 'Completed',
      },
      checking: { id: 'downloads.statusChecking', defaultMessage: 'Checking' },
      queued: { id: 'downloads.statusQueued', defaultMessage: 'Queued' },
      error: { id: 'downloads.statusError', defaultMessage: 'Error' },
      stalled: { id: 'downloads.statusStalled', defaultMessage: 'Stalled' },
      moving: { id: 'downloads.statusMoving', defaultMessage: 'Moving' },
      metadata: {
        id: 'downloads.statusMetadata',
        defaultMessage: 'Fetching Metadata',
      },
    };

    const message = statusMessages[status] || {
      id: 'downloads.statusUnknown',
      defaultMessage: 'Unknown',
    };

    return (
      <span className={`badge ${statusColors[status] || 'badge-neutral'}`}>
        <FormattedMessage
          id={message.id}
          defaultMessage={message.defaultMessage}
        />
      </span>
    );
  };

  const handleRemoveConfirm = async (deleteFiles: boolean) => {
    setIsActing(true);
    setShowRemoveModal(false);
    try {
      await remove(torrent.hash, torrent.clientId, deleteFiles);
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.removeError',
          defaultMessage: 'Failed to remove torrent',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsActing(false);
    }
  };

  const handleAction = async (action: () => Promise<boolean | undefined>) => {
    setIsActing(true);
    try {
      await action();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.actionError',
          defaultMessage: 'An error occurred while performing the action.',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsActing(false);
    }
  };

  const isPaused = torrent.status === 'paused';
  const isCompleted = torrent.status === 'completed';
  const isDownloading = torrent.status === 'downloading';
  const isSeeding = torrent.status === 'seeding';
  const isStalled = torrent.status === 'stalled';
  const canResume = isPaused || isCompleted;
  const canPause = isDownloading || isSeeding || isStalled;

  return (
    <>
      <tr className="hover:bg-base-100 transition-colors">
        <td className="w-12">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={isSelected}
            onChange={() => onToggleSelect(torrent.hash)}
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        <td
          className="cursor-pointer group"
          onClick={() => setShowDetailsModal(true)}
          title={intl.formatMessage({
            id: 'downloads.viewDetails',
            defaultMessage: 'View Details',
          })}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span
                className="font-medium truncate w-fit max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
                title={torrent.name}
              >
                <InformationCircleIcon className="inline text-primary w-5 opacity-50 sm:w-0 h-5 mr-1 sm:opacity-0 sm:group-hover:w-5 sm:group-hover:opacity-50 sm:group-hover:mr-1 transition-all duration-150 overflow-visible" />
                {torrent.name}
              </span>
              {isStale && (
                <Tooltip
                  content={
                    <div className="text-xs">
                      <FormattedMessage
                        id="downloads.clientUnreachable"
                        defaultMessage="Client Unreachable."
                      />
                    </div>
                  }
                >
                  <ExclamationTriangleIcon
                    title={intl.formatMessage({
                      id: 'downloads.clientUnreachable',
                      defaultMessage: 'Client Unreachable.',
                    })}
                    className="size-5 text-warning flex-shrink-0"
                  />
                </Tooltip>
              )}
            </div>
            {torrent.category && (
              <span className="text-xs text-neutral mt-1">
                {torrent.category}
              </span>
            )}
          </div>
        </td>
        <td>
          <div className="w-32">
            <ProgressBar
              progress={torrent.progress}
              size="sm"
              color={
                torrent.status === 'error'
                  ? 'error'
                  : torrent.status === 'completed' ||
                      torrent.status === 'seeding'
                    ? 'success'
                    : 'primary'
              }
              showPercentage={true}
            />
          </div>
        </td>
        <td className="whitespace-nowrap">{formatBytes(torrent.size)}</td>
        <td>
          <div className="flex flex-col text-xs whitespace-nowrap">
            <span className="text-success">
              ↓ {formatSpeed(torrent.downloadSpeed)}
            </span>
            <span className="text-info">
              ↑ {formatSpeed(torrent.uploadSpeed)}
            </span>
          </div>
        </td>
        <td className="whitespace-nowrap">{formatEta(torrent.eta)}</td>
        <td className="whitespace-nowrap">
          {torrent.ratio?.toFixed(2) ?? '-'}
        </td>
        <td>{getStatusBadge(torrent.status)}</td>
        <td
          className="cursor-pointer group"
          onClick={() => {
            const client = clients.find((c) => c.id === torrent.clientId);
            if (client) {
              const clientUrl =
                client.externalUrl ||
                `${client.useSsl ? 'https' : 'http'}://${client.hostname}:${client.port}`;
              window.open(clientUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          title={intl.formatMessage(
            {
              id: 'downloads.openClient',
              defaultMessage: 'Open {clientName}',
            },
            { clientName: torrent.clientName }
          )}
        >
          <span className="font-medium flex gap-1">
            {torrent.clientName}
            <ArrowTopRightOnSquareIcon className="inline text-primary w-5 opacity-50 sm:w-0 h-5 sm:opacity-0 sm:group-hover:w-5 sm:group-hover:opacity-50 transition-all duration-150 overflow-visible" />
          </span>
        </td>
        <td>
          <div className="flex items-center">
            {torrent.priority !== undefined && torrent.priority > 0 && (
              <span className="text-xs font-mono min-w-[2rem]">
                #{torrent.priority}
              </span>
            )}
            {torrent.priority !== undefined &&
              (torrent.priority === -1 || torrent.priority === 0) && (
                <span className="text-xs text-neutral">
                  {torrent.priority === -1 ? (
                    <FormattedMessage
                      id="downloads.queueingDisabled"
                      defaultMessage="N/A"
                    />
                  ) : (
                    '-'
                  )}
                </span>
              )}
            {torrent.priority !== undefined && torrent.priority > 0 && (
              <>
                <select
                  className="select select-xs select-primary block sm:hidden"
                  disabled={isActing || isSelected}
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'top') {
                      handleAction(() =>
                        topPriority(torrent.hash, torrent.clientId)
                      );
                    } else if (value === 'up') {
                      handleAction(() =>
                        queueUp(torrent.hash, torrent.clientId)
                      );
                    } else if (value === 'down') {
                      handleAction(() =>
                        queueDown(torrent.hash, torrent.clientId)
                      );
                    } else if (value === 'bottom') {
                      handleAction(() =>
                        bottomPriority(torrent.hash, torrent.clientId)
                      );
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
                <div className="hidden sm:flex gap-1 ">
                  <Button
                    buttonSize="xs"
                    buttonType="ghost"
                    onClick={() =>
                      handleAction(() =>
                        topPriority(torrent.hash, torrent.clientId)
                      )
                    }
                    disabled={isActing || isSelected}
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
                    onClick={() =>
                      handleAction(() =>
                        queueUp(torrent.hash, torrent.clientId)
                      )
                    }
                    disabled={isActing || isSelected}
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
                    onClick={() =>
                      handleAction(() =>
                        queueDown(torrent.hash, torrent.clientId)
                      )
                    }
                    disabled={isActing || isSelected}
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
                      handleAction(() =>
                        bottomPriority(torrent.hash, torrent.clientId)
                      )
                    }
                    disabled={isActing || isSelected}
                    title={intl.formatMessage({
                      id: 'downloads.actionBottomPriority',
                      defaultMessage: 'Move to Bottom',
                    })}
                  >
                    <ChevronDoubleDownIcon className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </td>
        <td>
          <>
            <select
              className="select select-xs select-primary block sm:hidden"
              disabled={isActing || isSelected}
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'resume') {
                  handleAction(() => resume(torrent.hash, torrent.clientId));
                } else if (value === 'pause') {
                  handleAction(() => pause(torrent.hash, torrent.clientId));
                } else if (value === 'recheck') {
                  handleAction(() =>
                    forceRecheck(torrent.hash, torrent.clientId)
                  );
                } else if (value === 'remove') {
                  setShowRemoveModal(true);
                }
                // Reset to placeholder
                e.target.value = '';
              }}
            >
              <option value="" disabled>
                <FormattedMessage
                  id="downloads.actions"
                  defaultMessage="Actions"
                />
              </option>
              {canResume && (
                <option value="resume">
                  ▶️{' '}
                  {intl.formatMessage({
                    id: 'downloads.actionResume',
                    defaultMessage: 'Resume',
                  })}
                </option>
              )}
              {canPause && (
                <option value="pause">
                  ⏸️{' '}
                  {intl.formatMessage({
                    id: 'downloads.actionPause',
                    defaultMessage: 'Pause',
                  })}
                </option>
              )}
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
                  id: 'downloads.actionRemoved',
                  defaultMessage: 'Remove',
                })}
              </option>
            </select>
            <div className="hidden sm:flex gap-1">
              {canResume && (
                <Button
                  buttonSize="xs"
                  buttonType="success"
                  onClick={() =>
                    handleAction(() => resume(torrent.hash, torrent.clientId))
                  }
                  disabled={isActing || isSelected}
                  title={intl.formatMessage({
                    id: 'downloads.actionResume',
                    defaultMessage: 'Resume',
                  })}
                >
                  <PlayIcon className="size-4" />
                </Button>
              )}
              {canPause && (
                <Button
                  buttonSize="xs"
                  buttonType="warning"
                  onClick={() =>
                    handleAction(() => pause(torrent.hash, torrent.clientId))
                  }
                  disabled={isActing || isSelected}
                  title={intl.formatMessage({
                    id: 'downloads.actionPause',
                    defaultMessage: 'Pause',
                  })}
                >
                  <PauseIcon className="size-4" />
                </Button>
              )}
              <Button
                buttonSize="xs"
                buttonType="info"
                onClick={() =>
                  handleAction(() =>
                    forceRecheck(torrent.hash, torrent.clientId)
                  )
                }
                disabled={isActing || isSelected}
                title={intl.formatMessage({
                  id: 'downloads.actionForceRecheck',
                  defaultMessage: 'Force Recheck',
                })}
              >
                <ArrowPathIcon className="size-4" />
              </Button>
              <Button
                buttonSize="xs"
                buttonType="error"
                onClick={() => setShowRemoveModal(true)}
                disabled={isActing || isSelected}
                title={intl.formatMessage({
                  id: 'downloads.actionRemoved',
                  defaultMessage: 'Removed',
                })}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </>
        </td>
      </tr>
      {isMounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <TorrentDetailsModal
              isOpen={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              torrent={torrent}
              onRefresh={onRefresh}
              stats={stats}
            />
            <RemoveTorrentModal
              isOpen={showRemoveModal}
              onClose={() => setShowRemoveModal(false)}
              onConfirm={handleRemoveConfirm}
              torrentName={torrent.name}
              isProcessing={isActing}
            />
          </>,
          document.body
        )}
    </>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
export default React.memo(DownloadRow, (prevProps, nextProps) => {
  // Only re-render if the torrent data actually changed, selection state changed, or stats reference changed
  return (
    prevProps.torrent.hash === nextProps.torrent.hash &&
    prevProps.torrent.progress === nextProps.torrent.progress &&
    prevProps.torrent.status === nextProps.torrent.status &&
    prevProps.torrent.downloadSpeed === nextProps.torrent.downloadSpeed &&
    prevProps.torrent.uploadSpeed === nextProps.torrent.uploadSpeed &&
    prevProps.torrent.eta === nextProps.torrent.eta &&
    prevProps.torrent.ratio === nextProps.torrent.ratio &&
    prevProps.torrent.priority === nextProps.torrent.priority &&
    prevProps.torrent.category === nextProps.torrent.category &&
    prevProps.torrent.savePath === nextProps.torrent.savePath &&
    prevProps.torrent.clientName === nextProps.torrent.clientName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.stats === nextProps.stats // Compare stats array reference
  );
});
