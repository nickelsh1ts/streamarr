'use client';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import RestartRequiredAlert, {
  RESTART_REQUIRED_SWR_KEY,
} from '@app/components/Admin/Settings/RestartRequiredAlert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { NetworkSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const NetworkSettings = () => {
  const intl = useIntl();
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
      .min(
        1,
        intl.formatMessage({
          id: 'networkSettings.validation.requestTimeoutMin',
          defaultMessage: 'Request timeout must be at least 1 second',
        })
      ),
    trustProxy: Yup.boolean(),
    csrfProtection: Yup.boolean(),
  });

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="max-w-6xl mb-10">
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
      <RestartRequiredAlert
        filterServices={['Proxy Support', 'CSRF Protection']}
      />
      <Formik
        initialValues={{
          requestTimeout: data ? data.requestTimeout / 1000 : 10,
          trustProxy: data?.trustProxy ?? false,
          csrfProtection: data?.csrfProtection ?? false,
        }}
        enableReinitialize
        validationSchema={NetworkSettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/network', {
              requestTimeout: Number(values.requestTimeout) * 1000,
              trustProxy: values.trustProxy,
              csrfProtection: values.csrfProtection,
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
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="trustProxy" className="col-span-1">
                <span className="mr-2">
                  <FormattedMessage
                    id="generalSettings.trustProxy.label"
                    defaultMessage="Enable Proxy Support"
                  />
                </span>
                <SettingsBadge badgeType="restartRequired" />
                <p className="text-sm block font-light text-neutral">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="csrfProtection" className="col-span-1">
                <span className="mr-2">
                  <FormattedMessage
                    id="generalSettings.csrfProtection.label"
                    defaultMessage="Enable CSRF Protection"
                  />
                </span>
                <SettingsBadge badgeType="advanced" className="mr-2" />
                <SettingsBadge badgeType="restartRequired" />
                <p className="text-sm block font-light text-neutral">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="requestTimeout" className="col-span-1">
                <FormattedMessage
                  id="networkSettings.requestTimeout"
                  defaultMessage="API Request Timeout"
                />
                <span className="text-sm block font-light text-neutral">
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
                  className="input input-primary input-sm rounded-md w-1/6"
                />
                {errors.requestTimeout &&
                  touched.requestTimeout &&
                  typeof errors.requestTimeout === 'string' && (
                    <div className="text-error">{errors.requestTimeout}</div>
                  )}
              </div>
            </div>
            <div className="divider divider-primary mb-0 col-span-full" />
            <div className="flex justify-end col-span-3 mt-4">
              <div className="flex gap-2">
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
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default NetworkSettings;
