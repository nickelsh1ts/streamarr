'use client';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toggle from '@app/components/Common/Toggle';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { ShelfmarkGlobalRequestSettingsResponse } from '@server/api/shelfmark';
import type { ShelfmarkSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { isEqual } from 'lodash';
import { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const defaultMessages = defineMessages({
  ebookPolicy: {
    id: 'servicesSettings.shelfmarkDefaults.ebook',
    defaultMessage: 'Ebook',
  },
  audiobookPolicy: {
    id: 'servicesSettings.shelfmarkDefaults.audiobook',
    defaultMessage: 'Audiobook',
  },
});
const policyMessages = defineMessages({
  download: {
    id: 'servicesSettings.shelfmarkDefaults.download',
    defaultMessage: 'Download',
  },
  request_release: {
    id: 'servicesSettings.shelfmarkDefaults.requestRelease',
    defaultMessage: 'Request Release',
  },
  request_book: {
    id: 'servicesSettings.shelfmarkDefaults.requestBook',
    defaultMessage: 'Request Book',
  },
  blocked: {
    id: 'servicesSettings.shelfmarkDefaults.blocked',
    defaultMessage: 'Blocked',
  },
});

const hasShelfmarkConnectionChanged = (
  values: {
    hostname: string;
    port: number;
    useSsl: boolean;
    urlBase: string;
  },
  settings?: ShelfmarkSettings
) =>
  values.hostname !== (settings?.hostname ?? '') ||
  Number(values.port) !== (settings?.port ?? 13378) ||
  values.useSsl !== (settings?.useSsl ?? false) ||
  values.urlBase !== (settings?.urlBase ?? '/shelfmark');

const ServicesShelfmark = () => {
  const intl = useIntl();

  const {
    data,
    error,
    isValidating,
    mutate: revalidate,
  } = useSWR<ShelfmarkSettings>('/api/v1/settings/shelfmark');
  const {
    data: requestSettings,
    error: requestSettingsError,
    isLoading: requestSettingsLoading,
    mutate: revalidateRequestSettings,
  } = useSWR<ShelfmarkGlobalRequestSettingsResponse>(
    data?.hostname && data?.port && data?.urlBase
      ? '/api/v1/settings/shelfmark/requests'
      : null
  );
  const userDefaults = {
    ebookPolicy: data?.defaultUserSettings?.ebookPolicy ?? 'inherit',
    audiobookPolicy: data?.defaultUserSettings?.audiobookPolicy ?? 'inherit',
  };
  const [isTesting, setIsTesting] = useState(false);

  const SettingsSchema = Yup.object().shape({
    requestLimit: Yup.string().when('requestsEnabled', {
      is: true,
      then: (schema) =>
        schema.test(
          'request-limit',
          intl.formatMessage({
            id: 'servicesSettings.shelfmarkDefaults.limitInvalid',
            defaultMessage: 'Enter a whole number between 1 and 1000.',
          }),
          (value) =>
            /^\d+$/.test(value ?? '') &&
            Number(value) >= 1 &&
            Number(value) <= 1000
        ),
    }),
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
        (value) => !value || value?.startsWith('/')
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
    async (params: {
      hostname: string;
      port: number;
      urlBase?: string;
      useSsl?: boolean;
    }) => {
      setIsTesting(true);
      try {
        await axios.post('/api/v1/settings/shelfmark/test', {
          hostname: params.hostname,
          port: Number(params.port),
          urlBase: params.urlBase,
          useSsl: params.useSsl,
        });
        Toast({
          title: intl.formatMessage(
            {
              id: 'servicesSettings.testsuccess',
              defaultMessage: '{service} connection established successfully!',
            },
            { service: 'Shelfmark' }
          ),
          type: 'success',
          icon: <CheckBadgeIcon className="size-7" />,
        });
      } catch {
        Toast({
          title: intl.formatMessage(
            {
              id: 'servicesSettings.testfailed',
              defaultMessage: 'Failed to connect to {service}.',
            },
            { service: 'Shelfmark' }
          ),
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
        });
      } finally {
        setIsTesting(false);
      }
    },
    [intl]
  );

  const header = (
    <div className="mb-6">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="servicesSettings.shelfmark.title"
          defaultMessage="Shelfmark Settings"
        />
      </h3>
      <p className="mb-5">
        <FormattedMessage
          id="servicesSettings.shelfmark.description"
          defaultMessage="Optionally configure the settings for your Shelfmark server."
        />
      </p>
    </div>
  );

  if (!data) {
    return (
      <div className="mb-10 max-w-6xl">
        {header}
        {error ? (
          <Alert
            type="error"
            title={intl.formatMessage({
              id: 'servicesSettings.shelfmark.loadError',
              defaultMessage: 'Unable to load Shelfmark settings.',
            })}
          >
            <Button
              buttonType="error"
              buttonSize="sm"
              onClick={() => revalidate()}
              disabled={isValidating}
            >
              <ArrowPathIcon
                className={`mr-1 size-5 ${isValidating ? 'animate-spin' : ''}`}
              />
              <FormattedMessage id="common.retry" defaultMessage="Retry" />
            </Button>
          </Alert>
        ) : (
          <LoadingEllipsis />
        )}
      </div>
    );
  }

  if (requestSettingsLoading) {
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
      <RestartRequiredAlert filterServices={['Shelfmark']} />
      <Alert
        title={intl.formatMessage({
          id: 'servicesSettings.shelfmark.alertTitle',
          defaultMessage: 'Set a matching base path in Shelfmark',
        })}
        type="info"
      >
        <p>
          <FormattedMessage
            id="servicesSettings.shelfmark.alertDescription"
            defaultMessage="Set ROUTER_BASE_PATH to this URL Base and AUTH_METHOD to proxy. Configure PROXY_AUTH_USER_HEADER as X-Auth-User, PROXY_AUTH_ADMIN_GROUP_HEADER as X-Auth-Groups, and PROXY_AUTH_ADMIN_GROUP_NAME as streamarr-admin. Keep Shelfmark private; it trusts these proxy headers. Restart Shelfmark after changing its environment."
          />
        </p>
      </Alert>
      <Formik
        initialValues={{
          enabled: data?.enabled || false,
          hostname: data?.hostname || '',
          port: data?.port || 13378,
          useSsl: data?.useSsl || false,
          urlBase: data?.urlBase ?? '/shelfmark',
          enableNewUserSignIn: data?.enableNewUserSignIn || false,
          userDefaults,
          userDefaultsSnapshot: userDefaults,
          requestsEnabled: requestSettings?.values.requestsEnabled ?? false,
          requestsAllowNotes:
            requestSettings?.values.requestsAllowNotes ?? false,
          requestLimit: requestSettings?.values.requestLimit?.toString() ?? '',
          globalSnapshot: { ...requestSettings?.values },
        }}
        validationSchema={SettingsSchema}
        onSubmit={async (values, { resetForm, setFieldValue }) => {
          const userDefaultsChanged = !isEqual(
            values.userDefaults,
            values.userDefaultsSnapshot
          );
          const hasRequestSettings = !!requestSettings && !requestSettingsError;
          const globalRequestSettings = hasRequestSettings
            ? {
                ...(values.requestsEnabled !==
                  values.globalSnapshot.requestsEnabled && {
                  requestsEnabled: values.requestsEnabled,
                }),
                ...(values.requestsEnabled &&
                  values.requestsAllowNotes !==
                    values.globalSnapshot.requestsAllowNotes && {
                    requestsAllowNotes: values.requestsAllowNotes,
                  }),
                ...(values.requestsEnabled &&
                  values.requestLimit &&
                  Number(values.requestLimit) !==
                    values.globalSnapshot.requestLimit && {
                    requestLimit: Number(values.requestLimit),
                  }),
              }
            : {};
          let saveSucceeded = false;
          try {
            await axios.post('/api/v1/settings/shelfmark', {
              enabled: values.enabled,
              hostname: values.hostname,
              port: Number(values.port),
              useSsl: values.useSsl,
              urlBase: values.urlBase,
              enableNewUserSignIn: values.enableNewUserSignIn,
              ...(userDefaultsChanged && {
                defaultUserSettings: {
                  ...(values.userDefaults.ebookPolicy !== 'inherit' && {
                    ebookPolicy: values.userDefaults.ebookPolicy,
                  }),
                  ...(values.userDefaults.audiobookPolicy !== 'inherit' && {
                    audiobookPolicy: values.userDefaults.audiobookPolicy,
                  }),
                },
              }),
              globalRequestSettings,
            });
            saveSucceeded = true;
            if (userDefaultsChanged) {
              await setFieldValue(
                'userDefaultsSnapshot',
                values.userDefaults,
                false
              );
            }

            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveSuccess',
                  defaultMessage: '{appName} settings saved successfully',
                },
                { appName: 'Shelfmark' }
              ),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });

            mutate(RESTART_REQUIRED_SWR_KEY);
          } catch (e) {
            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveError',
                  defaultMessage:
                    'Something went wrong while saving {appName} settings.',
                },
                { appName: 'Shelfmark' }
              ),
              type: 'error',
              message: e.response?.data?.message || e.message,
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            const refreshedSettings = await revalidate();
            if (refreshedSettings && refreshedSettings !== data) {
              await setFieldValue(
                'userDefaultsSnapshot',
                {
                  ebookPolicy:
                    refreshedSettings.defaultUserSettings?.ebookPolicy ??
                    'inherit',
                  audiobookPolicy:
                    refreshedSettings.defaultUserSettings?.audiobookPolicy ??
                    'inherit',
                },
                false
              );
            }
            const refreshed = await revalidateRequestSettings();
            if (saveSucceeded && refreshed && refreshed !== requestSettings) {
              resetForm({
                values: {
                  ...values,
                  userDefaultsSnapshot: values.userDefaults,
                  globalSnapshot: refreshed.values,
                  requestsEnabled: refreshed.values.requestsEnabled,
                  requestsAllowNotes: refreshed.values.requestsAllowNotes,
                  requestLimit: String(refreshed.values.requestLimit),
                },
              });
            }
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
          const connectionChanged = hasShelfmarkConnectionChanged(values, data);
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
                      {values.useSsl ? 'https://' : 'http://'}
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="urlBase">
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
                <label htmlFor="enableNewUserSignIn">
                  <FormattedMessage
                    id="servicesSettings.shelfmark.enableNewUserSignIn"
                    defaultMessage="Enable New User Signin"
                  />
                  <span className="text-neutral block text-sm font-light">
                    <FormattedMessage
                      id="servicesSettings.shelfmark.enableNewUserSignIn.description"
                      defaultMessage="Allow users to create and manage their own Shelfmark accounts."
                    />
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    type="checkbox"
                    id="enableNewUserSignIn"
                    name="enableNewUserSignIn"
                    onChange={() => {
                      setFieldValue(
                        'enableNewUserSignIn',
                        !values.enableNewUserSignIn
                      );
                    }}
                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                  />
                </div>
              </div>
              {requestSettings &&
                !requestSettingsError &&
                values.requestsEnabled && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <span className="block">
                      <FormattedMessage
                        id="servicesSettings.newUserSettings"
                        defaultMessage="New User Settings"
                      />
                      <span className="text-neutral block text-sm font-light">
                        <FormattedMessage
                          id="servicesSettings.newUserSettings.description"
                          defaultMessage="Settings applied when a new user is created."
                        />
                      </span>
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
                      {(
                        Object.keys(
                          defaultMessages
                        ) as (keyof typeof defaultMessages)[]
                      ).map((key) => (
                        <div key={key} className="">
                          <label
                            htmlFor={`default-${key}`}
                            className={`block text-sm sm:row-start-1 ${key === 'ebookPolicy' ? 'sm:col-start-2' : 'sm:col-start-3'}`}
                          >
                            {intl.formatMessage(defaultMessages[key])}
                          </label>
                          <Field
                            as="select"
                            id={`default-${key}`}
                            name={`userDefaults.${key}`}
                            disabled={isSubmitting}
                            className={`select select-sm select-primary w-full sm:row-start-2 ${key === 'ebookPolicy' ? 'sm:col-start-2' : 'sm:col-start-3'}`}
                          >
                            <option value="inherit">
                              {intl.formatMessage({
                                id: 'servicesSettings.shelfmarkDefaults.default',
                                defaultMessage: 'Default',
                              })}
                            </option>
                            {Object.entries(policyMessages).map(
                              ([mode, message]) => (
                                <option key={mode} value={mode}>
                                  {intl.formatMessage(message)}
                                </option>
                              )
                            )}
                          </Field>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {!connectionChanged &&
                (requestSettings || requestSettingsError) && (
                  <div className="space-y-5">
                    <span className="block font-bold">
                      <FormattedMessage
                        id="servicesSettings.shelfmarkRequests.global"
                        defaultMessage="Global Request Settings"
                      />
                    </span>
                    {requestSettingsError ? (
                      <Alert>
                        <FormattedMessage
                          id="servicesSettings.shelfmarkRequests.unavailable"
                          defaultMessage="Shelfmark is currently unavailable..."
                        />
                      </Alert>
                    ) : (
                      requestSettings && (
                        <>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <label htmlFor="requestsEnabled">
                              <FormattedMessage
                                id="servicesSettings.shelfmarkRequests.enabled"
                                defaultMessage="Enable Requests"
                              />
                            </label>
                            <div
                              className={`sm:col-span-2 ${requestSettings.locked.includes('requestsEnabled') ? 'opacity-50' : ''}`}
                              inert={
                                isSubmitting ||
                                requestSettings.locked.includes(
                                  'requestsEnabled'
                                )
                              }
                            >
                              <Toggle
                                id="requestsEnabled"
                                valueOf={values.requestsEnabled}
                                onClick={() =>
                                  setFieldValue(
                                    'requestsEnabled',
                                    !values.requestsEnabled
                                  )
                                }
                                ariaLabel={intl.formatMessage({
                                  id: 'servicesSettings.shelfmarkRequests.enabled',
                                  defaultMessage: 'Enable Requests',
                                })}
                              />
                            </div>
                          </div>
                          {values.requestsEnabled && (
                            <>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <label htmlFor="requestsAllowNotes">
                                  <FormattedMessage
                                    id="servicesSettings.shelfmarkRequests.notes"
                                    defaultMessage="Allow Notes on Requests"
                                  />
                                </label>
                                <div
                                  className={`sm:col-span-2 ${requestSettings.locked.includes('requestsAllowNotes') ? 'opacity-50' : ''}`}
                                  inert={
                                    isSubmitting ||
                                    requestSettings.locked.includes(
                                      'requestsAllowNotes'
                                    )
                                  }
                                >
                                  <Toggle
                                    id="requestsAllowNotes"
                                    valueOf={values.requestsAllowNotes}
                                    onClick={() =>
                                      setFieldValue(
                                        'requestsAllowNotes',
                                        !values.requestsAllowNotes
                                      )
                                    }
                                    ariaLabel={intl.formatMessage({
                                      id: 'servicesSettings.shelfmarkRequests.notes',
                                      defaultMessage: 'Allow Notes on Requests',
                                    })}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <label htmlFor="requestLimit">
                                  <FormattedMessage
                                    id="servicesSettings.shelfmarkRequests.limit"
                                    defaultMessage="Max Pending Requests Per User"
                                  />
                                </label>
                                <div className="sm:col-span-2">
                                  <Field
                                    type="number"
                                    min="1"
                                    max="1000"
                                    step="1"
                                    id="requestLimit"
                                    name="requestLimit"
                                    disabled={
                                      isSubmitting ||
                                      requestSettings.locked.includes(
                                        'requestLimit'
                                      )
                                    }
                                    className="input input-sm input-primary w-1/6"
                                  />
                                  {errors.requestLimit &&
                                    touched.requestLimit && (
                                      <p className="text-error">
                                        {errors.requestLimit}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </>
                          )}
                          {requestSettings.locked.length > 0 && (
                            <p className="text-neutral text-sm">
                              <FormattedMessage
                                id="servicesSettings.shelfmarkRequests.envLocked"
                                defaultMessage="Some request settings are managed by Shelfmark environment variables."
                              />
                            </p>
                          )}
                        </>
                      )
                    )}
                  </div>
                )}
              <div className="divider divider-primary col-span-full mb-0" />
              <div className="col-span-3 mt-4 flex justify-end">
                <div className="flex gap-2">
                  <Button
                    buttonType="warning"
                    buttonSize="sm"
                    type="button"
                    disabled={
                      !values.hostname ||
                      !values.port ||
                      isTesting ||
                      isSubmitting
                    }
                    onClick={() =>
                      testConnection({
                        hostname: values.hostname,
                        port: Number(values.port),
                        urlBase: values.urlBase,
                        useSsl: values.useSsl,
                      })
                    }
                  >
                    {isTesting ? (
                      <FormattedMessage
                        id="common.testing"
                        defaultMessage="Testing…"
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
                    <ArrowDownTrayIcon className="mr-2 size-4" />
                    <span>
                      {isSubmitting ? (
                        <FormattedMessage
                          id="common.saving"
                          defaultMessage="Saving…"
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

export default ServicesShelfmark;
