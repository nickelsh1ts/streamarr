'use client';
import LibraryItem from '@app/components/Admin/Settings/LibraryItem';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast, { dismissToast } from '@app/components/Toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { PlexDevice } from '@server/interfaces/api/plexInterfaces';
import type { PlexSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { orderBy } from 'lodash';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';
import { useIntl, FormattedMessage } from 'react-intl';
interface PresetServerDisplay {
  name: string;
  ssl: boolean;
  uri: string;
  address: string;
  port: number;
  local: boolean;
  status?: boolean;
  message?: string;
}

interface SettingsPlexProps {
  onComplete?: () => void;
}

const PlexSettings = ({ onComplete }: SettingsPlexProps) => {
  const intl = useIntl();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshingPresets, setIsRefreshingPresets] = useState(false);
  const [availableServers, setAvailableServers] = useState<PlexDevice[] | null>(
    null
  );
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<PlexSettings>('/api/v1/settings/plex');

  const PlexSettingsSchema = Yup.object().shape({
    hostname: Yup.string()
      .nullable()
      .required(
        intl.formatMessage({
          id: 'servicesSettings.validation.hostname',
          defaultMessage: 'You must provide a valid hostname or IP address',
        })
      )
      .matches(
        /^(((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])):((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))@)?(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
        intl.formatMessage({
          id: 'servicesSettings.validation.hostname',
          defaultMessage: 'You must provide a valid hostname or IP address',
        })
      ),
    port: Yup.number()
      .nullable()
      .required(
        intl.formatMessage({
          id: 'generalSettings.validation.port',
          defaultMessage: 'You must provide a valid port number',
        })
      ),
  });

  const activeLibraries =
    data?.libraries
      .filter((library) => library.enabled)
      .map((library) => library.id) ?? [];

  const availablePresets = useMemo(() => {
    const finalPresets: PresetServerDisplay[] = [];
    availableServers?.forEach((dev) => {
      dev.connection.forEach((conn) =>
        finalPresets.push({
          name: dev.name,
          ssl: conn.protocol === 'https',
          uri: conn.uri,
          address: conn.address,
          port: conn.port,
          local: conn.local,
          status: conn.status === 200,
          message: conn.message,
        })
      );
    });

    return orderBy(finalPresets, ['status', 'ssl'], ['desc', 'desc']);
  }, [availableServers]);

  const syncLibraries = async () => {
    setIsSyncing(true);

    const params: { sync: boolean; enable?: string } = {
      sync: true,
    };

    if (activeLibraries.length > 0) {
      params.enable = activeLibraries.join(',');
    }

    await axios.get('/api/v1/settings/plex/library', {
      params,
    });
    setIsSyncing(false);
    revalidate();
  };

  const refreshPresetServers = async () => {
    setIsRefreshingPresets(true);
    let toastId: string | undefined;
    try {
      Toast(
        {
          title: intl.formatMessage({
            id: 'plexSettings.retrievingServers',
            defaultMessage: 'Retrieving server list from Plex…',
          }),
          type: 'warning',
          icon: <ArrowPathIcon className="size-7 animate-spin" />,
          duration: Infinity,
        },
        (id) => {
          toastId = id;
        }
      );
      const response = await axios.get<PlexDevice[]>(
        '/api/v1/settings/plex/devices/servers'
      );
      if (response.data) {
        setAvailableServers(response.data);
        dismissToast(toastId);
      }
      Toast({
        title: intl.formatMessage({
          id: 'plexSettings.retrieveServersSuccess',
          defaultMessage: 'Plex server list retrieved successfully!',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch {
      if (toastId) dismissToast(toastId);
      Toast({
        title: intl.formatMessage({
          id: 'plexSettings.retrieveServersError',
          defaultMessage: 'Failed to retrieve Plex server list.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsRefreshingPresets(false);
    }
  };

  const toggleLibrary = async (libraryId: string) => {
    setIsSyncing(true);
    if (activeLibraries.includes(libraryId)) {
      const params: { enable?: string } = {};

      if (activeLibraries.length > 1) {
        params.enable = activeLibraries
          .filter((id) => id !== libraryId)
          .join(',');
      }

      await axios.get('/api/v1/settings/plex/library', {
        params,
      });
    } else {
      await axios.get('/api/v1/settings/plex/library', {
        params: {
          enable: [...activeLibraries, libraryId].join(','),
        },
      });
    }
    setIsSyncing(false);
    revalidate();
  };

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <>
      <div className="my-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="plexSettings.title"
            defaultMessage="Plex Settings"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="plexSettings.description"
            defaultMessage="Configure the settings for your Plex server. Streamarr scans your Plex libraries to generate menus and share to invited users."
          />
        </p>
        <RestartRequiredAlert filterServices={['Plex']} />
        {!!onComplete && (
          <Alert type="primary">
            <p className="text-sm leading-5 flex-1">
              <FormattedMessage
                id="plexSettings.setupInstructions"
                defaultMessage="To set up Plex, you can either enter the details manually or select a server retrieved from {plexLink}. Press the button to the right of the dropdown to fetch the list of available servers."
                values={{
                  plexLink: (
                    <a
                      href="https://plex.tv"
                      className="text-white transition duration-300 hover:underline inline-flex"
                      target="_blank"
                      rel="noreferrer"
                    >
                      plex.tv
                    </a>
                  ),
                }}
              />
            </p>
          </Alert>
        )}
      </div>
      <Formik
        initialValues={{
          hostname: data?.ip,
          port: data?.port ?? 32400,
          useSsl: data?.useSsl,
          selectedPreset: undefined,
        }}
        enableReinitialize
        validationSchema={PlexSettingsSchema}
        onSubmit={async (values) => {
          let toastId: string | undefined;
          try {
            Toast(
              {
                title: intl.formatMessage({
                  id: 'plexSettings.connecting',
                  defaultMessage: 'Attempting to connect to Plex…',
                }),
                type: 'warning',
                icon: <ArrowPathIcon className="size-7 animate-spin" />,
              },
              (id) => {
                toastId = id;
              }
            );

            await axios.post('/api/v1/settings/plex', {
              ip: values.hostname,
              port: Number(values.port),
              useSsl: values.useSsl,
            } as PlexSettings);

            syncLibraries();
            dismissToast(toastId);

            Toast({
              title: intl.formatMessage({
                id: 'plexSettings.connectionSuccess',
                defaultMessage: 'Plex connection established successfully!',
              }),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });

            mutate(RESTART_REQUIRED_SWR_KEY);

            if (onComplete) {
              onComplete();
            }
          } catch {
            Toast({
              title: intl.formatMessage({
                id: 'plexSettings.connectionError',
                defaultMessage: 'Failed to connect to Plex.',
              }),
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          }
        }}
      >
        {({
          errors,
          touched,
          values,
          handleSubmit,
          setFieldValue,
          isSubmitting,
          isValid,
        }) => {
          return (
            <form className="mt-5 max-w-6xl space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="preset">
                  <FormattedMessage
                    id="plexSettings.server"
                    defaultMessage="Server"
                  />
                </label>
                <div className="flex col-span-2">
                  <select
                    id="preset"
                    name="preset"
                    value={values.selectedPreset}
                    disabled={!availableServers || isRefreshingPresets}
                    className="select select-sm select-primary rounded-md rounded-r-none w-full disabled:border disabled:border-primary"
                    onChange={async (e) => {
                      const targPreset =
                        availablePresets[Number(e.target.value)];

                      if (targPreset) {
                        setFieldValue('hostname', targPreset.address);
                        setFieldValue('port', targPreset.port);
                        setFieldValue('useSsl', targPreset.ssl);
                      }
                    }}
                  >
                    <option value="manual">
                      {availableServers || isRefreshingPresets
                        ? isRefreshingPresets
                          ? intl.formatMessage({
                              id: 'plexSettings.retrievingServersOption',
                              defaultMessage: 'Retrieving servers…',
                            })
                          : intl.formatMessage({
                              id: 'plexSettings.manualConfiguration',
                              defaultMessage: 'Manual configuration',
                            })
                        : intl.formatMessage({
                            id: 'plexSettings.loadServersPrompt',
                            defaultMessage:
                              'Press the button to load available servers',
                          })}
                    </option>
                    {availablePresets.map((server, index) => (
                      <option
                        key={`preset-server-${index}`}
                        value={index}
                        disabled={!server.status}
                      >
                        {intl.formatMessage(
                          {
                            id: 'plexSettings.serverOption',
                            defaultMessage:
                              '{name} ({address}) [{location}]{secure}{status}',
                          },
                          {
                            name: server.name,
                            address: server.address,
                            location: server.local
                              ? intl.formatMessage({
                                  id: 'plexSettings.local',
                                  defaultMessage: 'local',
                                })
                              : intl.formatMessage({
                                  id: 'plexSettings.remote',
                                  defaultMessage: 'remote',
                                }),
                            secure: server.ssl
                              ? `[${intl.formatMessage({
                                  id: 'plexSettings.secure',
                                  defaultMessage: 'secure',
                                })}]`
                              : '',
                            status: !server.status
                              ? ` (${server.message})`
                              : '',
                          }
                        )}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      refreshPresetServers();
                    }}
                    className="btn btn-sm btn-primary rounded-md rounded-l-none"
                  >
                    <ArrowPathIcon
                      className={`size-5 ${isRefreshingPresets ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="hostname">
                  <FormattedMessage
                    id="common.hostname"
                    defaultMessage="Hostname or IP Address"
                  />
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 sm:text-sm">
                      {values.useSsl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      type="text"
                      inputMode="url"
                      id="hostname"
                      name="hostname"
                      className="input input-sm input-primary rounded-md rounded-l-none w-full"
                    />
                  </div>
                  {errors.hostname &&
                    touched.hostname &&
                    typeof errors.hostname === 'string' && (
                      <div className="text-error">{errors.hostname}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="port">
                  <FormattedMessage id="common.port" defaultMessage="Port" />
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="text"
                    inputMode="numeric"
                    id="port"
                    name="port"
                    className="input input-sm input-primary w-1/6 rounded-md"
                  />
                  {errors.port &&
                    touched.port &&
                    typeof errors.port === 'string' && (
                      <div className="text-error">{errors.port}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="ssl">
                  <FormattedMessage
                    id="common.useSsl"
                    defaultMessage="Use SSL"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="checkbox"
                    id="useSsl"
                    name="useSsl"
                    onChange={() => {
                      setFieldValue('useSsl', !values.useSsl);
                    }}
                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                  />
                </div>
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                  >
                    <ArrowDownTrayIcon className="size-4 mr-2" />
                    <span>
                      {isSubmitting ? (
                        <FormattedMessage
                          id="common.saving"
                          defaultMessage="Saving..."
                        />
                      ) : (
                        <FormattedMessage
                          id="common.saveChanges"
                          defaultMessage="Save Changes"
                        />
                      )}
                    </span>
                  </Button>
                </span>
              </div>
            </form>
          );
        }}
      </Formik>
      <div className="mt-10 mb-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="plexSettings.libraries.title"
            defaultMessage="Plex Libraries"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="plexSettings.libraries.description"
            defaultMessage="The libraries Streamarr will use. Set up and save your Plex connection settings, then click the button below if no libraries are listed."
          />
        </p>
      </div>
      <div className="max-w-6xl mb-10">
        <div className="">
          <Button
            buttonSize="sm"
            buttonType="primary"
            onClick={() => syncLibraries()}
            disabled={isSyncing || !data?.ip || !data?.port}
          >
            <ArrowPathIcon
              className={`size-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
              style={{ animationDirection: 'reverse' }}
            />
            <span>
              {isSyncing ? (
                <FormattedMessage
                  id="plexSettings.libraries.syncing"
                  defaultMessage="Syncing…"
                />
              ) : (
                <FormattedMessage
                  id="plexSettings.libraries.syncLibraries"
                  defaultMessage="Sync Libraries"
                />
              )}
            </span>
          </Button>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {data?.libraries.map((library) => (
              <LibraryItem
                name={library.name}
                isEnabled={library.enabled}
                key={`setting-library-${library.id}`}
                onToggle={() => toggleLibrary(library.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
export default PlexSettings;
