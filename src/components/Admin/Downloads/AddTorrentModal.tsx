import React, { useState, useRef } from 'react';
import Modal from '@app/components/Common/Modal';
import { useDownloadActions } from '@app/hooks/useDownloads';
import type { DownloadClientSettings } from '@server/lib/settings';
import { FormattedMessage } from 'react-intl';
import { useIntl } from 'react-intl';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';

interface AddTorrentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: DownloadClientSettings[];
}

const AddTorrentModal: React.FC<AddTorrentModalProps> = ({
  isOpen,
  onClose,
  clients,
}) => {
  const intl = useIntl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [magnetOrUrl, setMagnetOrUrl] = useState('');
  const [selectedClient, setSelectedClient] = useState<number>(
    clients[0]?.id ?? 0
  );
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { addTorrent } = useDownloadActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let torrentData: string | undefined = undefined;

      // Handle file upload
      if (file) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (data:application/x-bittorrent;base64,)
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        torrentData = await base64Promise;
      }

      await addTorrent({
        clientId: selectedClient,
        torrent: magnetOrUrl.trim() || undefined,
        file: torrentData,
        category: category.trim() || undefined,
      });

      // Reset form and close
      setMagnetOrUrl('');
      setCategory('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } }; message?: string })
          .response?.data?.message ||
        (e as { message?: string }).message ||
        'Failed to add torrent';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.torrent')) {
        setErrorMessage('Please select a .torrent file');
        return;
      }
      setFile(selectedFile);
      setMagnetOrUrl(''); // Clear magnet/URL when file is selected
      setErrorMessage('');
    }
  };

  const handleReset = () => {
    setMagnetOrUrl('');
    setCategory('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrorMessage('');
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'downloads.addTorrent',
        defaultMessage: 'Add Torrent',
      })}
      onCancel={() => {
        handleReset();
        onClose();
      }}
      onOk={handleSubmit}
      okText={
        isSubmitting
          ? intl.formatMessage({
              id: 'downloads.adding',
              defaultMessage: 'Adding...',
            })
          : intl.formatMessage({
              id: 'downloads.addTorrent',
              defaultMessage: 'Add Torrent',
            })
      }
      okDisabled={
        isSubmitting || (!magnetOrUrl.trim() && !file) || clients.length === 0
      }
      onSecondary={handleReset}
      secondaryText={intl.formatMessage({
        id: 'downloads.reset',
        defaultMessage: 'Reset',
      })}
      secondaryButtonType="warning"
      cancelText={intl.formatMessage({
        id: 'common.cancel',
        defaultMessage: 'Cancel',
      })}
      show={isOpen}
    >
      <form
        onSubmit={handleSubmit}
        className="gap-7 flex flex-col border-t border-primary pt-4"
      >
        {errorMessage && (
          <Alert type="error">
            <span>
              {errorMessage ||
                intl.formatMessage({
                  id: 'common.somethingWentWrong',
                  defaultMessage: 'Something went wrong!',
                })}
            </span>
          </Alert>
        )}
        {clients.length === 0 ? (
          <Alert type="warning">
            <span>
              <FormattedMessage
                id="downloads.noClientsConfiguredMessage"
                defaultMessage="No download clients configured. Please add a client in settings."
              />
            </span>
          </Alert>
        ) : (
          <>
            <div className="form-control">
              <label
                htmlFor="client"
                className="block text-sm font-medium leading-6 text-left"
              >
                <span className="label-text">
                  <FormattedMessage
                    id="downloads.downloadClient"
                    defaultMessage="Download Client"
                  />
                </span>
              </label>
              <select
                id="client"
                className="select select-sm select-primary"
                value={selectedClient}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                required
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.client})
                  </option>
                ))}
              </select>
            </div>
            <div className="gap-1 flex flex-col">
              <div className="form-control">
                <label
                  htmlFor="magnetOrUrl"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="downloads.magnetOrUrl"
                      defaultMessage="Magnet Link or URL"
                    />
                  </span>
                </label>
                <input
                  type="text"
                  id="magnetOrUrl"
                  className="input input-sm input-primary"
                  placeholder="magnet:?xt=urn:btih:... or https://..."
                  value={magnetOrUrl}
                  onChange={(e) => {
                    setMagnetOrUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setFile(null); // Clear file when URL is entered
                    }
                  }}
                  disabled={!!file}
                />
              </div>
              <div className="divider mb-0 mt-2 uppercase">
                <FormattedMessage id="common.or" defaultMessage="or" />
              </div>
              <div className="form-control -mt-1">
                <label
                  htmlFor="torrentFile"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="downloads.torrentFile"
                      defaultMessage="Upload .torrent File"
                    />
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="torrentFile"
                    ref={fileInputRef}
                    type="file"
                    accept=".torrent"
                    className="file-input file-input-primary file-input-sm flex-1"
                    onChange={handleFileChange}
                    disabled={!!magnetOrUrl.trim()}
                  />
                  {file && (
                    <Button
                      buttonType="error"
                      buttonSize="sm"
                      className="btn-square"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      title={intl.formatMessage({
                        id: 'downloads.removeFile',
                        defaultMessage: 'Remove file',
                      })}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {(() => {
              const client = clients.find((c) => c.id === selectedClient);
              const supportsCategory =
                client?.client === 'qbittorrent' || client?.client === 'deluge';

              if (!supportsCategory) return null;

              return (
                <div className="gap-2 flex flex-col">
                  <div className="form-control">
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium leading-6 text-left"
                    >
                      <span className="label-text">
                        <FormattedMessage
                          id={
                            client?.client === 'deluge'
                              ? 'downloads.label'
                              : 'downloads.category'
                          }
                          defaultMessage={
                            client?.client === 'deluge' ? 'Label' : 'Category'
                          }
                        />
                      </span>
                      <span className="text-neutral ml-2">
                        (
                        <FormattedMessage
                          id="common.optional"
                          defaultMessage="optional"
                        />
                        )
                      </span>
                    </label>
                    <input
                      id="category"
                      type="text"
                      className="input input-sm input-primary"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder={intl.formatMessage({
                        id: 'downloads.labelPlaceholder',
                        defaultMessage: 'e.g., movies, tv-shows',
                      })}
                    />
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </form>
    </Modal>
  );
};

export default AddTorrentModal;
