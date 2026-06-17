'use client';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { TautulliSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

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
    <div className="mb-10 max-w-6xl">
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
            defaultMessage="Optionally configure the settings for your Tautulli server. Streamarr proxies tautulli at /activity for users."
          />
        </p>
      </div>
      <RestartRequiredAlert filterServices={['Tautulli']} />
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

            mutate(RESTART_REQUIRED_SWR_KEY);
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="tautulliHostname">
                  <FormattedMessage
                    id="common.hostname"
                    defaultMessage="Hostname or IP Address"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="border-primary bg-base-100 inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 sm:text-sm">
                      {values.tautulliUseSsl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      type="text"
                      inputMode="url"
                      id="tautulliHostname"
                      name="tautulliHostname"
                      className="input input-sm input-primary w-full rounded-md rounded-l-none"
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="tautulliPort">
                  <FormattedMessage id="common.port" defaultMessage="Port" />
                  <span className="text-error ml-1">*</span>
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="tautulliUrlBase">
                  <FormattedMessage
                    id="common.urlBase"
                    defaultMessage="URL Base"
                  />
                  <span className="text-error mx-1">*</span>
                  <SettingsBadge badgeType="restartRequired" />
                  <span className="text-neutral block text-sm font-light">
                    <FormattedMessage
                      id="servicesSettings.urlBase.description"
                      defaultMessage="Url Base is required for streamarr to register a proxy route."
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      className="input input-sm input-primary w-full rounded-md"
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="tautulliApiKey" className="text-label">
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
export default ServicesTautulli;
