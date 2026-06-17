import ProgressBar from '@app/components/Common/ProgressBar';
import { formatBytes } from '@app/utils/numberHelper';
import type { TorrentFile } from '@server/interfaces/api/downloadsInterfaces';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

interface TorrentFileListProps {
  files: TorrentFile[];
  clientType: 'qbittorrent' | 'deluge' | 'transmission';
  onSetPriority: (fileIds: number[], priority: number) => Promise<void>;
  isUpdating?: boolean;
}

const TorrentFileList: React.FC<TorrentFileListProps> = ({
  files,
  clientType,
  onSetPriority,
  isUpdating = false,
}) => {
  const [updatingFiles, setUpdatingFiles] = useState<Set<number>>(new Set());

  const getPriorityLabel = (priority: number): string => {
    if (clientType === 'deluge') {
      // Deluge uses: 0=skip, 1=low, 2=normal, 5=high
      switch (priority) {
        case 0:
          return 'Skip';
        case 1:
          return 'Low';
        case 2:
          return 'Normal';
        case 5:
          return 'High';
        default:
          return 'Mixed';
      }
    } else if (clientType === 'transmission') {
      // Transmission uses: 0=skip, 1=normal, 6=high (we map -1 to 1 for low)
      switch (priority) {
        case 0:
          return 'Skip';
        case 1:
          return 'Low';
        case 2:
          return 'Normal';
        case 6:
          return 'High';
        default:
          return 'Mixed';
      }
    } else {
      // qBittorrent uses: 0=skip, 1=normal, 6=high, 7=maximum
      switch (priority) {
        case 0:
          return 'Do not download';
        case 1:
          return 'Normal';
        case 6:
          return 'High';
        case 7:
          return 'Maximum';
        default:
          return 'Mixed';
      }
    }
  };

  const handlePriorityChange = async (
    fileIndex: number,
    newPriority: number
  ) => {
    setUpdatingFiles((prev) => new Set(prev).add(fileIndex));
    try {
      await onSetPriority([fileIndex], newPriority);
    } finally {
      setUpdatingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileIndex);
        return next;
      });
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-neutral py-4 text-center">
        <FormattedMessage
          id="downloads.noFilesFound"
          defaultMessage="No files found"
        />
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-auto">
      <table className="table-xs table">
        <thead className="bg-base-100 sticky top-0 z-10">
          <tr>
            <th className="max-w-xs min-w-50">
              <FormattedMessage id="common.name" defaultMessage="Name" />
            </th>
            <th className="min-w-20">
              <FormattedMessage id="common.size" defaultMessage="Size" />
            </th>
            <th className="min-w-30">
              <FormattedMessage
                id="common.progress"
                defaultMessage="Progress"
              />
            </th>
            <th className="min-w-35">
              <FormattedMessage
                id="common.priority"
                defaultMessage="Priority"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.index} className="hover">
              <td className="max-w-xs min-w-50">
                <span className="block truncate text-xs" title={file.name}>
                  {file.name}
                </span>
              </td>
              <td className="min-w-20 text-xs whitespace-nowrap">
                {formatBytes(file.size)}
              </td>
              <td className="min-w-30">
                <ProgressBar progress={file.progress * 100} />
              </td>
              <td className="min-w-35">
                <div className="flex items-center gap-1">
                  <select
                    className="select select-xs select-primary min-w-30"
                    value={file.priority}
                    onChange={(e) =>
                      handlePriorityChange(file.index, parseInt(e.target.value))
                    }
                    disabled={isUpdating || updatingFiles.has(file.index)}
                  >
                    {clientType === 'deluge' ? (
                      // Deluge: 0=skip, 1=low, 2=normal, 5=high
                      <>
                        <option value={0}>{getPriorityLabel(0)}</option>
                        <option value={1}>{getPriorityLabel(1)}</option>
                        <option value={2}>{getPriorityLabel(2)}</option>
                        <option value={5}>{getPriorityLabel(5)}</option>
                      </>
                    ) : clientType === 'transmission' ? (
                      // Transmission: 0=skip, 1=low, 2=normal, 6=high
                      <>
                        <option value={0}>{getPriorityLabel(0)}</option>
                        <option value={1}>{getPriorityLabel(1)}</option>
                        <option value={2}>{getPriorityLabel(2)}</option>
                        <option value={6}>{getPriorityLabel(6)}</option>
                      </>
                    ) : (
                      // qBittorrent: 0=skip, 1=normal, 6=high, 7=maximum
                      <>
                        <option value={0}>{getPriorityLabel(0)}</option>
                        <option value={1}>{getPriorityLabel(1)}</option>
                        <option value={6}>{getPriorityLabel(6)}</option>
                        <option value={7}>{getPriorityLabel(7)}</option>
                      </>
                    )}
                  </select>
                  {updatingFiles.has(file.index) && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TorrentFileList;
