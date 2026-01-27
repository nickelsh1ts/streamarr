'use client';
import QbtLogo from '@app/assets/services/qBittorrent.svg';
import DelugeLogo from '@app/assets/services/deluge.svg';
import TransmissionLogo from '@app/assets/services/transmission.png';
import Image from 'next/image';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import DownloadClientModal from '@app/components/Admin/Settings/Services/Downloads/DownloadClientModal';
import {
  ArrowDownTrayIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import type {
  DownloadClientSettings,
  DownloadClientType,
} from '@server/lib/settings';
import axios from 'axios';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

const CLIENT_NAMES: Record<DownloadClientType, string> = {
  qbittorrent: 'qBittorrent',
  deluge: 'Deluge',
  transmission: 'Transmission',
};

const ClientLogo = ({
  className,
  client,
}: {
  className?: string;
  client: DownloadClientType;
}) => {
  switch (client) {
    case 'qbittorrent':
      return <QbtLogo className={className} />;
    case 'deluge':
      return <DelugeLogo className={className} />;
    case 'transmission':
      return (
        <Image
          src={TransmissionLogo}
          alt="Transmission"
          className={className}
          width={40}
          height={40}
        />
      );
    default:
      return <ArrowDownTrayIcon className={className} />;
  }
};

interface DownloadClientInstanceProps {
  id: number;
  name: string;
  client: DownloadClientType;
  hostname: string;
  port: number;
  isSSL?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const DownloadClientInstance = ({
  id,
  name,
  client,
  hostname,
  port,
  isSSL = false,
  onEdit,
  onDelete,
}: DownloadClientInstanceProps) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    version?: string;
    error?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await axios.post(
        `/api/v1/settings/downloads/test/${id}`
      );
      setConnectionStatus(response.data);
    } catch (e) {
      setConnectionStatus({
        connected: false,
        error: e.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const internalUrl =
    (isSSL ? 'https://' : 'http://') + hostname + ':' + String(port);

  return (
    <li className="col-span-1 rounded-lg bg-base-200 shadow">
      <div className="flex w-full items-center justify-between space-x-6 p-6">
        <div className="flex-1 truncate">
          <div className="mb-2 flex items-center space-x-2">
            <h3 className="truncate font-medium leading-5">
              <a
                href={internalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition duration-300 hover:underline"
              >
                {name}
              </a>
            </h3>
            <Badge badgeType="default">{CLIENT_NAMES[client]}</Badge>
            {isSSL && (
              <Badge badgeType="success">
                <FormattedMessage id="common.ssl" defaultMessage="SSL" />
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-sm leading-5">
            <span className="mr-2 font-bold">
              <FormattedMessage
                id="common.hostname"
                defaultMessage="Hostname or IP Address"
              />
            </span>
            <a
              href={internalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition duration-300 hover:underline"
            >
              {internalUrl}
            </a>
          </p>
          <p className="mt-1 truncate text-sm leading-5 flex gap-2 items-center">
            <span className="font-bold">
              <FormattedMessage id="common.status" defaultMessage="Status" />
            </span>
            {isTesting ? (
              <Badge badgeType="warning">
                <FormattedMessage
                  id="common.status.testing"
                  defaultMessage="Testing..."
                />
              </Badge>
            ) : connectionStatus === null ? (
              <Button
                buttonType="primary"
                buttonSize="xs"
                onClick={testConnection}
              >
                <FormattedMessage
                  id="common.testConnection"
                  defaultMessage="Test Connection"
                />
              </Button>
            ) : connectionStatus.connected ? (
              <span className="flex items-center gap-1">
                <Badge badgeType="success">
                  <FormattedMessage
                    id="common.status.connected"
                    defaultMessage="Connected"
                  />
                </Badge>
                <Button
                  onClick={testConnection}
                  buttonType="ghost"
                  buttonSize="xs"
                  className="!h-5 !min-h-5 px-1.5"
                  title="Retest"
                >
                  ↻
                </Button>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Badge badgeType="error">
                  <FormattedMessage
                    id="common.status.disconnected"
                    defaultMessage="Disconnected"
                  />
                </Badge>
                <Button
                  onClick={testConnection}
                  buttonType="ghost"
                  buttonSize="xs"
                  className="!h-5 !min-h-5 px-1.5"
                  title="Retest"
                >
                  ↻
                </Button>
              </span>
            )}
          </p>
        </div>
        <a
          href={internalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-50 hover:opacity-100"
        >
          <ClientLogo client={client} className="h-10 w-10" />
        </a>
      </div>
      <div className="border-t border-primary">
        <div className="-mt-px flex">
          <div className="flex w-0 flex-1 border-r border-primary">
            <button
              onClick={() => onEdit()}
              className="focus:ring-primary relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium leading-5 transition duration-150 ease-in-out bg-primary text-primary-content bg-opacity-45 hover:bg-opacity-70 focus:z-10 focus:border-primary focus:outline-none"
            >
              <PencilIcon className="mr-2 h-5 w-5" />
              <span>
                <FormattedMessage id="common.edit" defaultMessage="Edit" />
              </span>
            </button>
          </div>
          <div className="-ml-px flex w-0 flex-1">
            <button
              onClick={() => onDelete()}
              className="focus:ring-primary relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent py-4 text-sm font-medium leading-5 transition duration-150 ease-in-out bg-primary text-primary-content bg-opacity-45 hover:bg-opacity-70 focus:z-10 focus:border-primary focus:outline-none"
            >
              <TrashIcon className="mr-2 h-5 w-5" />
              <span>
                <FormattedMessage id="common.delete" defaultMessage="Delete" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

const ServicesDownloads = () => {
  const intl = useIntl();
  const {
    data: downloadsData,
    error: downloadsError,
    mutate: revalidateDownloads,
  } = useSWR<DownloadClientSettings[]>('/api/v1/settings/downloads');

  const [editModal, setEditModal] = useState<{
    open: boolean;
    client: DownloadClientSettings | null;
  }>({
    open: false,
    client: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    clientId: number | null;
    clientName: string;
  }>({
    open: false,
    clientId: null,
    clientName: '',
  });

  const deleteClient = async () => {
    await axios.delete(`/api/v1/settings/downloads/${deleteModal.clientId}`);
    setDeleteModal({ open: false, clientId: null, clientName: '' });
    revalidateDownloads();
    mutate('/api/v1/settings/public');
  };

  return (
    <>
      <div className="mb-6 max-w-6xl">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="servicesSettings.downloads.title"
            defaultMessage="Downloads Settings"
          />
        </h3>
        <p className="description">
          <FormattedMessage
            id="servicesSettings.downloads.description"
            defaultMessage="Configure your download client(s) below. You can connect multiple download clients (qBittorrent, Deluge, Transmission)."
          />
        </p>
      </div>
      <DownloadClientModal
        downloadClient={editModal.client}
        onClose={() => setEditModal({ open: false, client: null })}
        onSave={() => {
          revalidateDownloads();
          mutate('/api/v1/settings/public');
          setEditModal({ open: false, client: null });
        }}
        show={editModal.open}
      />
      <Modal
        okText={intl.formatMessage({
          id: 'common.delete',
          defaultMessage: 'Delete',
        })}
        okButtonType="error"
        show={deleteModal.open}
        onOk={() => deleteClient()}
        onCancel={() =>
          setDeleteModal({
            open: false,
            clientId: null,
            clientName: '',
          })
        }
        title={intl.formatMessage({
          id: 'servicesSettings.downloads.deleteTitle',
          defaultMessage: 'Delete Download Client',
        })}
      >
        <FormattedMessage
          id="servicesSettings.downloads.deleteConfirm"
          defaultMessage='Are you sure you want to delete the download client "{name}"?'
          values={{ name: deleteModal.clientName }}
        />
      </Modal>
      <div className="section">
        {!downloadsData && !downloadsError && <LoadingEllipsis />}
        {downloadsData && !downloadsError && (
          <ul className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {downloadsData.map((client) => (
              <DownloadClientInstance
                key={`download-client-${client.id}`}
                id={client.id}
                name={client.name}
                client={client.client}
                hostname={client.hostname}
                port={client.port}
                isSSL={client.useSsl}
                onEdit={() => setEditModal({ open: true, client })}
                onDelete={() =>
                  setDeleteModal({
                    open: true,
                    clientId: client.id,
                    clientName: client.name,
                  })
                }
              />
            ))}
            <li className="col-span-1 h-32 rounded-lg border-2 border-dashed border-primary shadow sm:h-44">
              <div className="flex h-full w-full items-center justify-center">
                <Button
                  buttonType="ghost"
                  className="mt-3 mb-3"
                  onClick={() => setEditModal({ open: true, client: null })}
                >
                  <PlusIcon className="size-7 mr-2" />
                  <span>
                    <FormattedMessage
                      id="servicesSettings.downloads.addClient"
                      defaultMessage="Add Download Client"
                    />
                  </span>
                </Button>
              </div>
            </li>
          </ul>
        )}
      </div>
    </>
  );
};

export default ServicesDownloads;
