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

const ServicesProwlarr = () => {
  const { data: dataProwlarr, mutate: revalidateProwlarr } =
    useSWR<ServiceSettings>('/api/v1/settings/prowlarr');

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

  if (!dataProwlarr) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="max-w-6xl mb-10">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">Prowlarr Settings</h3>
        <p className="mb-5">
          Optionally configure the settings for your Prowlarr server.
        </p>
      </div>
      <Formik
        initialValues={{
          enabled: dataProwlarr?.enabled ?? false,
          urlBase: dataProwlarr?.urlBase,
        }}
        validationSchema={SettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/Prowlarr', {
              enabled: values.enabled,
              urlBase: values.urlBase,
            } as ServiceSettings);

            Toast({
              title: 'Prowlarr settings saved successfully!',
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch {
            Toast({
              title: 'Something went wrong while saving Prowlarr settings.',
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidateProwlarr();
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
                  Enable Prowlarr<span className="ml-1 text-error">*</span>
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
export default ServicesProwlarr;
