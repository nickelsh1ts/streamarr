'use client';
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
import useSWR from 'swr';
import * as Yup from 'yup';

const ServicesUptime = () => {
  const { data: dataUptime, mutate: revalidateUptime } =
    useSWR<ServiceSettings>('/api/v1/settings/uptime');

  const SettingsSchema = Yup.object().shape({
    externalUrl: Yup.string()
      .url('You must provide a valid URL')
      .test(
        'no-trailing-slash',
        'URL must not end in a trailing slash',
        (value) => !value || !value.endsWith('/')
      ),
  });

  if (!dataUptime) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="max-w-6xl mb-10">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">Uptime Settings</h3>
        <p className="mb-5">
          Optionally configure the settings for your Uptime server. Streamarr
          presents your uptime link via the help centre.
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
              enabled: values.enabled,
              externalUrl: values.externalUrl,
            } as ServiceSettings);

            Toast({
              title: 'Uptime settings saved successfully!',
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch {
            Toast({
              title: 'Something went wrong while saving Uptime settings.',
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="service">
                  Enable Uptime<span className="ml-1 text-error">*</span>
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
                <label htmlFor="externalUrl">External URL</label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      className="input input-sm input-primary rounded-md w-full"
                      id="externalUrl"
                      name="externalUrl"
                      inputMode="url"
                      type="text"
                    />
                  </div>
                  {errors.externalUrl && touched.externalUrl && (
                    <div className="text-error">{errors.externalUrl}</div>
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
export default ServicesUptime;
