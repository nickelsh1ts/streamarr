'use client';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { NetworkSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const isValidProxyHost = (value: string): boolean => {
  const host = value.trim().replace(/^\[|\]$/g, '');
  if (!host) return false;

  if (host.includes(':')) {
    try {
      new URL(`http://[${host}]/`);
      return true;
    } catch {
      return false;
    }
  }

  if (/^\d+(?:\.\d+){3}$/.test(host)) {
    return host.split('.').every((part) => {
      const octet = Number(part);
      return (
        Number.isInteger(octet) &&
        octet >= 0 &&
        octet <= 255 &&
        String(octet) === part
      );
    });
  }

  if (host.length > 253) return false;
  return host
    .split('.')
    .every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
    );
};

const isValidProxyBypassEntry = (value: string): boolean =>
  isValidProxyHost(value.trim().replace(/^(?:\*\.|\.)/, ''));

const NetworkSettings = () => {
  const intl = useIntl();
  const [isTestingProxy, setIsTestingProxy] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<NetworkSettings>('/api/v1/settings/network');

  const NetworkSettingsSchema = Yup.object().shape({
    requestTimeout: Yup.number()
      .typeError(
        intl.formatMessage({
          id: 'networkSettings.validation.requestTimeout',
          defaultMessage: 'You must provide a valid request timeout',
        })
      )
      .required(
        intl.formatMessage({
          id: 'networkSettings.validation.requestTimeout',
          defaultMessage: 'You must provide a valid request timeout',
        })
      )
      .integer(
        intl.formatMessage({
          id: 'networkSettings.validation.requestTimeoutInteger',
          defaultMessage: 'Request timeout must be a whole number of seconds',
        })
      )
      .min(
        1,
        intl.formatMessage({
          id: 'networkSettings.validation.requestTimeoutMin',
          defaultMessage: 'Request timeout must be at least 1 second',
        })
      )
      .max(
        300,
        intl.formatMessage({
          id: 'networkSettings.validation.requestTimeoutMax',
          defaultMessage: 'Request timeout must not exceed 300 seconds',
        })
      ),
    trustProxy: Yup.boolean(),
    csrfProtection: Yup.boolean(),
    scheduledRetryAttempts: Yup.number()
      .typeError(
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryAttempts',
          defaultMessage: 'You must provide a valid number of retry attempts',
        })
      )
      .required(
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryAttempts',
          defaultMessage: 'You must provide a valid number of retry attempts',
        })
      )
      .integer(
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryAttemptsInteger',
          defaultMessage: 'Retry attempts must be a whole number',
        })
      )
      .min(
        1,
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryAttemptsMin',
          defaultMessage: 'There must be at least 1 attempt',
        })
      )
      .max(
        10,
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryAttemptsMax',
          defaultMessage: 'Retry attempts must not exceed 10',
        })
      ),
    scheduledRetryInterval: Yup.number()
      .typeError(
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryInterval',
          defaultMessage: 'You must provide a valid retry interval',
        })
      )
      .required(
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryInterval',
          defaultMessage: 'You must provide a valid retry interval',
        })
      )
      .integer(
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryIntervalInteger',
          defaultMessage: 'Retry interval must be a whole number of seconds',
        })
      )
      .min(
        30,
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryIntervalMin',
          defaultMessage: 'Retry interval must be at least 30 seconds',
        })
      )
      .max(
        3600,
        intl.formatMessage({
          id: 'networkSettings.validation.scheduledRetryIntervalMax',
          defaultMessage: 'Retry interval must not exceed 3600 seconds',
        })
      ),
    outboundProxy: Yup.object({
      enabled: Yup.boolean().required(),
      hostname: Yup.string()
        .max(253)
        .when('enabled', {
          is: true,
          then: (schema) =>
            schema
              .required(
                intl.formatMessage({
                  id: 'networkSettings.outboundProxy.validation.hostnameRequired',
                  defaultMessage: 'Proxy hostname is required',
                })
              )
              .test(
                'valid-proxy-hostname',
                intl.formatMessage({
                  id: 'networkSettings.outboundProxy.validation.hostnameInvalid',
                  defaultMessage: 'Enter a valid hostname or IP address',
                }),
                (value) => !!value && isValidProxyHost(value)
              ),
          otherwise: (schema) => schema.notRequired(),
        }),
      port: Yup.number()
        .typeError(
          intl.formatMessage({
            id: 'networkSettings.outboundProxy.validation.portNumber',
            defaultMessage: 'Proxy port must be a number',
          })
        )
        .integer(
          intl.formatMessage({
            id: 'networkSettings.outboundProxy.validation.portInteger',
            defaultMessage: 'Proxy port must be a whole number',
          })
        )
        .min(
          1,
          intl.formatMessage({
            id: 'networkSettings.outboundProxy.validation.portRange',
            defaultMessage: 'Proxy port must be between 1 and 65535',
          })
        )
        .max(
          65535,
          intl.formatMessage({
            id: 'networkSettings.outboundProxy.validation.portRange',
            defaultMessage: 'Proxy port must be between 1 and 65535',
          })
        )
        .when('enabled', {
          is: true,
          then: (schema) =>
            schema.required(
              intl.formatMessage({
                id: 'networkSettings.outboundProxy.validation.portRequired',
                defaultMessage: 'Proxy port is required',
              })
            ),
          otherwise: (schema) => schema.notRequired(),
        }),
      useSsl: Yup.boolean().required(),
      username: Yup.string().max(255),
      password: Yup.string().max(1024),
      bypassFilter: Yup.string()
        .max(2048)
        .test(
          'valid-proxy-bypass-hosts',
          intl.formatMessage({
            id: 'networkSettings.outboundProxy.validation.bypassInvalid',
            defaultMessage:
              'Enter valid hostnames or IP addresses separated by commas',
          }),
          (value) =>
            !value ||
            value
              .split(/[\n,]/)
              .map((entry) => entry.trim())
              .filter(Boolean)
              .every(isValidProxyBypassEntry)
        ),
      bypassLocalAddresses: Yup.boolean().required(),
    }),
  });

  const testOutboundProxy = async (
    outboundProxy: NetworkSettings['outboundProxy']
  ) => {
    setIsTestingProxy(true);
    try {
      await axios.post(
        '/api/v1/settings/network/outbound-proxy/test',
        outboundProxy
      );
      Toast({
        title: intl.formatMessage({
          id: 'networkSettings.outboundProxy.testSuccess',
          defaultMessage: 'Proxy test succeeded',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'networkSettings.outboundProxy.testError',
          defaultMessage: 'Proxy test failed',
        }),
        message: e.response?.data?.message || e.message,
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsTestingProxy(false);
    }
  };

  const header = (
    <div className="mb-6">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="networkSettings.title"
          defaultMessage="Network Settings"
        />
      </h3>
      <p className="mb-5">
        <FormattedMessage
          id="networkSettings.description"
          defaultMessage="Configure global network settings for your Streamarr instance."
        />
      </p>
    </div>
  );

  if (!data && !error) {
    return (
      <div className="mb-10 max-w-6xl">
        {header}
        <LoadingEllipsis />
      </div>
    );
  }

  return (
    <div className="mb-10 max-w-6xl">
      {header}
      <RestartRequiredAlert
        filterServices={['Proxy Support', 'CSRF Protection', 'Outbound Proxy']}
      />
      <Formik
        initialValues={{
          requestTimeout: data ? data.requestTimeout / 1000 : 10,
          trustProxy: data?.trustProxy ?? false,
          csrfProtection: data?.csrfProtection ?? false,
          scheduledRetryAttempts: data?.scheduledRetryAttempts ?? 3,
          scheduledRetryInterval: data
            ? data.scheduledRetryInterval / 1000
            : 300,
          outboundProxy: {
            enabled: data?.outboundProxy.enabled ?? false,
            hostname: data?.outboundProxy.hostname ?? '',
            port: data?.outboundProxy.port ?? 8080,
            useSsl: data?.outboundProxy.useSsl ?? false,
            username: data?.outboundProxy.username ?? '',
            password: data?.outboundProxy.password ?? '',
            bypassFilter: data?.outboundProxy.bypassFilter ?? '',
            bypassLocalAddresses:
              data?.outboundProxy.bypassLocalAddresses ?? true,
          },
        }}
        enableReinitialize
        validationSchema={NetworkSettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/network', {
              requestTimeout: Number(values.requestTimeout) * 1000,
              trustProxy: values.trustProxy,
              csrfProtection: values.csrfProtection,
              scheduledRetryAttempts: Number(values.scheduledRetryAttempts),
              scheduledRetryInterval:
                Number(values.scheduledRetryInterval) * 1000,
              outboundProxy: values.outboundProxy,
            });
            revalidate();
            mutate(RESTART_REQUIRED_SWR_KEY);
            Toast({
              title: intl.formatMessage({
                id: 'networkSettings.saveSuccess',
                defaultMessage: 'Network settings saved successfully',
              }),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch (e) {
            Toast({
              title: intl.formatMessage({
                id: 'networkSettings.saveError',
                defaultMessage:
                  'Something went wrong while saving network settings.',
              }),
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
          isSubmitting,
          isValid,
          setFieldValue,
          values,
        }) => (
          <Form className="mt-5 max-w-6xl space-y-5">
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="trustProxy" className="col-span-1">
                <span className="mr-2">
                  <FormattedMessage
                    id="generalSettings.trustProxy.label"
                    defaultMessage="Enable Proxy Support"
                  />
                </span>
                <SettingsBadge badgeType="restartRequired" />
                <p className="text-neutral block text-sm font-light">
                  <FormattedMessage
                    id="generalSettings.trustProxy.description"
                    defaultMessage="Allow Streamarr to correctly register client IP addresses behind a proxy"
                  />
                </p>
              </label>
              <div className="col-span-2">
                <Field
                  type="checkbox"
                  id="trustProxy"
                  name="trustProxy"
                  onChange={() => {
                    setFieldValue('trustProxy', !values.trustProxy);
                  }}
                  className="checkbox-primary checkbox"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="csrfProtection" className="col-span-1">
                <span className="mr-2">
                  <FormattedMessage
                    id="generalSettings.csrfProtection.label"
                    defaultMessage="Enable CSRF Protection"
                  />
                </span>
                <SettingsBadge badgeType="advanced" className="mr-2" />
                <SettingsBadge badgeType="restartRequired" />
                <p className="text-neutral block text-sm font-light">
                  <FormattedMessage
                    id="generalSettings.csrfProtection.description"
                    defaultMessage="Set external API access to read-only (requires HTTPS)"
                  />
                </p>
              </label>
              <Tooltip
                content={intl.formatMessage({
                  id: 'generalSettings.csrfProtection.tooltip',
                  defaultMessage:
                    'Do NOT enable this setting unless you understand what you are doing!',
                })}
              >
                <Field
                  type="checkbox"
                  id="csrfProtection"
                  name="csrfProtection"
                  onChange={() => {
                    setFieldValue('csrfProtection', !values.csrfProtection);
                  }}
                  className="checkbox-primary checkbox"
                />
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="requestTimeout" className="col-span-1">
                <FormattedMessage
                  id="networkSettings.requestTimeout"
                  defaultMessage="API Request Timeout"
                />
                <span className="text-neutral block text-sm font-light">
                  <FormattedMessage
                    id="networkSettings.requestTimeout.description"
                    defaultMessage="Maximum time (in seconds) to wait for responses from external services."
                  />
                </span>
              </label>
              <div className="col-span-2">
                <Field
                  id="requestTimeout"
                  name="requestTimeout"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="300"
                  step="1"
                  className="input input-primary input-sm w-1/6 rounded-md"
                />
                {errors.requestTimeout &&
                  touched.requestTimeout &&
                  typeof errors.requestTimeout === 'string' && (
                    <div className="text-error">{errors.requestTimeout}</div>
                  )}
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="scheduledRetryAttempts" className="col-span-1">
                <FormattedMessage
                  id="networkSettings.scheduledRetryAttempts"
                  defaultMessage="Scheduled Retry Attempts"
                />
                <span className="text-neutral block text-sm font-light">
                  <FormattedMessage
                    id="networkSettings.scheduledRetryAttempts.description"
                    defaultMessage="Maximum retry attempts to gather data from external services. (Set to 1 to disable)"
                  />
                </span>
              </label>
              <div className="col-span-2">
                <Field
                  id="scheduledRetryAttempts"
                  name="scheduledRetryAttempts"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="10"
                  step="1"
                  className="input input-primary input-sm w-1/6 rounded-md"
                />
                {errors.scheduledRetryAttempts &&
                  touched.scheduledRetryAttempts &&
                  typeof errors.scheduledRetryAttempts === 'string' && (
                    <div className="text-error">
                      {errors.scheduledRetryAttempts}
                    </div>
                  )}
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="scheduledRetryInterval" className="col-span-1">
                <FormattedMessage
                  id="networkSettings.scheduledRetryInterval"
                  defaultMessage="Scheduled Retry Interval"
                />
                <span className="text-neutral block text-sm font-light">
                  <FormattedMessage
                    id="networkSettings.scheduledRetryInterval.description"
                    defaultMessage="Time (in seconds) to wait between scheduled retry attempts."
                  />
                </span>
              </label>
              <div className="col-span-2">
                <Field
                  id="scheduledRetryInterval"
                  name="scheduledRetryInterval"
                  type="number"
                  inputMode="numeric"
                  min="30"
                  max="3600"
                  step="1"
                  className="input input-primary input-sm w-1/6 rounded-md"
                />
                {errors.scheduledRetryInterval &&
                  touched.scheduledRetryInterval &&
                  typeof errors.scheduledRetryInterval === 'string' && (
                    <div className="text-error">
                      {errors.scheduledRetryInterval}
                    </div>
                  )}
              </div>
            </div>
            <section
              className="space-y-5 pt-2"
              aria-labelledby="outbound-proxy-title"
            >
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label
                  id="outbound-proxy-title"
                  htmlFor="outboundProxy.enabled"
                  className="col-span-1"
                >
                  <FormattedMessage
                    id="networkSettings.outboundProxy.title"
                    defaultMessage="Outbound HTTP(S) Proxy"
                  />
                  <SettingsBadge badgeType="advanced" className="mr-2 ml-2" />
                  <SettingsBadge badgeType="restartRequired" />
                  <p className="text-neutral block text-sm font-light">
                    <FormattedMessage
                      id="networkSettings.outboundProxy.description"
                      defaultMessage="Route supported outbound HTTP requests through a proxy. SMTP and download-client connections are not proxied."
                    />
                  </p>
                </label>
                <div className="col-span-2 flex items-center">
                  <Field
                    type="checkbox"
                    id="outboundProxy.enabled"
                    name="outboundProxy.enabled"
                    onChange={() =>
                      setFieldValue(
                        'outboundProxy.enabled',
                        !values.outboundProxy.enabled
                      )
                    }
                    className="checkbox-primary checkbox"
                  />
                </div>
              </div>
              {values.outboundProxy.enabled && (
                <>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label
                      htmlFor="outboundProxy.hostname"
                      className="col-span-1"
                    >
                      <FormattedMessage
                        id="networkSettings.outboundProxy.host"
                        defaultMessage="Proxy Hostname"
                      />
                      <span className="text-error ml-1">*</span>
                    </label>
                    <div className="col-span-2">
                      <div className="flex">
                        <span className="border-primary bg-base-100 inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 sm:text-sm">
                          {values.outboundProxy.useSsl ? 'https://' : 'http://'}
                        </span>
                        <Field
                          id="outboundProxy.hostname"
                          name="outboundProxy.hostname"
                          autoComplete="off"
                          className="input input-primary input-sm w-full rounded-md rounded-l-none"
                        />
                      </div>
                      {errors.outboundProxy?.hostname &&
                        touched.outboundProxy?.hostname && (
                          <div className="text-error">
                            {errors.outboundProxy.hostname}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label htmlFor="outboundProxy.port" className="col-span-1">
                      <FormattedMessage
                        id="networkSettings.outboundProxy.port"
                        defaultMessage="Proxy port"
                      />
                      <span className="text-error ml-1">*</span>
                    </label>
                    <div className="col-span-2">
                      <Field
                        id="outboundProxy.port"
                        name="outboundProxy.port"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="65535"
                        step="1"
                        className="input input-primary input-sm w-1/6 rounded-md"
                      />
                      {errors.outboundProxy?.port &&
                        touched.outboundProxy?.port && (
                          <div className="text-error">
                            {errors.outboundProxy.port}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label
                      htmlFor="outboundProxy.useSsl"
                      className="col-span-1"
                    >
                      <FormattedMessage
                        id="networkSettings.outboundProxy.useSsl"
                        defaultMessage="Use SSL for Proxy"
                      />
                    </label>
                    <div className="sm:col-span-2">
                      <Field
                        type="checkbox"
                        id="outboundProxy.useSsl"
                        name="outboundProxy.useSsl"
                        className="checkbox-primary checkbox"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label
                      htmlFor="outboundProxy.username"
                      className="col-span-1"
                    >
                      <FormattedMessage
                        id="networkSettings.outboundProxy.username"
                        defaultMessage="Proxy Username"
                      />
                    </label>
                    <div className="col-span-2 flex">
                      <Field
                        id="outboundProxy.username"
                        name="outboundProxy.username"
                        autoComplete="off"
                        className="input input-primary input-sm w-full rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label
                      htmlFor="outboundProxy.password"
                      className="col-span-1"
                    >
                      <FormattedMessage
                        id="networkSettings.outboundProxy.password"
                        defaultMessage="Proxy Password"
                      />
                    </label>
                    <div className="col-span-2 space-y-1">
                      <div className="flex">
                        <SensitiveInput
                          as="field"
                          buttonSize="sm"
                          id="outboundProxy.password"
                          name="outboundProxy.password"
                          autoComplete="new-password"
                          className="input input-primary input-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label
                      htmlFor="outboundProxy.bypassLocalAddresses"
                      className="col-span-1"
                    >
                      <FormattedMessage
                        id="networkSettings.outboundProxy.bypassLocalAddresses"
                        defaultMessage="Bypass Proxy for Local Addresses"
                      />
                    </label>
                    <div className="col-span-2">
                      <Field
                        type="checkbox"
                        id="outboundProxy.bypassLocalAddresses"
                        name="outboundProxy.bypassLocalAddresses"
                        className="checkbox-primary checkbox"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                    <label
                      htmlFor="outboundProxy.bypassFilter"
                      className="col-span-1"
                    >
                      <FormattedMessage
                        id="networkSettings.outboundProxy.bypassFilter"
                        defaultMessage="Proxy Ignored Addresses"
                      />
                      <p className="text-neutral block text-sm font-light">
                        <FormattedMessage
                          id="networkSettings.outboundProxy.bypassHelp"
                          defaultMessage="Use ',' as a separator, and '*.' as a wildcard for subdomains."
                        />
                      </p>
                    </label>
                    <div className="col-span-2">
                      <Field
                        id="outboundProxy.bypassFilter"
                        name="outboundProxy.bypassFilter"
                        type="text"
                        autoComplete="off"
                        className="input input-primary input-sm w-full rounded-md"
                      />
                      {errors.outboundProxy?.bypassFilter &&
                        touched.outboundProxy?.bypassFilter && (
                          <div className="text-error">
                            {errors.outboundProxy.bypassFilter}
                          </div>
                        )}
                    </div>
                  </div>
                </>
              )}
            </section>
            <div className="divider divider-primary col-span-full mb-0" />
            <div className="col-span-3 mt-4 flex justify-end">
              <div className="flex gap-2">
                {values.outboundProxy.enabled && (
                  <Button
                    buttonType="warning"
                    buttonSize="sm"
                    type="button"
                    disabled={
                      isTestingProxy ||
                      isSubmitting ||
                      !values.outboundProxy.enabled ||
                      !values.outboundProxy.hostname ||
                      !values.outboundProxy.port
                    }
                    onClick={() => testOutboundProxy(values.outboundProxy)}
                  >
                    <ArrowPathIcon
                      className={`mr-2 size-4 ${isTestingProxy ? 'animate-spin' : ''}`}
                    />
                    <FormattedMessage
                      id="networkSettings.outboundProxy.test"
                      defaultMessage="Test"
                    />
                  </Button>
                )}
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
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default NetworkSettings;
