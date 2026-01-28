import React, { useState } from 'react';
import Modal from '@app/components/Common/Modal';
import { FormattedMessage, useIntl } from 'react-intl';
import Alert from '@app/components/Common/Alert';

interface RemoveTorrentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteFiles: boolean) => void;
  torrentName: string;
  torrentCount?: number;
  isProcessing?: boolean;
}

const RemoveTorrentModal: React.FC<RemoveTorrentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  torrentName,
  torrentCount = 1,
  isProcessing = false,
}) => {
  const intl = useIntl();
  const [deleteFiles, setDeleteFiles] = useState(false);

  const handleConfirm = () => {
    onConfirm(deleteFiles);
    setDeleteFiles(false); // Reset for next time
  };

  const handleClose = () => {
    setDeleteFiles(false);
    onClose();
  };

  return (
    <Modal
      show={isOpen}
      onCancel={handleClose}
      title={intl.formatMessage({
        id: 'downloads.removeTorrent',
        defaultMessage: 'Remove torrent',
      })}
      onOk={handleConfirm}
      okText={
        isProcessing
          ? intl.formatMessage({
              id: 'common.removing',
              defaultMessage: 'Removing...',
            })
          : intl.formatMessage({
              id: 'common.remove',
              defaultMessage: 'Remove',
            })
      }
      cancelText={intl.formatMessage({
        id: 'common.cancel',
        defaultMessage: 'Cancel',
      })}
      okButtonType="error"
      okDisabled={isProcessing}
    >
      <div className="space-y-4">
        <p className="text-sm">
          <FormattedMessage
            id="downloads.confirmRemoveMessage"
            defaultMessage="Are you sure you want to remove the selected {count, plural, one {torrent} other {torrents}} from the download client?"
            values={{ count: torrentCount }}
          />
        </p>
        <div className="form-control">
          <label
            htmlFor="permanently"
            className="label cursor-pointer justify-start gap-3"
          >
            <input
              id="permanently"
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={deleteFiles}
              onChange={(e) => setDeleteFiles(e.target.checked)}
              disabled={isProcessing}
            />
            <span className="label-text">
              <FormattedMessage
                id="downloads.alsoDeleteFiles"
                defaultMessage="Also permanently delete the files"
              />
            </span>
          </label>
        </div>
        {deleteFiles && (
          <Alert>
            <span className="text-sm">
              <FormattedMessage
                id="downloads.deleteFilesWarning"
                defaultMessage="This action cannot be undone!"
              />
            </span>
          </Alert>
        )}

        <div className="text-xs text-neutral truncate">{torrentName}</div>
      </div>
    </Modal>
  );
};

export default RemoveTorrentModal;
