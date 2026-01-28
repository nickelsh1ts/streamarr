import React, { useState } from 'react';
import Modal from '@app/components/Common/Modal';
import Alert from '@app/components/Common/Alert';
import type {
  NormalizedDownloadItem,
  TorrentFile,
} from '@server/interfaces/api/downloadsInterfaces';
import { FormattedMessage, useIntl } from 'react-intl';
import ProgressBar from '@app/components/Common/ProgressBar';
import { momentWithLocale } from '@app/utils/momentLocale';
import { useDownloadActions } from '@app/hooks/useDownloads';
import EditableField from './EditableField';
import TorrentFileList from './TorrentFileList';
import RemoveTorrentModal from './RemoveTorrentModal';
import Accordion from '@app/components/Common/Accordion';
import Toast from '@app/components/Toast';
import {
  CheckBadgeIcon,
  ChevronDownIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface TorrentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  torrent: NormalizedDownloadItem | null;
  onRefresh?: () => void;
}

const TorrentDetailsModal: React.FC<TorrentDetailsModalProps> = ({
  isOpen,
  onClose,
  torrent,
  onRefresh,
}) => {
  const intl = useIntl();
  const [files, setFiles] = useState<TorrentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    pause,
    resume,
    forceRecheck,
    remove,
    getTorrentFiles,
    updateTorrent,
    setFilePriority,
  } = useDownloadActions();

  if (!torrent) return null;

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

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const loadFiles = async () => {
    if (!torrent || filesLoaded) return;

    setIsLoadingFiles(true);
    try {
      const fileList = await getTorrentFiles(torrent.hash, torrent.clientId);
      setFiles(fileList);
      setFilesLoaded(true);
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToLoadFiles',
          defaultMessage: 'Failed to load torrent files',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSaveCategory = async (newCategory: string) => {
    if (!torrent) return;

    try {
      await updateTorrent(torrent.hash, torrent.clientId, {
        category: newCategory,
      });
      Toast({
        type: 'success',
        message: intl.formatMessage({
          id: 'downloads.categoryUpdated',
          defaultMessage: 'Category updated successfully',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
      });
      onRefresh?.();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToUpdateCategory',
          defaultMessage: 'Failed to update category',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  const handleSavePath = async (newPath: string) => {
    if (!torrent) return;

    try {
      await updateTorrent(torrent.hash, torrent.clientId, {
        savePath: newPath,
      });
      Toast({
        type: 'success',
        message: intl.formatMessage({
          id: 'downloads.savePathUpdated',
          defaultMessage: 'Save path updated successfully',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
      });
      onRefresh?.();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToUpdateSavePath',
          defaultMessage: 'Failed to update save path',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  const handleSetFilePriority = async (fileIds: number[], priority: number) => {
    if (!torrent) return;

    try {
      await setFilePriority(torrent.hash, torrent.clientId, fileIds, priority);

      // Deluge has a delay in updating file priorities, so wait before refreshing
      if (torrent.clientType === 'deluge') {
        // Wait 2 seconds for Deluge to update
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Reload files to get updated priorities
      const fileList = await getTorrentFiles(torrent.hash, torrent.clientId);
      setFiles(fileList);
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToUpdateFilePriority',
          defaultMessage: 'Failed to update file priority',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  const handlePlayPause = async () => {
    if (!torrent) return;

    const isPaused = torrent.status === 'paused';
    const isCompleted = torrent.status === 'completed';
    const canResume = isPaused || isCompleted;

    try {
      if (canResume) {
        await resume(torrent.hash, torrent.clientId);
      } else {
        await pause(torrent.hash, torrent.clientId);
      }
      onRefresh?.();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToChangeStatus',
          defaultMessage: 'Failed to change torrent status',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  const handleForceRecheck = async () => {
    if (!torrent) return;

    try {
      await forceRecheck(torrent.hash, torrent.clientId);
      onRefresh?.();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToForceRecheck',
          defaultMessage: 'Failed to force recheck',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  const handleDelete = () => {
    setShowRemoveModal(true);
  };

  const handleConfirmDelete = async (deleteFiles: boolean) => {
    if (!torrent) return;

    setIsRemoving(true);
    try {
      await remove(torrent.hash, torrent.clientId, deleteFiles);
      Toast({
        type: 'success',
        message: intl.formatMessage({
          id: 'downloads.torrentRemoved',
          defaultMessage: 'Torrent removed successfully',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
      });
      setShowRemoveModal(false);
      onClose();
      onRefresh?.();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToRemoveTorrent',
          defaultMessage: 'Failed to remove torrent',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsRemoving(false);
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
      <Modal
        title={intl.formatMessage({
          id: 'downloads.torrentDetails',
          defaultMessage: 'Torrent Details',
        })}
        onCancel={onClose}
        cancelText={intl.formatMessage({
          id: 'common.close',
          defaultMessage: 'Close',
        })}
        onOk={handlePlayPause}
        okText={
          canResume
            ? intl.formatMessage({
                id: 'downloads.resume',
                defaultMessage: 'Resume',
              })
            : canPause
              ? intl.formatMessage({
                  id: 'downloads.pause',
                  defaultMessage: 'Pause',
                })
              : ''
        }
        okButtonType={canResume ? 'success' : 'warning'}
        onSecondary={handleForceRecheck}
        secondaryText={intl.formatMessage({
          id: 'downloads.forceRecheck',
          defaultMessage: 'Force Re-check',
        })}
        secondaryButtonType="info"
        onTertiary={handleDelete}
        tertiaryText={intl.formatMessage({
          id: 'common.remove',
          defaultMessage: 'Remove',
        })}
        tertiaryButtonType="error"
        show={isOpen}
        size="md"
      >
        <div className="space-y-6 border-t border-primary pt-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              <FormattedMessage
                id="downloads.generalInfo"
                defaultMessage="General Information"
              />
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage id="downloads.name" defaultMessage="Name" />
                  :
                </span>
                <span className="font-medium break-all ml-4">
                  {torrent.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage id="downloads.hash" defaultMessage="Hash" />
                  :
                </span>
                <span className="font-mono text-xs break-all ml-4">
                  {torrent.hash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage
                    id="downloads.client"
                    defaultMessage="Client"
                  />
                  :
                </span>
                <span className="font-medium">
                  {torrent.clientName} ({torrent.clientType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage
                    id="downloads.status"
                    defaultMessage="Status"
                  />
                  :
                </span>
                <span className="font-medium capitalize">{torrent.status}</span>
              </div>
              {(torrent.clientType === 'qbittorrent' ||
                torrent.clientType === 'deluge') && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral">
                    <FormattedMessage
                      id={
                        torrent.clientType === 'deluge'
                          ? 'downloads.label'
                          : 'downloads.category'
                      }
                      defaultMessage={
                        torrent.clientType === 'deluge' ? 'Label' : 'Category'
                      }
                    />
                    :
                  </span>
                  <div>
                    <EditableField
                      value={torrent.category || ''}
                      onSave={handleSaveCategory}
                      placeholder={
                        torrent.clientType === 'deluge' ? 'No label' : 'None'
                      }
                    />
                  </div>
                </div>
              )}
              {torrent.tags && torrent.tags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.tags"
                      defaultMessage="Tags"
                    />
                    :
                  </span>
                  <span className="font-medium">{torrent.tags.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">
              <FormattedMessage
                id="downloads.progressStats"
                defaultMessage="Progress & Statistics"
              />
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.progress"
                      defaultMessage="Progress"
                    />
                  </span>
                  <span className="font-medium">
                    {torrent.progress.toFixed(2)}%
                  </span>
                </div>
                <ProgressBar
                  progress={torrent.progress}
                  size="md"
                  color={
                    torrent.status === 'error'
                      ? 'error'
                      : torrent.status === 'completed' ||
                          torrent.status === 'seeding'
                        ? 'success'
                        : 'primary'
                  }
                  showPercentage={false}
                />
              </div>
              {torrent.status === 'error' && torrent.errorMessage && (
                <div className="mb-3">
                  <Alert
                    title={
                      <>
                        <FormattedMessage
                          id="downloads.error"
                          defaultMessage="Error"
                        />
                        {':'}
                      </>
                    }
                    type="error"
                  >
                    <div className="line-clamp-3">{torrent.errorMessage}</div>
                  </Alert>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.size"
                      defaultMessage="Size"
                    />
                    :
                  </span>
                  <span className="font-medium ml-2">
                    {formatBytes(torrent.size)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.ratio"
                      defaultMessage="Ratio"
                    />
                    :
                  </span>
                  <span className="font-medium ml-2">
                    {torrent.ratio?.toFixed(2) ?? '-'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.downloadSpeed"
                      defaultMessage="Download Speed"
                    />
                    :
                  </span>
                  <span className="font-medium ml-2 text-success">
                    {formatSpeed(torrent.downloadSpeed)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.uploadSpeed"
                      defaultMessage="Upload Speed"
                    />
                    :
                  </span>
                  <span className="font-medium ml-2 text-info">
                    {formatSpeed(torrent.uploadSpeed)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral">
                    <FormattedMessage id="downloads.eta" defaultMessage="ETA" />
                    :
                  </span>
                  <span className="font-medium ml-2">
                    {formatEta(torrent.eta)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.savePath"
                      defaultMessage="Save Path"
                    />
                    :
                  </span>
                  <EditableField
                    value={torrent.savePath}
                    onSave={handleSavePath}
                    placeholder="Not set"
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <Accordion single>
              {({ handleClick, openIndexes, AccordionContent }) => (
                <>
                  <button
                    onClick={() => {
                      handleClick(0);
                      if (!filesLoaded && !isLoadingFiles) {
                        loadFiles();
                      }
                    }}
                    className={`flex items-center justify-between w-full text-lg font-semibold mb-1 bg-base-200 hover:text-primary hover:bg-base-300 transition-all ${openIndexes.includes(0) ? 'rounded-t-xl' : 'rounded-xl'} py-1 px-2`}
                  >
                    <FormattedMessage
                      id="downloads.content"
                      defaultMessage="Content"
                    />
                    <span className="text-sm">
                      <ChevronDownIcon
                        className={`size-6 transition-transform ${openIndexes.includes(0) ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>
                  <AccordionContent isOpen={openIndexes.includes(0)}>
                    {isLoadingFiles ? (
                      <div className="flex justify-center py-4">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    ) : files.length > 0 ? (
                      <TorrentFileList
                        files={files}
                        clientType={torrent.clientType}
                        onSetPriority={handleSetFilePriority}
                      />
                    ) : (
                      <div className="text-center text-neutral py-4">
                        <FormattedMessage
                          id="downloads.noFilesAvailable"
                          defaultMessage="No Files Available"
                        />
                      </div>
                    )}
                  </AccordionContent>
                </>
              )}
            </Accordion>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">
              <FormattedMessage
                id="downloads.peersSeeds"
                defaultMessage="Peers & Seeds"
              />
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="text-neutral">
                  <FormattedMessage
                    id="downloads.connectedPeers"
                    defaultMessage="Connected Peers"
                  />
                  :
                </span>
                <span className="font-medium">
                  {torrent.peers} / {torrent.totalPeers}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-neutral">
                  <FormattedMessage
                    id="downloads.connectedSeeds"
                    defaultMessage="Connected Seeds"
                  />
                  :
                </span>
                <span className="font-medium">
                  {torrent.seeds} / {torrent.totalSeeds}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">
              <FormattedMessage id="downloads.dates" defaultMessage="Dates" />
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage
                    id="downloads.addedDate"
                    defaultMessage="Added"
                  />
                  :
                </span>
                <span className="font-medium">
                  {momentWithLocale(torrent.addedDate).format('lll')}
                </span>
              </div>
              {torrent.completedDate && (
                <div className="flex justify-between">
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.completedDate"
                      defaultMessage="Completed"
                    />
                    :
                  </span>
                  <span className="font-medium">
                    {momentWithLocale(torrent.completedDate).format('lll')}
                  </span>
                </div>
              )}
              {torrent.lastSeenComplete && (
                <div className="flex justify-between">
                  <span className="text-neutral">
                    <FormattedMessage
                      id="downloads.lastSeenComplete"
                      defaultMessage="Last Seen Complete"
                    />
                    :
                  </span>
                  <span className="font-medium">
                    {momentWithLocale(torrent.lastSeenComplete).format('lll')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      {torrent && (
        <RemoveTorrentModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          onConfirm={handleConfirmDelete}
          torrentName={torrent.name}
          isProcessing={isRemoving}
        />
      )}
    </>
  );
};

export default TorrentDetailsModal;
