'use client';
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
import useSWR from 'swr';
import * as Yup from 'yup';

const ServicesLidarr = () => {
  const { data: dataLidarr, mutate: revalidateLidarr } =
    useSWR<ServiceSettings>('/api/v1/settings/lidarr');

  const SettingsSchema = Yup.object().shape({
    urlBase: Yup.string()
      .test(
        'leading-slash',
        'URL base must have a leading slash',
        (value) => !value || value.startsWith('/')
      )
      .test(
        'no-trailing-slash',
        'URL must not end in a trailing slash',
        (value) => !value || !value.endsWith('/')
      ),
  });

  if (!dataLidarr) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="max-w-6xl mb-10">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">Lidarr Settings</h3>
        <p className="mb-5">
          Optionally configure the settings for your Lidarr server.
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
            await axios.post('/api/v1/settings/Lidarr', {
              hostname: values.hostname,
              port: values.port,
              useSsl: values.useSsl,
              enabled: values.enabled,
              urlBase: values.urlBase,
              apiKey: values.apiKey,
            } as ServiceSettings);

            Toast({
              title: 'Lidarr settings saved successfully!',
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch {
            Toast({
              title: 'Something went wrong while saving Lidarr settings.',
              type: 'error',
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
                  Enable Lidarr<span className="ml-1 text-error">*</span>
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
                  Hostname or IP Address
                  <span className="ml-1 text-error">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 text-primary-content sm:text-sm">
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
                  Port
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
                <label htmlFor="useSsl">Use SSL</label>
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
                <label htmlFor="urlBase">URL Base</label>
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
                  API Key
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
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
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
export default ServicesLidarr;
