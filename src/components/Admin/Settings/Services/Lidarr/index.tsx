'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis, {
  SmallLoadingEllipsis,
} from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Badge from '@app/components/Common/Badge';
import Toast from '@app/components/Toast';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/solid';
import type { ServiceSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import * as Yup from 'yup';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';

export interface TestResponse {
  urlBase?: string;
}

const ServicesLidarr = () => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const { data: dataLidarr, mutate: revalidateLidarr } =
    useSWR<ServiceSettings>('/api/v1/settings/lidarr');
  const [isValidated, setIsValidated] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisablingAuth, setIsDisablingAuth] = useState(false);

  // Fetch auth status when service is configured and validated
  const { data: authStatus, mutate: revalidateAuthStatus } = useSWR<{
    authenticationMethod: string;
    isAuthDisabled: boolean;
  }>(
    dataLidarr?.enabled &&
      dataLidarr?.hostname &&
      dataLidarr?.apiKey &&
      isValidated
      ? '/api/v1/settings/lidarr/auth'
      : null
  );

  const SettingsSchema = Yup.object().shape({
    urlBase: Yup.string()
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
      urlBase,
      useSsl,
    }: {
      hostname: string;
      port: number;
      apiKey: string;
      urlBase?: string;
      useSsl?: boolean;
    }) => {
      setIsTesting(true);
      try {
        await axios.post<TestResponse>('/api/v1/settings/lidarr/test', {
          hostname,
          port: Number(port),
          apiKey,
          urlBase,
          useSsl,
        });

        setIsValidated(true);
        revalidateAuthStatus();
        if (initialLoad.current) {
          Toast({
            title: intl.formatMessage(
              {
                id: 'servicesSettings.testsuccess',
                defaultMessage:
                  '{service} connection established successfully!',
              },
              { service: 'Lidarr' }
            ),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        }
      } catch {
        setIsValidated(false);
        if (initialLoad.current) {
          Toast({
            title: intl.formatMessage(
              {
                id: 'servicesSettings.testfailed',
                defaultMessage: 'Failed to connect to {service}.',
              },
              { service: 'Lidarr' }
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
    [revalidateAuthStatus, intl]
  );

  // Auto-test connection on page load if service is configured
  useEffect(() => {
    if (
      dataLidarr?.enabled &&
      dataLidarr?.hostname &&
      dataLidarr?.apiKey &&
      !isValidated &&
      !isTesting
    ) {
      testConnection({
        hostname: dataLidarr.hostname,
        port: dataLidarr.port,
        apiKey: dataLidarr.apiKey,
        urlBase: dataLidarr.urlBase,
        useSsl: dataLidarr.useSsl,
      });
    }
  }, [dataLidarr, isTesting, isValidated, testConnection]);

  const handleDisableAuth = async () => {
    if (!dataLidarr || isDisablingAuth) return;

    setIsDisablingAuth(true);
    try {
      await axios.post('/api/v1/settings/lidarr/auth');
      revalidateAuthStatus(
        { authenticationMethod: 'external', isAuthDisabled: true },
        { revalidate: false }
      );
      Toast({
        title: intl.formatMessage(
          {
            id: 'servicesSettings.authDisabledService',
            defaultMessage: 'Authentication disabled on {service}',
          },
          { service: 'Lidarr' }
        ),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch {
      Toast({
        title: intl.formatMessage(
          {
            id: 'servicesSettings.authDisableFailed',
            defaultMessage: 'Failed to disable authentication on {service}',
          },
          { service: 'Lidarr' }
        ),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsDisablingAuth(false);
    }
  };

  if (!dataLidarr) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="max-w-6xl mb-10">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="servicesSettings.lidarr.title"
            defaultMessage="Lidarr Settings"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="servicesSettings.lidarr.description"
            defaultMessage="Optionally configure the settings for your Lidarr server."
          />
        </p>
      </div>
      <Formik
        initialValues={{
          hostname: dataLidarr?.hostname ?? '',
          port: dataLidarr?.port ?? 8686,
          useSsl: dataLidarr?.useSsl ?? false,
          enabled: dataLidarr?.enabled ?? false,
          urlBase: dataLidarr?.urlBase,
          apiKey: dataLidarr?.apiKey ?? '',
        }}
        validationSchema={SettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/lidarr', {
              hostname: values.hostname,
              port: values.port,
              useSsl: values.useSsl,
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
                { appName: 'Lidarr' }
              ),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch (e) {
            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveError',
                  defaultMessage:
                    'Something went wrong while saving {appName} settings.',
                },
                { appName: 'Lidarr' }
              ),
              type: 'error',
              message: e.response?.data?.message || e.message,
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidateLidarr();
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
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8  sm:text-sm">
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
                    onChange={() => {
                      setFieldValue('useSsl', !values.useSsl);
                    }}
                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="urlBase">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="apiKey" className="text-label">
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
              {isValidated && (
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="authStatus" className="text-label">
                    <FormattedMessage
                      id="servicesSettings.disableAuth"
                      defaultMessage="Authentication"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    {!authStatus ? (
                      <div className="place-items-start">
                        <SmallLoadingEllipsis />
                      </div>
                    ) : authStatus?.authenticationMethod === 'external' ? (
                      <div
                        className="tooltip"
                        data-tip={intl.formatMessage(
                          {
                            id: 'servicesSettings.authDisabled.tooltip',
                            defaultMessage:
                              'To re-enable authentication, change the setting directly in {service}',
                          },
                          { service: 'Lidarr' }
                        )}
                      >
                        <Badge badgeType="warning">
                          <FormattedMessage
                            id="servicesSettings.authDisabled"
                            defaultMessage="Auth Disabled"
                          />
                        </Badge>
                      </div>
                    ) : (
                      <>
                        <ConfirmButton
                          onClick={handleDisableAuth}
                          confirmText={
                            <FormattedMessage
                              id="common.areYouSure"
                              defaultMessage="Are you sure?"
                            />
                          }
                          buttonSize="sm"
                        >
                          <ShieldExclamationIcon className="mr-1 size-5" />
                          <FormattedMessage
                            id="servicesSettings.disableAuth.button"
                            defaultMessage="Disable {service} Auth"
                            values={{ service: 'Lidarr' }}
                          />
                        </ConfirmButton>
                        <p className="mt-2 text-sm text-gray-500">
                          <FormattedMessage
                            id="servicesSettings.disableAuth.description"
                            defaultMessage="Disables authentication on {service}. You must understand the risks before proceeding. Only do this if {service} is not directly exposed to the internet."
                            values={{ service: 'Lidarr' }}
                          />
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <div className="flex gap-2">
                  <Button
                    buttonType="warning"
                    buttonSize="sm"
                    type="button"
                    disabled={
                      !values.apiKey ||
                      !values.hostname ||
                      !values.port ||
                      isTesting ||
                      isSubmitting
                    }
                    onClick={() => testConnection(values)}
                  >
                    {isTesting ? (
                      <FormattedMessage
                        id="common.testing"
                        defaultMessage="Testing..."
                      />
                    ) : (
                      <FormattedMessage
                        id="common.test"
                        defaultMessage="Test"
                      />
                    )}
                  </Button>
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
                </div>
              </div>
            </form>
          );
        }}
      </Formik>
    </div>
  );
};
export default ServicesLidarr;
