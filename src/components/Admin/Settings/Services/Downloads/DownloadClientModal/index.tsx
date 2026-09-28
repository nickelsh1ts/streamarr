import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type {
  DownloadClientSettings,
  DownloadClientType,
} from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

interface DownloadClientModalProps {
  downloadClient: DownloadClientSettings | null;
  onClose: () => void;
  onSave: () => void;
  show: boolean;
}

type QbittorrentAuthType = 'password' | 'apiKey';

const DEFAULT_PORTS: Record<DownloadClientType, number> = {
  qbittorrent: 8080,
  deluge: 8112,
  transmission: 9091,
};

const CLIENT_NAMES: Record<DownloadClientType, string> = {
  qbittorrent: 'qBittorrent',
  deluge: 'Deluge',
  transmission: 'Transmission',
};

const DownloadClientModal = ({
  onClose,
  downloadClient,
  onSave,
  show,
}: DownloadClientModalProps) => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const [isValidated, setIsValidated] = useState(downloadClient ? true : false);
  const [isTesting, setIsTesting] = useState(() => Boolean(downloadClient));
  const DownloadClientSchema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage({
        id: 'servicesSettings.validation.servername',
        defaultMessage: 'You must provide a valid server name',
      })
    ),
    client: Yup.string()
      .oneOf(['qbittorrent', 'deluge', 'transmission'])
      .required(
        intl.formatMessage({
          id: 'servicesSettings.validation.clientType',
          defaultMessage: 'You must select a client type',
        })
      ),
    hostname: Yup.string()
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
    authType: Yup.string().oneOf(['password', 'apiKey']).required(),
    username: Yup.string().when(['client', 'authType'], {
      is: (client: string, authType: QbittorrentAuthType) =>
        client !== 'deluge' &&
        !(client === 'qbittorrent' && authType === 'apiKey'),
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'servicesSettings.validation.username',
            defaultMessage: 'You must provide a valid username',
          })
        ),
      otherwise: (schema) => schema.notRequired(),
    }),
    password: Yup.string().when(['client', 'authType'], {
      is: (client: string, authType: QbittorrentAuthType) =>
        client !== 'qbittorrent' || authType !== 'apiKey',
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'servicesSettings.validation.password',
            defaultMessage: 'You must provide a valid password',
          })
        ),
      otherwise: (schema) => schema.notRequired(),
    }),
    apiKey: Yup.string().when(['client', 'authType'], {
      is: (client: string, authType: QbittorrentAuthType) =>
        client === 'qbittorrent' && authType === 'apiKey',
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'servicesSettings.validation.apiKey',
            defaultMessage: 'You must provide a valid API key',
          })
        ),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const performTest = useCallback(
    async ({
      name,
      hostname,
      port,
      username,
      password,
      apiKey,
      client,
      useSsl,
    }: {
      name: string;
      hostname: string;
      port: number;
      username?: string;
      password?: string;
      apiKey?: string;
      client: DownloadClientType;
      useSsl: boolean;
    }) => {
      const result = await axios
        .post('/api/v1/settings/downloads/test', {
          name,
          hostname,
          port,
          username,
          password,
          apiKey,
          client,
          useSsl,
        })
        .then(
          (response) => ({
            connected: Boolean(response.data.connected),
            error: response.data.error,
          }),
          (e) => ({
            connected: false,
            error: e.response?.data?.message || e.message,
          })
        );

      try {
        if (result.connected) {
          setIsValidated(true);
          if (initialLoad.current) {
            Toast({
              title: intl.formatMessage(
                {
                  id: 'servicesSettings.downloads.testsuccess',
                  defaultMessage: 'Successfully connected to {client}',
                },
                { client: CLIENT_NAMES[client] }
              ),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          }
        } else {
          setIsValidated(false);
          if (initialLoad.current) {
            Toast({
              title: intl.formatMessage(
                {
                  id: 'servicesSettings.downloads.testfailed',
                  defaultMessage: 'Failed to connect to {client}',
                },
                { client: CLIENT_NAMES[client] }
              ),
              message: result.error || 'Connection failed',
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          }
        }
      } finally {
        setIsTesting(false);
        initialLoad.current = true;
      }
    },
    [intl]
  );

  const testConnection = useCallback(
    (params: {
      name: string;
      hostname: string;
      port: number;
      username?: string;
      password?: string;
      apiKey?: string;
      client: DownloadClientType;
      useSsl: boolean;
    }) => {
      setIsTesting(true);
      void performTest(params);
    },
    [performTest]
  );

  useEffect(() => {
    if (downloadClient) {
      void performTest({
        name: downloadClient.name,
        hostname: downloadClient.hostname,
        port: downloadClient.port,
        username: downloadClient.username,
        password: downloadClient.password,
        apiKey: downloadClient.apiKey,
        client: downloadClient.client,
        useSsl: downloadClient.useSsl,
      });
    }
  }, [downloadClient, performTest]);

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: downloadClient?.name ?? '',
        client: downloadClient?.client ?? ('qbittorrent' as DownloadClientType),
        hostname: downloadClient?.hostname ?? '',
        port: downloadClient?.port ?? DEFAULT_PORTS.qbittorrent,
        useSsl: downloadClient?.useSsl ?? false,
        username: downloadClient?.username ?? '',
        password: downloadClient?.password ?? '',
        apiKey: downloadClient?.apiKey ?? '',
        authType: downloadClient?.apiKey ? 'apiKey' : 'password',
        externalUrl: downloadClient?.externalUrl ?? '',
      }}
      validationSchema={DownloadClientSchema}
      onSubmit={async (values) => {
        try {
          const usesApiKey =
            values.client === 'qbittorrent' && values.authType === 'apiKey';
          const submission = {
            name: values.name,
            client: values.client,
            hostname: values.hostname,
            port: Number(values.port),
            useSsl: values.useSsl,
            username: usesApiKey ? '' : values.username || '',
            password: usesApiKey ? '' : values.password || '',
            apiKey: usesApiKey ? values.apiKey : '',
            externalUrl: values.externalUrl.trim() || '',
          };

          if (!downloadClient) {
            await axios.post('/api/v1/settings/downloads', submission);
          } else {
            await axios.put(
              `/api/v1/settings/downloads/${downloadClient.id}`,
              submission
            );
          }
          onSave();
        } catch (e) {
          Toast({
            title: intl.formatMessage(
              {
                id: 'common.settingsSaveError',
                defaultMessage:
                  'Something went wrong while saving {appName} settings.',
              },
              { appName: CLIENT_NAMES[values.client] }
            ),
            message: e.response?.data?.message || e.message,
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
        const usesApiKey =
          values.client === 'qbittorrent' && values.authType === 'apiKey';
        const hasValidCredentials = usesApiKey
          ? !!values.apiKey
          : (values.client === 'deluge' || !!values.username) &&
            !!values.password;

        return (
          <Modal
            onCancel={onClose}
            okButtonType="primary"
            show={show}
            okText={
              isSubmitting
                ? intl.formatMessage({
                    id: 'common.saving',
                    defaultMessage: 'Saving…',
                  })
                : downloadClient
                  ? intl.formatMessage({
                      id: 'common.saveChanges',
                      defaultMessage: 'Save Changes',
                    })
                  : intl.formatMessage({
                      id: 'servicesSettings.downloads.addClient',
                      defaultMessage: 'Add Download Client',
                    })
            }
            secondaryButtonType="warning"
            secondaryText={
              isTesting
                ? intl.formatMessage({
                    id: 'common.testing',
                    defaultMessage: 'Testing…',
                  })
                : intl.formatMessage({
                    id: 'common.test',
                    defaultMessage: 'Test',
                  })
            }
            onSecondary={() => {
              if (
                values.hostname &&
                values.port &&
                values.client &&
                hasValidCredentials
              ) {
                testConnection({
                  name: values.name,
                  hostname: values.hostname,
                  port: Number(values.port),
                  username: usesApiKey ? undefined : values.username,
                  password: usesApiKey ? undefined : values.password,
                  apiKey: usesApiKey ? values.apiKey : undefined,
                  client: values.client,
                  useSsl: values.useSsl,
                });
              }
            }}
            secondaryDisabled={
              isTesting ||
              !values.hostname ||
              !values.port ||
              !values.client ||
              !hasValidCredentials
            }
            okDisabled={isSubmitting || !isValidated || isTesting || !isValid}
            onOk={() => handleSubmit()}
            title={
              downloadClient
                ? intl.formatMessage({
                    id: 'servicesSettings.downloads.editClient',
                    defaultMessage: 'Edit Download Client',
                  })
                : intl.formatMessage({
                    id: 'servicesSettings.downloads.addClient',
                    defaultMessage: 'Add Download Client',
                  })
            }
          >
            <div className="mb-6 space-y-5">
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="client">
                  <FormattedMessage
                    id="servicesSettings.downloads.clientType"
                    defaultMessage="Client Type"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    as="select"
                    id="client"
                    name="client"
                    className="select select-primary select-sm w-full rounded-md"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const newClient = e.target.value as DownloadClientType;
                      setFieldValue('client', newClient);
                      setFieldValue('authType', 'password');
                      setFieldValue('apiKey', '');
                      // Update port to default for the selected client
                      setFieldValue('port', DEFAULT_PORTS[newClient]);
                    }}
                    disabled={!!downloadClient}
                  >
                    <option value="qbittorrent">qBittorrent</option>
                    <option value="deluge">Deluge</option>
                    <option value="transmission">Transmission</option>
                  </Field>
                  {errors.client &&
                    touched.client &&
                    typeof errors.client === 'string' && (
                      <div className="text-error">{errors.client}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="name">
                  <FormattedMessage
                    id="common.servername"
                    defaultMessage="Server Name"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      placeholder={CLIENT_NAMES[values.client]}
                      className="input input-primary input-sm w-full rounded-md"
                    />
                  </div>
                  {errors.name &&
                    touched.name &&
                    typeof errors.name === 'string' && (
                      <div className="text-error">{errors.name}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="hostname">
                  <FormattedMessage
                    id="common.hostname"
                    defaultMessage="Hostname or IP Address"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="border-primary bg-base-100 inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 sm:text-sm">
                      {values.useSsl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      id="hostname"
                      name="hostname"
                      type="text"
                      inputMode="url"
                      className="input input-primary input-sm w-full rounded-md rounded-l-none"
                    />
                  </div>
                  {errors.hostname &&
                    touched.hostname &&
                    typeof errors.hostname === 'string' && (
                      <div className="text-error">{errors.hostname}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="port">
                  <FormattedMessage id="common.port" defaultMessage="Port" />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    id="port"
                    name="port"
                    type="text"
                    inputMode="numeric"
                    className="input input-primary input-sm w-1/4 rounded-md"
                    autoComplete="off"
                    data-1pignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                  />
                  {errors.port &&
                    touched.port &&
                    typeof errors.port === 'string' && (
                      <div className="text-error">{errors.port}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="useSsl">
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
                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                  />
                </div>
              </div>
              {values.client === 'qbittorrent' && (
                <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                  <label htmlFor="authType">
                    <FormattedMessage
                      id="servicesSettings.downloads.authType"
                      defaultMessage="Authentication"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <Field
                      as="select"
                      id="authType"
                      name="authType"
                      className="select select-primary select-sm w-full rounded-md"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setFieldValue('authType', e.target.value);
                        setIsValidated(false);
                      }}
                    >
                      <option value="password">
                        {intl.formatMessage({
                          id: 'servicesSettings.downloads.usernamePasswordAuth',
                          defaultMessage: 'Username / Password',
                        })}
                      </option>
                      <option value="apiKey">
                        {intl.formatMessage({
                          id: 'common.apiKey',
                          defaultMessage: 'API Key',
                        })}
                      </option>
                    </Field>
                  </div>
                </div>
              )}
              {values.client !== 'deluge' && !usesApiKey && (
                <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                  <label htmlFor="username">
                    <FormattedMessage
                      id="common.username"
                      defaultMessage="Username"
                    />
                    <span className="text-error ml-2">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <Field
                      id="username"
                      name="username"
                      type="text"
                      className="input input-primary input-sm w-full rounded-md"
                      autoComplete="off"
                      data-1pignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('username', e.target.value);
                      }}
                    />
                    {errors.username &&
                      touched.username &&
                      typeof errors.username === 'string' && (
                        <div className="text-error">{errors.username}</div>
                      )}
                  </div>
                </div>
              )}
              {usesApiKey ? (
                <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                  <label htmlFor="apiKey">
                    <FormattedMessage
                      id="common.apiKey"
                      defaultMessage="API Key"
                    />
                    <span className="text-error ml-2">*</span>
                    <p className="text-neutral mt-1 text-sm font-light">
                      <FormattedMessage
                        id="servicesSettings.downloads.apiKeyVersionHint"
                        defaultMessage="qBittorrent 5.2.0+ required."
                      />
                    </p>
                  </label>
                  <div className="sm:col-span-2">
                    <div className="flex">
                      <SensitiveInput
                        as="field"
                        id="apiKey"
                        name="apiKey"
                        buttonSize="sm"
                        className="input input-primary input-sm w-full rounded-md"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('apiKey', e.target.value);
                        }}
                      />{' '}
                    </div>
                    {errors.apiKey &&
                      touched.apiKey &&
                      typeof errors.apiKey === 'string' && (
                        <div className="text-error">{errors.apiKey}</div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                  <label htmlFor="password">
                    <FormattedMessage
                      id="common.password"
                      defaultMessage="Password"
                    />
                    <span className="text-error ml-2">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <div className="flex">
                      <SensitiveInput
                        as="field"
                        id="password"
                        name="password"
                        buttonSize="sm"
                        className="input input-primary input-sm w-full rounded-md"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('password', e.target.value);
                        }}
                      />
                    </div>
                    {errors.password &&
                      touched.password &&
                      typeof errors.password === 'string' && (
                        <div className="text-error">{errors.password}</div>
                      )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="externalUrl">
                  <FormattedMessage
                    id="common.externalUrl"
                    defaultMessage="External URL"
                  />
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      type="text"
                      inputMode="url"
                      id="externalUrl"
                      name="externalUrl"
                      autoComplete="off"
                      data-1pignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                      className="input input-sm input-primary w-full rounded-md"
                    />
                  </div>
                  {errors.externalUrl && touched.externalUrl && (
                    <div className="text-error">{errors.externalUrl}</div>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default DownloadClientModal;
