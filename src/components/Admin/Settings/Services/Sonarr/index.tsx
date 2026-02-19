'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import SonarrModal from '@app/components/Admin/Settings/Services/Sonarr/SonarrModal';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import { PlusIcon } from '@heroicons/react/24/solid';
import type { SonarrSettings } from '@server/lib/settings';
import axios from 'axios';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { ServerInstance } from '@app/components/Admin/Settings/Services/Radarr';
import { useIntl, FormattedMessage } from 'react-intl';

const SettingsServicesSonarr = () => {
  const intl = useIntl();
  const {
    data: sonarrData,
    error: sonarrError,
    mutate: revalidateSonarr,
  } = useSWR<SonarrSettings[]>('/api/v1/settings/sonarr');
  const [editSonarrModal, setEditSonarrModal] = useState<{
    open: boolean;
    sonarr: SonarrSettings | null;
  }>({
    open: false,
    sonarr: null,
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
    setDeleteServerModal({ open: false, serverId: null, type: 'sonarr' });
    revalidateSonarr();
    mutate('/api/v1/settings/public');
    mutate(RESTART_REQUIRED_SWR_KEY);
  };

  return (
    <>
      <div className="mb-6 max-w-6xl">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="sonarrSettings.title"
            defaultMessage="Sonarr Settings"
          />
        </h3>
        <p className="description">
          <FormattedMessage
            id="sonarrSettings.description"
            defaultMessage="Configure your Sonarr server(s) below. You can connect multiple Sonarr servers, but only two of them can be marked as defaults (one non-4K and one 4K). Administrators are able to override the server(s) used to process new events."
          />
        </p>
      </div>
      <SonarrModal
        sonarr={editSonarrModal.sonarr}
        onClose={() => setEditSonarrModal({ open: false, sonarr: null })}
        onSave={() => {
          revalidateSonarr();
          mutate('/api/v1/settings/public');
          mutate(RESTART_REQUIRED_SWR_KEY);
          setEditSonarrModal({ open: false, sonarr: null });
        }}
        show={editSonarrModal.open}
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
            type: 'sonarr',
          })
        }
        title={intl.formatMessage({
          id: 'sonarrSettings.deleteTitle',
          defaultMessage: 'Delete Sonarr Server',
        })}
      >
        <FormattedMessage
          id="radarrSettings.deleteconfirm"
          defaultMessage="Are you sure you want to delete this server?"
        />
      </Modal>
      <div className="section">
        {!sonarrData && !sonarrError && <LoadingEllipsis />}
        {sonarrData && !sonarrError && (
          <>
            <div className="max-w-6xl">
              <RestartRequiredAlert filterServices={['Sonarr']} />
              {sonarrData.length > 0 &&
                (!sonarrData.some((sonarr) => sonarr.isDefault) ? (
                  <Alert
                    title={
                      <FormattedMessage
                        id="sonarrSettings.noDefaultServer"
                        defaultMessage="At least one Sonarr server must be marked as default in order for tv show events to be processed."
                      />
                    }
                  />
                ) : !sonarrData.some(
                    (sonarr) => sonarr.isDefault && !sonarr.is4k
                  ) ? (
                  <Alert
                    title={
                      <FormattedMessage
                        id="sonarrSettings.single4kWarning"
                        defaultMessage="If you only have a single sonarr server for both non-4K and 4K content (or if you only download 4K content), your Sonarr server should NOT be designated as a 4K server."
                      />
                    }
                  />
                ) : (
                  sonarrData.some((sonarr) => sonarr.is4k) &&
                  !sonarrData.some(
                    (sonarr) => sonarr.isDefault && sonarr.is4k
                  ) && (
                    <Alert
                      title={
                        <FormattedMessage
                          id="sonarrSettings.no4kDefault"
                          defaultMessage="A 4K Sonarr server must be marked as default in order to enable new 4K Sonarr events."
                        />
                      }
                    />
                  )
                ))}
            </div>
            <ul className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {sonarrData.map((sonarr) => (
                <ServerInstance
                  key={`sonarr-config-${sonarr.id}`}
                  name={sonarr.name}
                  hostname={sonarr.hostname}
                  port={sonarr.port}
                  isSSL={sonarr.useSsl}
                  isSonarr
                  isDefault={sonarr.isDefault}
                  is4k={sonarr.is4k}
                  urlBase={sonarr.baseUrl}
                  onEdit={() => setEditSonarrModal({ open: true, sonarr })}
                  onDelete={() =>
                    setDeleteServerModal({
                      open: true,
                      serverId: sonarr.id,
                      type: 'sonarr',
                    })
                  }
                />
              ))}
              <li className="col-span-1 h-32 rounded-lg border-2 border-dashed border-primary shadow sm:h-44">
                <div className="flex h-full w-full items-center justify-center">
                  <Button
                    buttonType="ghost"
                    onClick={() =>
                      setEditSonarrModal({ open: true, sonarr: null })
                    }
                  >
                    <PlusIcon className="size-7 mr-2" />
                    <FormattedMessage
                      id="sonarrSettings.addServer"
                      defaultMessage="Add Sonarr Server"
                    />
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

export default SettingsServicesSonarr;
