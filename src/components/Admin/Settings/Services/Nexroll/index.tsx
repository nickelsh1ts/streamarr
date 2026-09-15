'use client';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { ServiceSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const ServicesNexroll = () => {
  const intl = useIntl();
  const { data, mutate: revalidate } = useSWR<ServiceSettings>(
    '/api/v1/settings/nexroll'
  );
  const [isTesting, setIsTesting] = useState(false);

  const settingsSchema = Yup.object().shape({
    hostname: Yup.string().when('enabled', {
      is: true,
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'servicesSettings.validation.hostname',
            defaultMessage: 'You must provide a valid hostname or IP address',
          })
        ),
    }),
    port: Yup.number()
      .typeError(
        intl.formatMessage({
          id: 'generalSettings.validation.port',
          defaultMessage: 'You must provide a valid port number',
        })
      )
      .min(1)
      .max(65535)
      .required(
        intl.formatMessage({
          id: 'generalSettings.validation.port',
          defaultMessage: 'You must provide a valid port number',
        })
      ),
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
    async (values: ServiceSettings) => {
      setIsTesting(true);
      try {
        await axios.post('/api/v1/settings/nexroll/test', values);
        Toast({
          title: intl.formatMessage(
            {
              id: 'servicesSettings.testsuccess',
              defaultMessage: '{service} connection established successfully!',
            },
            { service: 'NeXroll' }
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
            { service: 'NeXroll' }
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
          id="servicesSettings.nexroll.title"
          defaultMessage="NeXroll Settings"
        />
      </h3>
      <p className="mb-5">
        <FormattedMessage
          id="servicesSettings.nexroll.description"
          defaultMessage="Optionally configure the settings for your NeXroll server."
        />
      </p>
    </div>
  );

  if (!data) {
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
      <RestartRequiredAlert filterServices={['NeXroll']} />
      <Formik
        initialValues={{
          enabled: data.enabled ?? false,
          hostname: data.hostname ?? '',
          port: data.port ?? 9393,
          useSsl: data.useSsl ?? false,
          urlBase: data.urlBase ?? '/nexroll',
        }}
        validationSchema={settingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/nexroll', {
              ...values,
              port: Number(values.port),
            } as ServiceSettings);
            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveSuccess',
                  defaultMessage: '{appName} settings saved successfully',
                },
                { appName: 'NeXroll' }
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
                { appName: 'NeXroll' }
              ),
              type: 'error',
              message: e.response?.data?.message || e.message,
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidate();
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
        }) => (
          <form className="mt-5 max-w-6xl space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="enabled">
                <FormattedMessage
                  id="common.settingsEnable"
                  defaultMessage="Enable"
                />
              </label>
              <div className="sm:col-span-2">
                <Field
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  onChange={() => setFieldValue('enabled', !values.enabled)}
                  className="checkbox checkbox-sm checkbox-primary rounded-md"
                />
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
                {errors.hostname && touched.hostname && (
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
                />
                {errors.port && touched.port && (
                  <div className="text-error">{errors.port}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="useSsl">
                <FormattedMessage id="common.useSsl" defaultMessage="Use SSL" />
              </label>
              <div className="sm:col-span-2">
                <Field
                  type="checkbox"
                  id="useSsl"
                  name="useSsl"
                  onChange={() => setFieldValue('useSsl', !values.useSsl)}
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
                <Field
                  className="input input-sm input-primary w-full rounded-md"
                  id="urlBase"
                  name="urlBase"
                  inputMode="url"
                  type="text"
                />
                {errors.urlBase && touched.urlBase && (
                  <div className="text-error">{errors.urlBase}</div>
                )}
              </div>
            </div>
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
                    !values.urlBase ||
                    isTesting ||
                    isSubmitting
                  }
                  onClick={() =>
                    testConnection({
                      hostname: values.hostname,
                      port: Number(values.port),
                      useSsl: values.useSsl,
                      urlBase: values.urlBase,
                      enabled: values.enabled,
                    })
                  }
                >
                  {isTesting ? (
                    <FormattedMessage
                      id="common.testing"
                      defaultMessage="Testing…"
                    />
                  ) : (
                    <FormattedMessage id="common.test" defaultMessage="Test" />
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
        )}
      </Formik>
    </div>
  );
};

export default ServicesNexroll;
