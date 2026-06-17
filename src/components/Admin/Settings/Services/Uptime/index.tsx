'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast from '@app/components/Toast';
import { isValidHttpUrl } from '@app/utils/networkValidation';
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

const ServicesUptime = () => {
  const intl = useIntl();
  const { data: dataUptime, mutate: revalidateUptime } =
    useSWR<ServiceSettings>('/api/v1/settings/uptime');

  const SettingsSchema = Yup.object().shape({
    externalUrl: Yup.string()
      .test(
        'valid-http-url',
        intl.formatMessage({
          id: 'generalSettings.validation.supportUrl',
          defaultMessage: 'You must provide a valid URL',
        }),
        (value) => isValidHttpUrl(value)
      )
      .test(
        'no-trailing-slash',
        intl.formatMessage({
          id: 'servicesSettings.validation.urlNoTrailingSlash',
          defaultMessage: 'URL must not end in a trailing slash',
        }),
        (value) => !value || !value.endsWith('/')
      ),
  });

  if (!dataUptime) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="mb-10 max-w-6xl">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="servicesSettings.uptime.title"
            defaultMessage="Uptime Settings"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="servicesSettings.uptime.description"
            defaultMessage="Optionally configure the settings for your Uptime server. Streamarr presents your uptime link via the help centre."
          />
        </p>
      </div>
      <Formik
        initialValues={{
          enabled: dataUptime?.enabled ?? false,
          externalUrl: dataUptime?.externalUrl,
        }}
        validationSchema={SettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/uptime', {
              externalUrl: values.externalUrl,
              enabled: values.enabled,
            } as ServiceSettings);

            Toast({
              title: intl.formatMessage(
                {
                  id: 'common.settingsSaveSuccess',
                  defaultMessage: '{appName} settings saved successfully',
                },
                { appName: 'Uptime' }
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
                { appName: 'Uptime' }
              ),
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidateUptime();
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
                <label htmlFor="externalUrl">
                  <FormattedMessage
                    id="common.externalUrl"
                    defaultMessage="External URL"
                  />
                  <span className="text-error ml-1">*</span>
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
                      className="input input-sm input-primary w-full rounded-md"
                    />
                  </div>
                  {errors.externalUrl && touched.externalUrl && (
                    <div className="text-error">{errors.externalUrl}</div>
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
                </span>
              </div>
            </form>
          );
        }}
      </Formik>
    </div>
  );
};
export default ServicesUptime;
