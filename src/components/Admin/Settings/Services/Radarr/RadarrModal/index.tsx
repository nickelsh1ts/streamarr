import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { FormattedMessage, useIntl } from 'react-intl';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { RadarrSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';

interface TestResponse {
  urlBase?: string;
}

interface RadarrModalProps {
  radarr: RadarrSettings | null;
  onClose: () => void;
  onSave: () => void;
  show: boolean;
}

const RadarrModal = ({ onClose, radarr, onSave, show }: RadarrModalProps) => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const [isValidated, setIsValidated] = useState(radarr ? true : false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<TestResponse>();
  const RadarrSettingsSchema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage({
        id: 'servicesSettings.validation.servername',
        defaultMessage: 'You must provide a valid server name',
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
    apiKey: Yup.string().required(
      intl.formatMessage({
        id: 'servicesSettings.validation.apikey',
        defaultMessage: 'API key is required',
      })
    ),
    baseUrl: Yup.string()
      .required(
        intl.formatMessage({
          id: 'servicesSettings.urlBase.required',
          defaultMessage: 'You must provide a valid URL Base',
        })
      )
      .test(
        'leading-slash',
        intl.formatMessage({
          id: 'servicesSettings.urlBase.leadingSlash',
          defaultMessage: 'URL Base must have a leading slash',
        }),
        (value) => !value || value.startsWith('/')
      )
      .test(
        'no-trailing-slash',
        intl.formatMessage({
          id: 'servicesSettings.urlBase.noTrailingSlash',
          defaultMessage: 'URL Base must not end in a trailing slash',
        }),
        (value) => !value || !value.endsWith('/')
      ),
  });

  const testConnection = useCallback(
    async ({
      hostname,
      port,
      apiKey,
      baseUrl,
      useSsl = false,
    }: {
      hostname: string;
      port: number;
      apiKey: string;
      baseUrl?: string;
      useSsl?: boolean;
    }) => {
      setIsTesting(true);
      try {
        const response = await axios.post<TestResponse>(
          '/api/v1/settings/radarr/test',
          {
            hostname,
            apiKey,
            port: Number(port),
            baseUrl,
            useSsl,
          }
        );

        setIsValidated(true);
        setTestResponse(response.data);
        if (initialLoad.current) {
          Toast({
            title: intl.formatMessage({
              id: 'servicesSettings.radarr.testsuccess',
              defaultMessage: 'Radarr connection established successfully!',
            }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        }
      } catch {
        setIsValidated(false);
        if (initialLoad.current) {
          Toast({
            title: intl.formatMessage({
              id: 'servicesSettings.radarr.testfailed',
              defaultMessage: 'Failed to connect to Radarr.',
            }),
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
    if (radarr) {
      testConnection({
        apiKey: radarr.apiKey,
        hostname: radarr.hostname,
        port: radarr.port,
        baseUrl: radarr.baseUrl,
        useSsl: radarr.useSsl,
      });
    }
  }, [radarr, testConnection]);

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: radarr?.name ?? '',
        hostname: radarr?.hostname ?? '',
        port: radarr?.port ?? 7878,
        ssl: radarr?.useSsl ?? false,
        apiKey: radarr?.apiKey ?? '',
        baseUrl: radarr?.baseUrl ?? '',
        isDefault: radarr?.isDefault ?? false,
        is4k: radarr?.is4k ?? false,
        syncEnabled: radarr?.syncEnabled ?? false,
        pastDays: radarr?.pastDays ?? 7,
        futureDays: radarr?.futureDays ?? 28,
      }}
      validationSchema={RadarrSettingsSchema}
      onSubmit={async (values) => {
        try {
          const submission = {
            name: values.name,
            hostname: values.hostname,
            port: Number(values.port),
            apiKey: values.apiKey,
            useSsl: values.ssl,
            baseUrl: values.baseUrl,
            is4k: values.is4k,
            isDefault: values.isDefault,
            syncEnabled: values.syncEnabled,
            pastDays: values.pastDays ?? 7,
            futureDays: values.futureDays ?? 28,
          };
          if (!radarr) {
            await axios.post('/api/v1/settings/radarr', submission);
          } else {
            await axios.put(`/api/v1/settings/radarr/${radarr.id}`, submission);
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
              { appName: 'Radarr' }
            ),
            message: e.message,
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
                : radarr
                  ? intl.formatMessage({
                      id: 'common.saveChanges',
                      defaultMessage: 'Save Changes',
                    })
                  : intl.formatMessage(
                      {
                        id: 'common.addserver',
                        defaultMessage: 'Add {arrApp} Server',
                      },
                      { arrApp: 'Radarr' }
                    )
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
              if (values.apiKey && values.hostname && values.port) {
                testConnection({
                  apiKey: values.apiKey,
                  baseUrl: values.baseUrl,
                  hostname: values.hostname,
                  port: values.port,
                  useSsl: values.ssl,
                });
                if (!values.baseUrl || values.baseUrl === '/') {
                  setFieldValue('baseUrl', testResponse.urlBase);
                }
              }
            }}
            secondaryDisabled={
              !values.apiKey ||
              !values.hostname ||
              !values.port ||
              isTesting ||
              isSubmitting
            }
            okDisabled={!isValidated || isSubmitting || isTesting || !isValid}
            onOk={() => handleSubmit()}
            title={
              !radarr
                ? values.is4k
                  ? intl.formatMessage(
                      {
                        id: 'common.arrAdd4k',
                        defaultMessage: 'Add 4K {arrApp} Server',
                      },
                      { arrApp: 'Radarr' }
                    )
                  : intl.formatMessage(
                      {
                        id: 'common.addserver',
                        defaultMessage: 'Add {arrApp} Server',
                      },
                      { arrApp: 'Radarr' }
                    )
                : values.is4k
                  ? intl.formatMessage(
                      {
                        id: 'common.arrEdit4k',
                        defaultMessage: 'Edit 4K {arrApp} Server',
                      },
                      { arrApp: 'Radarr' }
                    )
                  : intl.formatMessage(
                      {
                        id: 'common.arrEdit',
                        defaultMessage: 'Edit {arrApp} Server',
                      },
                      { arrApp: 'Radarr' }
                    )
            }
          >
            <div className="mb-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="isDefault">
                  {values.is4k ? (
                    <FormattedMessage
                      id="common.default4k"
                      defaultMessage="Default 4K Server"
                    />
                  ) : (
                    <FormattedMessage
                      id="common.defaultserver"
                      defaultMessage="Default Server"
                    />
                  )}
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    id="isDefault"
                    name="isDefault"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="is4k">
                  <FormattedMessage
                    id="common.4kserver"
                    defaultMessage="4K Server"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    id="is4k"
                    name="is4k"
                  />
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
                      className="input input-primary input-sm rounded-md w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('name', e.target.value);
                      }}
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
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8  sm:text-sm">
                      {values.ssl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      id="hostname"
                      name="hostname"
                      type="text"
                      inputMode="url"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('hostname', e.target.value);
                      }}
                      className="input input-primary input-sm rounded-none rounded-r-md w-full"
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
                    className="input input-primary input-sm rounded-md w-1/4"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setIsValidated(false);
                      setFieldValue('port', e.target.value);
                    }}
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
                    className="checkbox checkbox-primary"
                    id="ssl"
                    name="ssl"
                    onChange={() => {
                      setIsValidated(false);
                      setFieldValue('ssl', !values.ssl);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="apiKey">
                  <FormattedMessage
                    id="common.apiKey"
                    defaultMessage="API Key"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <SensitiveInput
                      as="field"
                      id="apiKey"
                      name="apiKey"
                      buttonSize="sm"
                      className="input input-sm input-primary rounded-md w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('apiKey', e.target.value);
                      }}
                    />
                  </div>
                  {errors.apiKey &&
                    touched.apiKey &&
                    typeof errors.apiKey === 'string' && (
                      <div className="text-error">{errors.apiKey}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="baseUrl">
                  <FormattedMessage
                    id="common.urlBase"
                    defaultMessage="URL Base"
                  />
                  <span className="text-error mx-1">*</span>
                  <span className="text-sm block font-light text-neutral">
                    <FormattedMessage
                      id="arrSettings.urlBase.description"
                      defaultMessage="Url Base is required for streamarr to register a proxy route. A restart is required to take effect."
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      id="baseUrl"
                      name="baseUrl"
                      type="text"
                      className="input input-primary input-sm rounded-r-md w-full"
                      inputMode="url"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('baseUrl', e.target.value);
                      }}
                    />
                  </div>
                  {errors.baseUrl &&
                    touched.baseUrl &&
                    typeof errors.baseUrl === 'string' && (
                      <div className="text-error">{errors.baseUrl}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="syncEnabled">
                  <FormattedMessage
                    id="common.calendarSync"
                    defaultMessage="Enable Calendar Sync"
                  />
                  <span className="text-sm block font-light text-neutral">
                    <FormattedMessage
                      id="common.calendarSync.description"
                      defaultMessage="Automatically sync {arrApp} events to the calendar"
                      values={{ arrApp: 'Radarr' }}
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    id="syncEnabled"
                    name="syncEnabled"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="pastDays">
                  <FormattedMessage
                    id="common.pastdays"
                    defaultMessage="Past Days"
                  />
                  <span className="text-sm block font-light text-neutral">
                    <FormattedMessage
                      id="common.pastdays.description"
                      defaultMessage="Sync events from the past X days"
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="number"
                    className="input input-primary input-sm rounded-r-md w-full"
                    id="pastDays"
                    name="pastDays"
                    disabled={!values.syncEnabled}
                    min={7}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="futureDays">
                  <FormattedMessage
                    id="common.futuredays"
                    defaultMessage="Future Days"
                  />
                  <span className="text-sm block font-light text-neutral">
                    <FormattedMessage
                      id="common.futuredays.description"
                      defaultMessage="Sync events for the next X days"
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="number"
                    className="input input-primary input-sm rounded-r-md w-full"
                    id="futureDays"
                    name="futureDays"
                    disabled={!values.syncEnabled}
                    min={28}
                  />
                </div>
              </div>
            </div>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default RadarrModal;
