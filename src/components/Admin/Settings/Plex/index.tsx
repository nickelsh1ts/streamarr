'use client';
import LibraryItem from '@app/components/Admin/Settings/LibraryItem';
import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownOnSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type { PlexDevice } from '@server/interfaces/api/plexInterfaces';
import type { PlexSettings, TautulliSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { orderBy } from 'lodash';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import * as Yup from 'yup';

interface Library {
  id: string;
  name: string;
  enabled: boolean;
}

interface SyncStatus {
  running: boolean;
  progress: number;
  total: number;
  currentLibrary?: Library;
  libraries: Library[];
}

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
  const { data: dataTautulli, mutate: revalidateTautulli } =
    useSWR<TautulliSettings>('/api/v1/settings/tautulli');
  const { data: dataSync, mutate: revalidateSync } = useSWR<SyncStatus>(
    '/api/v1/settings/plex/sync',
    {
      refreshInterval: 1000,
    }
  );

  const PlexSettingsSchema = Yup.object().shape({
    hostname: Yup.string()
      .nullable()
      .required('You must provide a valid hostname or IP address')
      .matches(
        /^(((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])):((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))@)?(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
        'You must provide a valid hostname or IP address'
      ),
    port: Yup.number()
      .nullable()
      .required('You must provide a valid port number'),
    webAppUrl: Yup.string().nullable().url('You must provide a valid URL'),
  });

  const TautulliSettingsSchema = Yup.object().shape(
    {
      tautulliHostname: Yup.string()
        .when(
          ['tautulliPort', 'tautulliApiKey'],
          ([tautulliPort, tautulliApiKey], schema) => {
            if (tautulliPort || tautulliApiKey) {
              return schema
                .nullable()
                .required('You must provide a valid hostname or IP address');
            }
            return schema.nullable();
          }
        )
        .matches(
          /^(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
          'You must provide a valid hostname or IP address'
        ),
      tautulliPort: Yup.number().when(
        ['tautulliHostname', 'tautulliApiKey'],
        ([tautulliHostname, tautulliApiKey], schema) => {
          if (tautulliHostname || tautulliApiKey) {
            return schema
              .typeError('You must provide a valid port number')
              .nullable()
              .required('You must provide a valid port number');
          }
          return schema
            .typeError('You must provide a valid port number')
            .nullable();
        }
      ),
      tautulliUrlBase: Yup.string()
        .test(
          'leading-slash',
          'URL base must have a leading slash',
          (value) => !value || value.startsWith('/')
        )
        .test(
          'no-trailing-slash',
          'URL base must not end in a trailing slash',
          (value) => !value || !value.endsWith('/')
        ),
      tautulliApiKey: Yup.string().when(
        ['tautulliHostname', 'tautulliPort'],
        ([tautulliHostname, tautulliPort], schema) => {
          if (tautulliHostname || tautulliPort) {
            return schema.nullable().required('You must provide an API key');
          }
          return schema.nullable();
        }
      ),
      tautulliExternalUrl: Yup.string()
        .url('You must provide a valid URL')
        .test(
          'no-trailing-slash',
          'URL must not end in a trailing slash',
          (value) => !value || !value.endsWith('/')
        ),
    },
    [
      ['tautulliHostname', 'tautulliPort'],
      ['tautulliHostname', 'tautulliApiKey'],
      ['tautulliPort', 'tautulliApiKey'],
    ]
  );

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
    try {
      Toast({ title: 'Retrieving server list from Plex…' });
      const response = await axios.get<PlexDevice[]>(
        '/api/v1/settings/plex/devices/servers'
      );
      if (response.data) {
        setAvailableServers(response.data);
      }
      Toast({ title: 'Plex server list retrieved successfully!' });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      Toast({ title: 'Failed to retrieve Plex server list.' });
    } finally {
      setIsRefreshingPresets(false);
    }
  };

  const startScan = async () => {
    await axios.post('/api/v1/settings/plex/sync', {
      start: true,
    });
    revalidateSync();
  };

  const cancelScan = async () => {
    await axios.post('/api/v1/settings/plex/sync', {
      cancel: true,
    });
    revalidateSync();
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

  if ((!data || !dataTautulli) && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <>
      <div className="my-6">
        <h3 className="text-2xl font-extrabold">Plex Settings</h3>
        <p className="mb-5">
          Configure the settings for your Plex server. Streamarr scans your Plex
          libraries to generate menus.
        </p>
        {!!onComplete && (
          <Alert title="" type="primary">
            <div className="ms-4">
              To set up Plex, you can either enter the details manually or
              select a server retrieved from{' '}
              <a
                href="https://plex.tv"
                className="text-white transition duration-300 hover:underline inline-flex"
                target="_blank"
                rel="noreferrer"
              >
                plex.tv
              </a>
              . Press the button to the right of the dropdown to fetch the list
              of available servers.
            </div>
          </Alert>
        )}
      </div>
      <Formik
        initialValues={{
          hostname: data?.ip,
          port: data?.port ?? 32400,
          useSsl: data?.useSsl,
          selectedPreset: undefined,
          webAppUrl: data?.webAppUrl,
        }}
        validationSchema={PlexSettingsSchema}
        onSubmit={async (values) => {
          try {
            Toast({ title: 'Attempting to connect to Plex…' });

            await axios.post('/api/v1/settings/plex', {
              ip: values.hostname,
              port: Number(values.port),
              useSsl: values.useSsl,
              webAppUrl: values.webAppUrl,
            } as PlexSettings);

            syncLibraries();

            Toast({ title: 'Plex connection established successfully!' });

            if (onComplete) {
              onComplete();
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            Toast({ title: 'Failed to connect to Plex.' });
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
            <form
              className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl"
              onSubmit={handleSubmit}
            >
              <div className="form-row">
                <label htmlFor="preset">Server</label>
                <div className="sm:col-span-2">
                  <div className="flex">
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
                            ? 'Retrieving servers…'
                            : 'Manual configuration'
                          : 'Press the button to load available servers'}
                      </option>
                      {availablePresets.map((server, index) => (
                        <option
                          key={`preset-server-${index}`}
                          value={index}
                          disabled={!server.status}
                        >
                          {`
                            ${server.name} (${server.address})
                            [${server.local ? 'local' : 'remote'}]${
                              server.ssl ? '[secure]' : ''
                            }
                            ${server.status ? '' : '(' + server.message + ')'}
                          `}
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
                        style={{ animationDirection: 'reverse' }}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="hostname">
                  Hostname or IP Address
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 text-primary-content sm:text-sm">
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
                      <div className="error">{errors.hostname}</div>
                    )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="port" className="text-label">
                  Port
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
                      <div className="error">{errors.port}</div>
                    )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="ssl" className="checkbox-label">
                  Use SSL
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
              <div className="form-row">
                <label htmlFor="webAppUrl">
                  <a
                    href="https://support.plex.tv/articles/200288666-opening-plex-web-app/"
                    target="_blank"
                    rel="noreferrer"
                    className="link-hover"
                  >
                    Web App
                  </a>{' '}
                  URL{' '}
                  <Tooltip
                    content={
                      'Incorrectly configuring this setting may result in broken functionality'
                    }
                  >
                    <Badge badgeType="error" className="ml-2">
                      Advanced
                    </Badge>
                  </Tooltip>
                  <span className="block text-neutral-300 text-sm">
                    Optionally direct users to the web app on your server
                    instead of the &quot;hosted&quot; web app
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <div className="form-input-field">
                    <Field
                      type="text"
                      inputMode="url"
                      id="webAppUrl"
                      name="webAppUrl"
                      placeholder="https://app.plex.tv/desktop"
                      className="input input-sm input-primary rounded-md w-full"
                    />
                  </div>
                  {errors.webAppUrl &&
                    touched.webAppUrl &&
                    typeof errors.webAppUrl === 'string' && (
                      <div className="error">{errors.webAppUrl}</div>
                    )}
                </div>
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                  >
                    <ArrowDownOnSquareIcon />
                    <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                  </Button>
                </span>
              </div>
            </form>
          );
        }}
      </Formik>

      <div className="mt-10 mb-6">
        <h3 className="heading">Plex Libraries</h3>
        <p className="description">
          The libraries Streamarr scans for titles. Set up and save your Plex
          connection settings, then click the button below if no libraries are
          listed.
        </p>
      </div>
      <div className="section">
        <div className="section">
          <Button
            onClick={() => syncLibraries()}
            disabled={isSyncing || !data?.ip || !data?.port}
          >
            <ArrowPathIcon
              className={isSyncing ? 'animate-spin' : ''}
              style={{ animationDirection: 'reverse' }}
            />
            <span>{isSyncing ? 'Syncing…' : 'Sync Libraries'}</span>
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
        <div className="mt-10 mb-6">
          <h3 className="heading">Manual Library Scan</h3>
          <p className="description">
            Normally, this will only be run once every 24 hours. Streamarr will
            check your Plex server&apos;s recently added more aggressively. If
            this is your first time configuring Plex, a one-time full manual
            library scan is recommended!
          </p>
        </div>
        <div className="section">
          <div className="rounded-md bg-gray-800 p-4">
            <div className="relative mb-6 h-8 w-full overflow-hidden rounded-full bg-gray-600">
              {dataSync?.running && (
                <div
                  className="h-8 bg-indigo-600 transition-all duration-200 ease-in-out"
                  style={{
                    width: `${Math.round(
                      (dataSync.progress / dataSync.total) * 100
                    )}%`,
                  }}
                />
              )}
              <div className="absolute inset-0 flex h-8 w-full items-center justify-center text-sm">
                <span>
                  {dataSync?.running
                    ? `${dataSync.progress} of ${dataSync.total}`
                    : 'Not running'}
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col sm:flex-row">
              {dataSync?.running && (
                <>
                  {dataSync.currentLibrary && (
                    <div className="mb-2 mr-0 flex items-center sm:mb-0 sm:mr-2">
                      <Badge>
                        Current Library: ${dataSync.currentLibrary.name}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Badge badgeType="warning">
                      Libraries Remaining:{' '}
                      {dataSync.currentLibrary
                        ? dataSync.libraries.slice(
                            dataSync.libraries.findIndex(
                              (library) =>
                                library.id === dataSync.currentLibrary?.id
                            ) + 1
                          ).length
                        : 0}
                    </Badge>
                  </div>
                </>
              )}
              <div className="flex-1 text-right">
                {!dataSync?.running ? (
                  <Button
                    buttonType="warning"
                    onClick={() => startScan()}
                    disabled={isSyncing || !activeLibraries.length}
                  >
                    <MagnifyingGlassIcon />
                    <span>Start Scan</span>
                  </Button>
                ) : (
                  <Button buttonType="error" onClick={() => cancelScan()}>
                    <XMarkIcon />
                    <span>Cancel Scan</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        {!onComplete && (
          <>
            <div className="mt-10 mb-6">
              <h3 className="heading">Tautulli Settings</h3>
              <p className="description">
                Optionally configure the settings for your Tautulli server.
                Streamarr fetches watch history data for your Plex media from
                Tautulli.
              </p>
            </div>
            <Formik
              initialValues={{
                tautulliHostname: dataTautulli?.hostname,
                tautulliPort: dataTautulli?.port ?? 8181,
                tautulliUseSsl: dataTautulli?.useSsl,
                tautulliUrlBase: dataTautulli?.urlBase,
                tautulliApiKey: dataTautulli?.apiKey,
                tautulliExternalUrl: dataTautulli?.externalUrl,
              }}
              validationSchema={TautulliSettingsSchema}
              onSubmit={async (values) => {
                try {
                  await axios.post('/api/v1/settings/tautulli', {
                    hostname: values.tautulliHostname,
                    port: Number(values.tautulliPort),
                    useSsl: values.tautulliUseSsl,
                    urlBase: values.tautulliUrlBase,
                    apiKey: values.tautulliApiKey,
                    externalUrl: values.tautulliExternalUrl,
                  } as TautulliSettings);

                  Toast({ title: 'Tautulli settings saved successfully!' });
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                  Toast({
                    title:
                      'Something went wrong while saving Tautulli settings.',
                  });
                } finally {
                  revalidateTautulli();
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
                  <form className="section" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <label htmlFor="tautulliHostname" className="text-label">
                        Hostname or IP Address
                        <span className="label-required">*</span>
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                            {values.tautulliUseSsl ? 'https://' : 'http://'}
                          </span>
                          <Field
                            type="text"
                            inputMode="url"
                            id="tautulliHostname"
                            name="tautulliHostname"
                            className="rounded-r-only"
                          />
                        </div>
                        {errors.tautulliHostname &&
                          touched.tautulliHostname &&
                          typeof errors.tautulliHostname === 'string' && (
                            <div className="error">
                              {errors.tautulliHostname}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="tautulliPort" className="text-label">
                        Port
                        <span className="label-required">*</span>
                      </label>
                      <div className="form-input-area">
                        <Field
                          type="text"
                          inputMode="numeric"
                          id="tautulliPort"
                          name="tautulliPort"
                          className="short"
                          autoComplete="off"
                          data-1pignore="true"
                          data-lpignore="true"
                          data-bwignore="true"
                        />
                        {errors.tautulliPort &&
                          touched.tautulliPort &&
                          typeof errors.tautulliPort === 'string' && (
                            <div className="error">{errors.tautulliPort}</div>
                          )}
                      </div>
                    </div>
                    <div className="form-row">
                      <label
                        htmlFor="tautulliUseSsl"
                        className="checkbox-label"
                      >
                        Use SSL
                      </label>
                      <div className="form-input-area">
                        <Field
                          type="checkbox"
                          id="tautulliUseSsl"
                          name="tautulliUseSsl"
                          onChange={() => {
                            setFieldValue(
                              'tautulliUseSsl',
                              !values.tautulliUseSsl
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="tautulliUrlBase" className="text-label">
                        URL Base
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <Field
                            type="text"
                            inputMode="url"
                            id="tautulliUrlBase"
                            name="tautulliUrlBase"
                            autoComplete="off"
                            data-1pignore="true"
                            data-lpignore="true"
                            data-bwignore="true"
                          />
                        </div>
                        {errors.tautulliUrlBase &&
                          touched.tautulliUrlBase &&
                          typeof errors.tautulliUrlBase === 'string' && (
                            <div className="error">
                              {errors.tautulliUrlBase}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="tautulliApiKey" className="text-label">
                        API Key
                        <span className="label-required">*</span>
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <SensitiveInput
                            as="field"
                            id="tautulliApiKey"
                            name="tautulliApiKey"
                          />
                        </div>
                        {errors.tautulliApiKey &&
                          touched.tautulliApiKey &&
                          typeof errors.tautulliApiKey === 'string' && (
                            <div className="error">{errors.tautulliApiKey}</div>
                          )}
                      </div>
                    </div>
                    <div className="form-row">
                      <label
                        htmlFor="tautulliExternalUrl"
                        className="text-label"
                      >
                        External URL
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <Field
                            type="text"
                            inputMode="url"
                            id="tautulliExternalUrl"
                            name="tautulliExternalUrl"
                            autoComplete="off"
                            data-1pignore="true"
                            data-lpignore="true"
                            data-bwignore="true"
                          />
                        </div>
                        {errors.tautulliExternalUrl &&
                          touched.tautulliExternalUrl && (
                            <div className="error">
                              {errors.tautulliExternalUrl}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="actions">
                      <div className="flex justify-end">
                        <span className="ml-3 inline-flex rounded-md shadow-sm">
                          <Button
                            buttonType="primary"
                            type="submit"
                            disabled={isSubmitting || !isValid}
                          >
                            <ArrowDownOnSquareIcon />
                            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                          </Button>
                        </span>
                      </div>
                    </div>
                  </form>
                );
              }}
            </Formik>
          </>
        )}
      </div>
    </>
  );
};
export default PlexSettings;
