'use client';
import RestartRequiredAlert from '@app/components/Admin/Settings/RestartRequiredAlert';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { ServiceSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const ServicesOverseerr = () => {
  const intl = useIntl();
  const { data: dataOverseerr, mutate: revalidateOverseerr } =
    useSWR<ServiceSettings>('/api/v1/settings/overseerr');

  const SettingsSchema = Yup.object().shape({
    urlBase: Yup.string()
      .required(
        intl.formatMessage({
          id: 'servicesSettings.validation.urlBaseRequired',
          defaultMessage: 'URL Base is required',
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
          id: 'seerrSettings.urlBase.noTrailingSlash',
          defaultMessage:
            'URL Base must not end in a trailing slash or whitespace',
        }),
        (value) => !value || (!value.endsWith('/') && !/\s$/.test(value))
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
        id: 'servicesSettings.validation.apiKey',
        defaultMessage: 'You must provide a valid API key',
      })
    ),
  });

  if (!dataOverseerr) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="mb-10 max-w-6xl">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="servicesSettings.overseerr.title"
            defaultMessage="Seerr Settings"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="servicesSettings.overseerr.description"
            defaultMessage="Optionally configure the settings for your Seerr server."
          />
        </p>
      </div>
      <RestartRequiredAlert filterServices={['Seerr']} />
      <Alert
        title={intl.formatMessage({
          id: 'servicesSettings.overseerr.alertTitle',
          defaultMessage: 'Remove any external Seerr reverse proxy',
        })}
        type="warning"
      >
        <p>
          <FormattedMessage
            id="servicesSettings.overseerr.alertDescription"
            defaultMessage="Streamarr now serves Seerr through its own built-in reverse proxy at the URL Base below, so no external reverse proxy is required. If you previously configured one (such as the legacy Nginx rewrite) to serve Seerr at this path, you must remove it — a leftover rule will intercept these requests and the built-in proxy will not work. Changing the URL Base takes effect after a server restart."
          />
        </p>
      </Alert>
      <Formik
        initialValues={{
          hostname: dataOverseerr?.hostname ?? '',
          port: dataOverseerr?.port ?? 5055,
          enabled: dataOverseerr?.enabled ?? false,
          urlBase: dataOverseerr?.urlBase,
          apiKey: dataOverseerr?.apiKey ?? '',
        }}
        validationSchema={SettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/Overseerr', {
              hostname: values.hostname,
              port: values.port,
              enabled: values.enabled,
              urlBase: values.urlBase,
              apiKey: values.apiKey,
            } as ServiceSettings);

            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveSuccess',
                  defaultMessage: '{appName} settings saved successfully',
                },
                { appName: 'Seerr' }
              ),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch {
            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveError',
                  defaultMessage:
                    'Something went wrong while saving {appName} settings.',
                },
                { appName: 'Seerr' }
              ),
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidateOverseerr();
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="service">
                  <FormattedMessage
                    id="common.settingsEnable"
                    defaultMessage="Enable"
                  />
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      onChange={() => {
                        setFieldValue('enabled', !values.enabled);
                      }}
                      className="checkbox checkbox-sm checkbox-primary rounded-md"
                    />
                  </div>
                  {errors.enabled &&
                    touched.enabled &&
                    typeof errors.enabled === 'string' && (
                      <div className="text-error">{errors.enabled}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="hostname">
                  <FormattedMessage
                    id="common.hostname"
                    defaultMessage="Hostname or IP Address"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="border-primary bg-base-100 inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 sm:text-sm">
                      http://
                    </span>
                    <Field
                      type="text"
                      inputMode="url"
                      id="hostname"
                      name="hostname"
                      className="input input-sm input-primary w-full rounded-md rounded-l-none"
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
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="text"
                    inputMode="numeric"
                    id="port"
                    name="port"
                    className="input input-sm input-primary w-1/6 rounded-md"
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
                <label htmlFor="urlBase">
                  <FormattedMessage
                    id="common.urlBase"
                    defaultMessage="URL Base"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      className="input input-sm input-primary w-full rounded-md"
                      id="urlBase"
                      name="urlBase"
                      inputMode="url"
                      type="text"
                    />
                  </div>
                  {errors.urlBase && touched.urlBase && (
                    <div className="text-error">{errors.urlBase}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="apiKey">
                  <FormattedMessage
                    id="common.apiKey"
                    defaultMessage="API Key"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="col-span-2 flex">
                    <SensitiveInput
                      as="field"
                      id="apiKey"
                      name="apiKey"
                      buttonSize="sm"
                      className="input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.apiKey &&
                    touched.apiKey &&
                    typeof errors.apiKey === 'string' && (
                      <div className="text-error">{errors.apiKey}</div>
                    )}
                </div>
              </div>
              <div className="divider divider-primary col-span-full mb-0" />
              <div className="col-span-3 mt-4 flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                  >
                    <ArrowDownTrayIcon className="mr-2 size-4" />
                    <span>
                      {isSubmitting
                        ? intl.formatMessage({
                            id: 'common.saving',
                            defaultMessage: 'Saving…',
                          })
                        : intl.formatMessage({
                            id: 'common.saveChanges',
                            defaultMessage: 'Save Changes',
                          })}
                    </span>
                  </Button>
                </span>
              </div>
            </form>
          );
        }}
      </Formik>
    </div>
  );
};
export default ServicesOverseerr;
