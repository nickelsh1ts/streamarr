import React, { useState } from 'react';
import type { TorrentFile } from '@server/interfaces/api/downloadsInterfaces';
import ProgressBar from '@app/components/Common/ProgressBar';
import { FormattedMessage } from 'react-intl';

interface TorrentFileListProps {
  files: TorrentFile[];
  onSetPriority: (fileIds: number[], priority: number) => Promise<void>;
  isUpdating?: boolean;
}

const TorrentFileList: React.FC<TorrentFileListProps> = ({
  files,
  onSetPriority,
  isUpdating = false,
}) => {
  const [updatingFiles, setUpdatingFiles] = useState<Set<number>>(new Set());

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

  const getPriorityLabel = (priority: number): string => {
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
      <div className="text-center text-neutral py-4">
        <FormattedMessage
          id="downloads.noFilesFound"
          defaultMessage="No files found"
        />
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-96">
      <table className="table table-xs">
        <thead className="sticky top-0 bg-base-100 z-10">
          <tr>
            <th className="min-w-[200px] max-w-xs">
              <FormattedMessage id="downloads.fileName" defaultMessage="Name" />
            </th>
            <th className="min-w-[80px]">
              <FormattedMessage id="downloads.fileSize" defaultMessage="Size" />
            </th>
            <th className="min-w-[120px]">
              <FormattedMessage
                id="downloads.fileProgress"
                defaultMessage="Progress"
              />
            </th>
            <th className="min-w-[140px]">
              <FormattedMessage
                id="downloads.filePriority"
                defaultMessage="Priority"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.index} className="hover">
              <td className="min-w-[200px] max-w-xs">
                <span className="text-xs truncate block" title={file.name}>
                  {file.name}
                </span>
              </td>
              <td className="text-xs whitespace-nowrap min-w-[80px]">
                {formatBytes(file.size)}
              </td>
              <td className="min-w-[120px]">
                <ProgressBar progress={file.progress * 100} />
              </td>
              <td className="min-w-[140px]">
                <div className="flex items-center gap-1">
                  <select
                    className="select select-xs select-primary min-w-[120px]"
                    value={file.priority}
                    onChange={(e) =>
                      handlePriorityChange(file.index, parseInt(e.target.value))
                    }
                    disabled={
                      isUpdating ||
                      updatingFiles.has(file.index) ||
                      file.is_seed
                    }
                  >
                    <option value={0}>{getPriorityLabel(0)}</option>
                    <option value={1}>{getPriorityLabel(1)}</option>
                    <option value={6}>{getPriorityLabel(6)}</option>
                    <option value={7}>{getPriorityLabel(7)}</option>
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
