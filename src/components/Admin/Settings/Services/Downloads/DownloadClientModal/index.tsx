import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { FormattedMessage, useIntl } from 'react-intl';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type {
  DownloadClientSettings,
  DownloadClientType,
} from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import * as Yup from 'yup';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DownloadClientModalProps {
  downloadClient: DownloadClientSettings | null;
  onClose: () => void;
  onSave: () => void;
  show: boolean;
}

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

const CLIENTS_WITH_USERNAME: DownloadClientType[] = [
  'qbittorrent',
  'transmission',
];

const DownloadClientModal = ({
  onClose,
  downloadClient,
  onSave,
  show,
}: DownloadClientModalProps) => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const [isValidated, setIsValidated] = useState(downloadClient ? true : false);
  const [isTesting, setIsTesting] = useState(false);
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
  });

  const testConnection = useCallback(
    async ({
      hostname,
      port,
      username,
      password,
      client,
      useSsl,
    }: {
      hostname: string;
      port: number;
      username?: string;
      password?: string;
      client: DownloadClientType;
      useSsl: boolean;
    }) => {
      setIsTesting(true);
      try {
        await axios.post('/api/v1/settings/downloads/test', {
          hostname,
          port,
          username,
          password,
          client,
          useSsl,
        });

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
      } catch {
        setIsValidated(true);
        if (initialLoad.current) {
          Toast({
            title: intl.formatMessage(
              {
                id: 'servicesSettings.downloads.testfailed',
                defaultMessage: 'Failed to connect to {client}',
              },
              { client: CLIENT_NAMES[client] }
            ),
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      } finally {
        setIsTesting(false);
        initialLoad.current = true;
      }
    },
    [intl]
  );

  useEffect(() => {
    if (downloadClient) {
      testConnection({
        hostname: downloadClient.hostname,
        port: downloadClient.port,
        username: downloadClient.username,
        password: '',
        client: downloadClient.client,
        useSsl: downloadClient.useSsl,
      });
    }
  }, [downloadClient, testConnection]);

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
        externalUrl: downloadClient?.externalUrl ?? '',
      }}
      validationSchema={DownloadClientSchema}
      onSubmit={async (values) => {
        try {
          const submission = {
            name: values.name,
            client: values.client,
            hostname: values.hostname,
            port: Number(values.port),
            useSsl: values.useSsl,
            username: values.username || undefined,
            password: values.password || undefined,
            externalUrl: values.externalUrl || undefined,
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
        const requiresUsername = CLIENTS_WITH_USERNAME.includes(values.client);

        return (
          <Modal
            onCancel={onClose}
            okButtonType="primary"
            show={show}
            okText={
              isSubmitting
                ? intl.formatMessage({
                    id: 'common.saving',
                    defaultMessage: 'Saving...',
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
                    defaultMessage: 'Testing...',
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
                (requiresUsername ? values.username : true) &&
                values.password
              ) {
                testConnection({
                  hostname: values.hostname,
                  port: Number(values.port),
                  username: values.username,
                  password: values.password,
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
              (requiresUsername ? !values.username : false) ||
              !values.password
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
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
                      // Update port to default for the selected client
                      setFieldValue('port', DEFAULT_PORTS[newClient]);
                      // Clear username if the new client doesn't require it
                      if (!CLIENTS_WITH_USERNAME.includes(newClient)) {
                        setFieldValue('username', '');
                      }
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
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
                      className="input input-primary input-sm rounded-md w-full"
                    />
                  </div>
                  {errors.name &&
                    touched.name &&
                    typeof errors.name === 'string' && (
                      <div className="text-error">{errors.name}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="hostname">
                  <FormattedMessage
                    id="common.hostname"
                    defaultMessage="Hostname or IP Address"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 sm:text-sm">
                      {values.useSsl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      id="hostname"
                      name="hostname"
                      type="text"
                      inputMode="url"
                      className="input input-primary input-sm rounded-md rounded-l-none w-full"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
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
              {requiresUsername && (
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
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
                      className="input input-primary input-sm rounded-md w-full"
                      autoComplete="off"
                      data-1pignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
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
                      className="input input-primary input-sm rounded-md w-full"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
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
                      className="input input-sm input-primary rounded-md w-full"
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
