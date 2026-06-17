import Accordion from '@app/components/Common/Accordion';
import Alert from '@app/components/Common/Alert';
import Modal from '@app/components/Common/Modal';
import ProgressBar from '@app/components/Common/ProgressBar';
import Toast from '@app/components/Toast';
import {
  useClientTags,
  useDownloadActions,
  useTorrentFiles,
} from '@app/hooks/useDownloads';
import { momentWithLocale } from '@app/utils/momentLocale';
import { formatBytes, formatEta, formatSpeed } from '@app/utils/numberHelper';
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  PlusIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type {
  DownloadClientStats,
  NormalizedDownloadItem,
} from '@server/interfaces/api/downloadsInterfaces';
import React, { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import EditableField from './EditableField';
import RemoveTorrentModal from './RemoveTorrentModal';
import TorrentFileList from './TorrentFileList';

interface TorrentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  torrent: NormalizedDownloadItem | null;
  onRefresh?: () => void;
  stats?: DownloadClientStats[];
}

const TorrentDetailsModal: React.FC<TorrentDetailsModalProps> = ({
  isOpen,
  onClose,
  torrent,
  onRefresh,
  stats = [],
}) => {
  const intl = useIntl();
  const [shouldLoadFiles, setShouldLoadFiles] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Reset transient state when the modal transitions to closed
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setShouldLoadFiles(false);
      setShowTagInput(false);
      setNewTagInput('');
    }
  }

  const supportsGlobalTags = torrent?.clientType === 'qbittorrent';
  const supportsTags =
    torrent?.clientType === 'qbittorrent' ||
    torrent?.clientType === 'transmission';

  const isStale = useMemo(() => {
    if (!torrent) return false;
    const clientStat = stats.find((s) => s.clientId === torrent.clientId);
    return clientStat?.health?.isStale === true;
  }, [stats, torrent]);

  const {
    files,
    isLoading: isLoadingFiles,
    mutate: mutateFiles,
  } = useTorrentFiles(
    torrent?.hash ?? null,
    torrent?.clientId ?? null,
    shouldLoadFiles
  );

  const { tags: availableTags, mutate: mutateTags } = useClientTags(
    torrent?.clientId ?? null,
    showTagInput && !!supportsGlobalTags
  );

  const {
    pause,
    resume,
    forceRecheck,
    remove,
    updateTorrent,
    setFilePriority,
    manageTags,
  } = useDownloadActions();

  if (!torrent) return null;

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

  const handleAddTag = async (tag: string) => {
    if (!torrent || !tag.trim()) return;

    try {
      // For qBittorrent, create the tag first if it doesn't exist
      if (supportsGlobalTags && !availableTags.includes(tag.trim())) {
        await manageTags({
          clientId: torrent.clientId,
          action: 'create',
          tags: [tag.trim()],
        });
      }

      await manageTags({
        clientId: torrent.clientId,
        action: 'add',
        tags: [tag.trim()],
        hashes: [torrent.hash],
      });

      Toast({
        type: 'success',
        message: intl.formatMessage({
          id: 'downloads.tagAdded',
          defaultMessage: 'Tag added successfully',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
      });
      setNewTagInput('');
      setShowTagInput(false);
      onRefresh?.();
      // Refresh available tags list
      if (supportsGlobalTags) {
        mutateTags();
      }
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToAddTag',
          defaultMessage: 'Failed to add tag',
        }),
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!torrent) return;

    try {
      await manageTags({
        clientId: torrent.clientId,
        action: 'remove',
        tags: [tag],
        hashes: [torrent.hash],
      });

      Toast({
        type: 'success',
        message: intl.formatMessage({
          id: 'downloads.tagRemoved',
          defaultMessage: 'Tag removed successfully',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
      });
      onRefresh?.();
    } catch {
      Toast({
        type: 'error',
        message: intl.formatMessage({
          id: 'downloads.failedToRemoveTag',
          defaultMessage: 'Failed to remove tag',
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
      mutateFiles();
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
                id: 'common.resume',
                defaultMessage: 'Resume',
              })
            : canPause
              ? intl.formatMessage({
                  id: 'common.pause',
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
        <div className="border-primary space-y-6 border-t pt-4">
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              <FormattedMessage
                id="downloads.generalInfo"
                defaultMessage="General Information"
              />
            </h3>
            {isStale && (
              <Alert
                title={intl.formatMessage({
                  id: 'downloads.staleDataWarning',
                  defaultMessage: 'Client Unreachable',
                })}
                type="warning"
              >
                {intl.formatMessage({
                  id: 'downloads.staleData',
                  defaultMessage:
                    'The data for this torrent may be outdated because the download client is offline or not responding.',
                })}
              </Alert>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage id="common.name" defaultMessage="Name" />:
                </span>
                <span className="ml-4 font-medium break-all">
                  {torrent.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">
                  <FormattedMessage id="downloads.hash" defaultMessage="Hash" />
                  :
                </span>
                <span className="ml-4 font-mono text-xs break-all">
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
                    id="common.status"
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
                    {torrent.clientType === 'deluge' ? (
                      <FormattedMessage
                        id="downloads.label"
                        defaultMessage="Label"
                      />
                    ) : (
                      <FormattedMessage
                        id="downloads.category"
                        defaultMessage="Category"
                      />
                    )}
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
              {supportsTags && (
                <div className="flex items-start justify-between">
                  <span className="text-neutral mt-0.5">
                    <FormattedMessage
                      id="downloads.tags"
                      defaultMessage="Tags"
                    />
                    :
                  </span>
                  <div className="ml-4 flex flex-wrap items-center justify-end gap-1.5">
                    {torrent.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary/15 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-error transition-colors"
                          title={intl.formatMessage({
                            id: 'downloads.removeTag',
                            defaultMessage: 'Remove tag',
                          })}
                          aria-label={intl.formatMessage(
                            {
                              id: 'downloads.removeTagLabel',
                              defaultMessage: 'Remove tag {tag}',
                            },
                            {
                              tag,
                            }
                          )}
                        >
                          <XMarkIcon className="size-4" />
                        </button>
                      </span>
                    ))}
                    {showTagInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          id="tags-input"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTagInput.trim()) {
                              handleAddTag(newTagInput);
                            } else if (e.key === 'Escape') {
                              setShowTagInput(false);
                              setNewTagInput('');
                            }
                          }}
                          list="available-tags"
                          placeholder={intl.formatMessage({
                            id: 'downloads.tagName',
                            defaultMessage: 'Tag name',
                          })}
                          className="input input-sm input-primary w-36"
                          autoFocus
                        />
                        {supportsGlobalTags && availableTags.length > 0 && (
                          <datalist id="available-tags">
                            {availableTags
                              .filter((t) => !torrent.tags?.includes(t))
                              .map((t) => (
                                <option key={t} value={t} />
                              ))}
                          </datalist>
                        )}
                        <button
                          onClick={() => {
                            if (newTagInput.trim()) {
                              handleAddTag(newTagInput);
                            }
                          }}
                          className="btn btn-xs btn-ghost btn-circle"
                        >
                          <CheckCircleIcon className="text-success size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowTagInput(false);
                            setNewTagInput('');
                          }}
                          className="btn btn-xs btn-ghost btn-circle"
                        >
                          <XMarkIcon className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowTagInput(true);
                        }}
                        className="btn btn-xs btn-ghost btn-circle"
                        title={intl.formatMessage({
                          id: 'downloads.addTag',
                          defaultMessage: 'Add tag',
                        })}
                      >
                        <PlusIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              <FormattedMessage
                id="downloads.progressStats"
                defaultMessage="Progress & Statistics"
              />
            </h3>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-neutral">
                    <FormattedMessage
                      id="common.progress"
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
                          id="common.error"
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
                    <FormattedMessage id="common.size" defaultMessage="Size" />:
                  </span>
                  <span className="ml-2 font-medium">
                    {formatBytes(torrent.size)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral">
                    <FormattedMessage
                      id="common.ratio"
                      defaultMessage="Ratio"
                    />
                    :
                  </span>
                  <span className="ml-2 font-medium">
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
                  <span className="text-success ml-2 font-medium">
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
                  <span className="text-info ml-2 font-medium">
                    {formatSpeed(torrent.uploadSpeed)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral">
                    <FormattedMessage id="common.eta" defaultMessage="ETA" />:
                  </span>
                  <span className="ml-2 font-medium">
                    {formatEta(torrent.eta)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
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
                      if (!shouldLoadFiles) {
                        setShouldLoadFiles(true);
                      }
                    }}
                    className={`bg-base-200 hover:text-primary hover:bg-base-300 mb-1 flex w-full items-center justify-between text-lg font-semibold transition-all ${openIndexes.includes(0) ? 'rounded-t-xl' : 'rounded-xl'} px-2 py-1`}
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
                      <div className="text-neutral py-4 text-center">
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
            <h3 className="mb-3 text-lg font-semibold">
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
            <h3 className="mb-3 text-lg font-semibold">
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
                      id="common.completed"
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
      <RemoveTorrentModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleConfirmDelete}
        torrentName={torrent.name}
        isProcessing={isRemoving}
      />
    </>
  );
};

export default TorrentDetailsModal;
