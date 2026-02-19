'use client';
import RadarrLogo from '@app/assets/services/radarr.svg';
import SonarrLogo from '@app/assets/services/sonarr.svg';
import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import RadarrModal from '@app/components/Admin/Settings/Services/Radarr/RadarrModal';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import type { RadarrSettings } from '@server/lib/settings';
import axios from 'axios';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';

interface ServerInstanceProps {
  name: string;
  isDefault?: boolean;
  is4k?: boolean;
  hostname: string;
  port: number;
  isSSL?: boolean;
  externalUrl?: string;
  isSonarr?: boolean;
  urlBase?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const ServerInstance = ({
  name,
  hostname,
  port,
  is4k = false,
  isDefault = false,
  isSSL = false,
  isSonarr = false,
  urlBase,
  onEdit,
  onDelete,
}: ServerInstanceProps) => {
  const internalUrl =
    (isSSL ? 'https://' : 'http://') + hostname + ':' + String(port);
  const serviceUrl = internalUrl;

  return (
    <li className="col-span-1 rounded-lg bg-base-200 shadow">
      <div className="flex w-full items-center justify-between space-x-6 p-6">
        <div className="flex-1 truncate">
          <div className="mb-2 flex items-center space-x-2">
            <h3 className="truncate font-medium leading-5">
              <a
                href={serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition duration-300 hover:underline"
              >
                {name}
              </a>
            </h3>
            {isDefault && !is4k && (
              <Badge>
                <FormattedMessage
                  id="common.default"
                  defaultMessage="Default"
                />
              </Badge>
            )}
            {isDefault && is4k && (
              <Badge>
                <FormattedMessage
                  id="common.default4k"
                  defaultMessage="Default 4K Server"
                />
              </Badge>
            )}
            {!isDefault && is4k && (
              <Badge badgeType="warning">
                <FormattedMessage id="common.4k" defaultMessage="4K" />
              </Badge>
            )}
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
          <p className="mt-1 truncate text-sm leading-5">
            <span className="mr-2 font-bold">
              <FormattedMessage id="common.urlBase" defaultMessage="URL Base" />
            </span>
            {urlBase}
          </p>
        </div>
        <a
          href={serviceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-50 hover:opacity-100"
        >
          {isSonarr ? (
            <SonarrLogo className="h-10 w-10 flex-shrink-0" />
          ) : (
            <RadarrLogo className="h-10 w-10 flex-shrink-0" />
          )}
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

const SettingsServicesRadarr = () => {
  const intl = useIntl();
  const {
    data: radarrData,
    error: radarrError,
    mutate: revalidateRadarr,
  } = useSWR<RadarrSettings[]>('/api/v1/settings/radarr');
  const [editRadarrModal, setEditRadarrModal] = useState<{
    open: boolean;
    radarr: RadarrSettings | null;
  }>({
    open: false,
    radarr: null,
  });
  const [deleteServerModal, setDeleteServerModal] = useState<{
    open: boolean;
    type: 'radarr' | 'sonarr';
    serverId: number | null;
  }>({
    open: false,
    type: 'radarr',
    serverId: null,
  });

  const deleteServer = async () => {
    await axios.delete(
      `/api/v1/settings/${deleteServerModal.type}/${deleteServerModal.serverId}`
    );
    setDeleteServerModal({ open: false, serverId: null, type: 'radarr' });
    revalidateRadarr();
    mutate('/api/v1/settings/public');
    mutate(RESTART_REQUIRED_SWR_KEY);
  };

  return (
    <>
      <div className="mb-6 max-w-6xl">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="radarrSettings.title"
            defaultMessage="Radarr Settings"
          />
        </h3>
        <p className="description">
          <FormattedMessage
            id="radarrSettings.description"
            defaultMessage="Configure your Radarr server(s) below. You can connect multiple Radarr servers, but only two of them can be marked as defaults (one non-4K and one 4K). Administrators are able to override the server(s) used to process new events."
          />
        </p>
      </div>
      <RadarrModal
        radarr={editRadarrModal.radarr}
        onClose={() => setEditRadarrModal({ open: false, radarr: null })}
        onSave={() => {
          revalidateRadarr();
          mutate('/api/v1/settings/public');
          mutate(RESTART_REQUIRED_SWR_KEY);
          setEditRadarrModal({ open: false, radarr: null });
        }}
        show={editRadarrModal.open}
      />
      <Modal
        okText={intl.formatMessage({
          id: 'common.delete',
          defaultMessage: 'Delete',
        })}
        okButtonType="error"
        show={deleteServerModal.open}
        onOk={() => deleteServer()}
        onCancel={() =>
          setDeleteServerModal({
            open: false,
            serverId: null,
            type: 'radarr',
          })
        }
        title={intl.formatMessage({
          id: 'radarrSettings.deleteTitle',
          defaultMessage: 'Delete Radarr Server',
        })}
      >
        <FormattedMessage
          id="radarrSettings.deleteconfirm"
          defaultMessage="Are you sure you want to delete this server?"
        />
      </Modal>
      <div className="section">
        {!radarrData && !radarrError && <LoadingEllipsis />}
        {radarrData && !radarrError && (
          <>
            <div className="max-w-6xl">
              <RestartRequiredAlert filterServices={['Radarr']} />
              {radarrData.length > 0 &&
                (!radarrData.some((radarr) => radarr.isDefault) ? (
                  <Alert
                    title={intl.formatMessage({
                      id: 'radarrSettings.noDefaultServer',
                      defaultMessage:
                        'At least one Radarr server must be marked as default in order for movie events to be processed.',
                    })}
                  />
                ) : !radarrData.some(
                    (radarr) => radarr.isDefault && !radarr.is4k
                  ) ? (
                  <Alert
                    title={intl.formatMessage({
                      id: 'radarrSettings.single4kWarning',
                      defaultMessage:
                        'If you only have a single Radarr server for both non-4K and 4K content (or if you only download 4K content), your Radarr server should NOT be designated as a 4K server.',
                    })}
                  />
                ) : (
                  radarrData.some((radarr) => radarr.is4k) &&
                  !radarrData.some(
                    (radarr) => radarr.isDefault && radarr.is4k
                  ) && (
                    <Alert
                      title={intl.formatMessage({
                        id: 'radarrSettings.no4kdefault',
                        defaultMessage:
                          'A 4K Radarr server must be marked as default in order to enable new 4K Radarr events.',
                      })}
                    />
                  )
                ))}
            </div>
            <ul className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {radarrData.map((radarr) => (
                <ServerInstance
                  key={`radarr-config-${radarr.id}`}
                  name={radarr.name}
                  hostname={radarr.hostname}
                  port={radarr.port}
                  isSSL={radarr.useSsl}
                  isDefault={radarr.isDefault}
                  is4k={radarr.is4k}
                  urlBase={radarr.baseUrl}
                  onEdit={() => setEditRadarrModal({ open: true, radarr })}
                  onDelete={() =>
                    setDeleteServerModal({
                      open: true,
                      serverId: radarr.id,
                      type: 'radarr',
                    })
                  }
                />
              ))}
              <li className="col-span-1 h-32 rounded-lg border-2 border-dashed border-primary shadow sm:h-44">
                <div className="flex h-full w-full items-center justify-center">
                  <Button
                    buttonType="ghost"
                    className="mt-3 mb-3"
                    onClick={() =>
                      setEditRadarrModal({ open: true, radarr: null })
                    }
                  >
                    <PlusIcon className="size-7 mr-2" />
                    <span>
                      <FormattedMessage
                        id="radarrSettings.addserver"
                        defaultMessage="Add Radarr Server"
                      />
                    </span>
                  </Button>
                </div>
              </li>
            </ul>
          </>
        )}
      </div>
    </>
  );
};

export default SettingsServicesRadarr;
