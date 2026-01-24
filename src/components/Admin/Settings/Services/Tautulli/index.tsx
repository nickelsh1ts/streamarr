'use client';
import Button from '@app/components/Common/Button';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast from '@app/components/Toast';
import type { TautulliSettings } from '@server/lib/settings';
import axios from 'axios';
import { Formik, Field } from 'formik';
import useSWR from 'swr';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';

const ServicesTautulli = () => {
  const intl = useIntl();
  const { data: dataTautulli, mutate: revalidateTautulli } =
    useSWR<TautulliSettings>('/api/v1/settings/tautulli');

  const TautulliSettingsSchema = Yup.object().shape(
    {
      tautulliHostname: Yup.string()
        .when(
          ['tautulliPort', 'tautulliApiKey'],
          ([tautulliPort, tautulliApiKey], schema) => {
            if (tautulliPort || tautulliApiKey) {
              return schema.nullable().required(
                intl.formatMessage({
                  id: 'servicesSettings.validation.hostname',
                  defaultMessage:
                    'You must provide a valid hostname or IP address',
                })
              );
            }
            return schema.nullable();
          }
        )
        .matches(
          /^(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
          intl.formatMessage({
            id: 'servicesSettings.validation.hostname',
            defaultMessage: 'You must provide a valid hostname or IP address',
          })
        ),
      tautulliPort: Yup.number().when(
        ['tautulliHostname', 'tautulliApiKey'],
        ([tautulliHostname, tautulliApiKey], schema) => {
          if (tautulliHostname || tautulliApiKey) {
            return schema
              .typeError(
                intl.formatMessage({
                  id: 'generalSettings.validation.port',
                  defaultMessage: 'You must provide a valid port number',
                })
              )
              .nullable()
              .required(
                intl.formatMessage({
                  id: 'generalSettings.validation.port',
                  defaultMessage: 'You must provide a valid port number',
                })
              );
          }
          return schema
            .typeError(
              intl.formatMessage({
                id: 'generalSettings.validation.port',
                defaultMessage: 'You must provide a valid port number',
              })
            )
            .nullable();
        }
      ),
      tautulliUrlBase: Yup.string()
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
      tautulliApiKey: Yup.string().when(
        ['tautulliHostname', 'tautulliPort'],
        ([tautulliHostname, tautulliPort], schema) => {
          if (tautulliHostname || tautulliPort) {
            return schema.nullable().required(
              intl.formatMessage({
                id: 'servicesSettings.validation.apiKeyRequired',
                defaultMessage: 'You must provide an API key',
              })
            );
          }
          return schema.nullable();
        }
      ),
    },
    [
      ['tautulliHostname', 'tautulliPort'],
      ['tautulliHostname', 'tautulliApiKey'],
      ['tautulliPort', 'tautulliApiKey'],
    ]
  );

  if (!dataTautulli) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="max-w-6xl mb-10">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="servicesSettings.tautulli.title"
            defaultMessage="Tautulli Settings"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="servicesSettings.tautulli.description"
            defaultMessage="Optionally configure the settings for your Tautulli server. Streamarr proxies tautulli at /stats for users."
          />
        </p>
      </div>
      <Formik
        initialValues={{
          tautulliEnabled: dataTautulli?.enabled ?? false,
          tautulliHostname: dataTautulli?.hostname,
          tautulliPort: dataTautulli?.port ?? 8181,
          tautulliUseSsl: dataTautulli?.useSsl,
          tautulliUrlBase: dataTautulli?.urlBase,
          tautulliApiKey: dataTautulli?.apiKey,
        }}
        validationSchema={TautulliSettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/tautulli', {
              enabled: values.tautulliEnabled,
              hostname: values.tautulliHostname,
              port: Number(values.tautulliPort),
              useSsl: values.tautulliUseSsl,
              urlBase: values.tautulliUrlBase,
              apiKey: values.tautulliApiKey,
            } as TautulliSettings);

            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveSuccess',
                  defaultMessage: '{appName} settings saved successfully',
                },
                { appName: 'Tautulli' }
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
                { appName: 'Tautulli' }
              ),
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
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
            <form className="mt-5 max-w-6xl space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="tautulliEnabled">
                  <FormattedMessage
                    id="common.settingsEnable"
                    defaultMessage="Enable"
                  />
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      type="checkbox"
                      id="tautulliEnabled"
                      name="tautulliEnabled"
                      onChange={() => {
                        setFieldValue(
                          'tautulliEnabled',
                          !values.tautulliEnabled
                        );
                      }}
                      className="checkbox checkbox-sm checkbox-primary rounded-md"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="tautulliHostname">
                  <FormattedMessage
                    id="common.hostname"
                    defaultMessage="Hostname or IP Address"
                  />
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8  sm:text-sm">
                      {values.tautulliUseSsl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      type="text"
                      inputMode="url"
                      id="tautulliHostname"
                      name="tautulliHostname"
                      className="input input-sm input-primary rounded-md rounded-l-none w-full"
                    />
                  </div>
                  {errors.tautulliHostname &&
                    touched.tautulliHostname &&
                    typeof errors.tautulliHostname === 'string' && (
                      <div className="text-error">
                        {errors.tautulliHostname}
                      </div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="tautulliPort">
                  <FormattedMessage id="common.port" defaultMessage="Port" />
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="text"
                    inputMode="numeric"
                    id="tautulliPort"
                    name="tautulliPort"
                    className="input input-sm input-primary w-1/6 rounded-md"
                    autoComplete="off"
                    data-1pignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                  />
                  {errors.tautulliPort &&
                    touched.tautulliPort &&
                    typeof errors.tautulliPort === 'string' && (
                      <div className="text-error">{errors.tautulliPort}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="tautulliUseSsl">
                  <FormattedMessage
                    id="common.useSsl"
                    defaultMessage="Use SSL"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="checkbox"
                    id="tautulliUseSsl"
                    name="tautulliUseSsl"
                    onChange={() => {
                      setFieldValue('tautulliUseSsl', !values.tautulliUseSsl);
                    }}
                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="tautulliUrlBase">
                  <FormattedMessage
                    id="common.urlBase"
                    defaultMessage="URL Base"
                  />
                  <span className="text-error mx-1">*</span>
                  <SettingsBadge badgeType="restartRequired" />
                  <span className="text-sm block font-light text-neutral">
                    <FormattedMessage
                      id="servicesSettings.urlBase.description"
                      defaultMessage="Url Base is required for streamarr to register a proxy route."
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      className="input input-sm input-primary rounded-md w-full"
                      id="tautulliUrlBase"
                      name="tautulliUrlBase"
                      inputMode="url"
                      type="text"
                    />
                  </div>
                  {errors.tautulliUrlBase && touched.tautulliUrlBase && (
                    <div className="text-error">{errors.tautulliUrlBase}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="tautulliApiKey" className="text-label">
                  <FormattedMessage
                    id="common.apiKey"
                    defaultMessage="API Key"
                  />
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex col-span-2">
                    <SensitiveInput
                      as="field"
                      id="tautulliApiKey"
                      name="tautulliApiKey"
                      buttonSize="sm"
                      className="input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.tautulliApiKey &&
                    touched.tautulliApiKey &&
                    typeof errors.tautulliApiKey === 'string' && (
                      <div className="text-error">{errors.tautulliApiKey}</div>
                    )}
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
                      {isSubmitting
                        ? intl.formatMessage({
                            id: 'common.saving',
                            defaultMessage: 'Saving...',
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
export default ServicesTautulli;
