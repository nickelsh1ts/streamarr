'use client';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Button from '@app/components/Common/Button';
import CopyButton from '@app/components/Common/CopyButton';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import type { AvailableLocale } from '@app/context/LanguageContext';
import { availableLanguages } from '@app/context/LanguageContext';
import useLocale from '@app/hooks/useLocale';
import { useUser } from '@app/hooks/useUser';
import {
  CheckBadgeIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { Permission } from '@server/lib/permissions';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const GeneralSettings = () => {
  const { user: currentUser, hasPermission: userHasPermission } = useUser();
  const { setLocale } = useLocale();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');
  const { data: userData } = useSWR<UserSettingsGeneralResponse>(
    currentUser ? `/api/v1/user/${currentUser.id}/settings/main` : null
  );

  const MainSettingsSchema = Yup.object().shape({
    applicationTitle: Yup.string().required(
      'You must provide an application title'
    ),
    applicationUrl: Yup.string()
      .url('You must provide a valid URL')
      .test(
        'no-trailing-slash',
        'URL must not end in a trailing slash',
        (value) => !value || !value.endsWith('/')
      ),
    supportUrl: Yup.string().url('You must provide a valid URL'),
  });

  const regenerate = async () => {
    try {
      await axios.post('/api/v1/settings/main/regenerate');

      revalidate();
      Toast({
        title: 'New API key generated successfully!',
        icon: <ExclamationTriangleIcon className="size-7" />,
        type: 'warning',
      });
    } catch {
      Toast({
        title: 'Something went wrong while generating a new API key.',
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
      });
    }
  };

  if (!data && !error) {
    return <LoadingEllipsis />;
  }
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-extrabold">General Settings</h3>
      <p className="mb-5">Configure global and default Streamarr settings</p>
      <Formik
        initialValues={{
          applicationTitle: data?.applicationTitle,
          applicationUrl: data?.applicationUrl,
          csrfProtection: data?.csrfProtection,
          locale: data?.locale ?? 'en',
          enableSignUp: data?.enableSignUp,
          releaseSched: data?.releaseSched,
          trustProxy: data?.trustProxy,
          cacheImages: data?.cacheImages,
          supportUrl: data?.supportUrl,
          supportEmail: data?.supportEmail,
          extendedHome: data?.extendedHome,
        }}
        enableReinitialize
        validationSchema={MainSettingsSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/main', {
              applicationTitle: values.applicationTitle,
              applicationUrl: values.applicationUrl,
              csrfProtection: values.csrfProtection,
              locale: values.locale,
              enableSignUp: values.enableSignUp,
              releaseSched: values.releaseSched,
              trustProxy: values.trustProxy,
              cacheImages: values.cacheImages,
              supportUrl: values.supportUrl,
              supportEmail: values.supportEmail,
              extendedHome: values.extendedHome,
            });
            mutate('/api/v1/settings/public');
            mutate('/api/v1/status');

            if (setLocale) {
              setLocale(
                (userData?.locale
                  ? userData.locale
                  : values.locale) as AvailableLocale
              );
            }

            Toast({
              title: 'Settings saved successfully!',
              icon: <CheckBadgeIcon className="size-7" />,
              type: 'success',
            });
          } catch {
            Toast({
              title: 'Something went wrong while saving settings.',
              icon: <XCircleIcon className="size-7" />,
              type: 'error',
            });
          } finally {
            revalidate();
          }
        }}
      >
        {({
          errors,
          touched,
          isSubmitting,
          isValid,
          values,
          setFieldValue,
        }) => {
          return (
            <Form className="">
              <div className="mt-5 max-w-6xl space-y-5">
                {userHasPermission(Permission.ADMIN) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                    <label htmlFor="apiKey" className="col-span-1">
                      API Key
                    </label>
                    <div className="flex col-span-2">
                      <SensitiveInput
                        type="text"
                        id="apiKey"
                        buttonSize="sm"
                        className="input input-sm input-primary w-full"
                        value={data?.apiKey}
                        readOnly
                      />
                      <CopyButton
                        size="sm"
                        itemTitle="API Key"
                        textToCopy={data?.apiKey ?? ''}
                        key={data?.apiKey}
                      />
                      <Tooltip
                        content="Regenerate API Key"
                        tooltipConfig={{
                          followCursor: true,
                          placement: 'top-end',
                        }}
                      >
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            regenerate();
                          }}
                          buttonSize="sm"
                          buttonType="warning"
                          className="rounded-none only:rounded-md last:rounded-r-md"
                        >
                          <ArrowPathIcon className="size-5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="applicationTitle" className="col-span-1">
                    Application Title
                  </label>
                  <div className="col-span-2">
                    <Field
                      id="applicationTitle"
                      name="applicationTitle"
                      type="text"
                      className="input input-primary input-sm w-full"
                    />
                    {errors.applicationTitle &&
                      touched.applicationTitle &&
                      typeof errors.applicationTitle === 'string' && (
                        <div className="text-error">
                          {errors.applicationTitle}
                        </div>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="applicationUrl" className="col-span-1">
                    Application URL
                  </label>
                  <div className="col-span-2">
                    <Field
                      id="applicationUrl"
                      name="applicationUrl"
                      type="text"
                      inputMode="url"
                      className="input input-primary input-sm w-full"
                    />
                    {errors.applicationUrl &&
                      touched.applicationUrl &&
                      typeof errors.applicationUrl === 'string' && (
                        <div className="text-error">
                          {errors.applicationUrl}
                        </div>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="enableSignUp" className="col-span-1">
                    <span className="mr-2">Enable Signup</span>
                    <p className="text-sm text-neutral-500">
                      Allow new users to signup. This will also enable invite
                      management.
                    </p>
                  </label>
                  <div className="col-span-2">
                    <Field
                      type="checkbox"
                      id="enableSignUp"
                      name="enableSignUp"
                      onChange={() => {
                        setFieldValue('enableSignUp', !values.enableSignUp);
                      }}
                      className="checkbox-primary checkbox"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="releaseSched" className="col-span-1">
                    <span className="mr-2">Enable Release Schedule</span>
                  </label>
                  <div className="col-span-2">
                    <Field
                      type="checkbox"
                      id="releaseSched"
                      name="releaseSched"
                      onChange={() => {
                        setFieldValue('releaseSched', !values.releaseSched);
                      }}
                      className="checkbox-primary checkbox"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="trustProxy" className="col-span-1">
                    <span className="mr-2">Enable Proxy Support</span>
                    <SettingsBadge badgeType="restartRequired" />
                    <p className="text-sm text-neutral-500">
                      Allow Streamarr to correctly register client IP addresses
                      behind a proxy
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
                    <span className="mr-2">Enable CSRF Protection</span>
                    <SettingsBadge badgeType="advanced" className="mr-2" />
                    <SettingsBadge badgeType="restartRequired" />
                    <p className="text-sm text-neutral-500">
                      Set external API access to read-only (requires HTTPS)
                    </p>
                  </label>
                  <Tooltip
                    content={
                      'Do NOT enable this setting unless you understand what you are doing!'
                    }
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
                  <label htmlFor="cacheImages" className="col-span-1">
                    <span className="mr-2">Enable Image Caching</span>
                    <p className="text-sm text-neutral-500">
                      Cache externally sourced images (requires extra disk
                      space)
                    </p>
                  </label>
                  <Field
                    type="checkbox"
                    id="cacheImages"
                    name="cacheImages"
                    onChange={() => {
                      setFieldValue('cacheImages', !values.cacheImages);
                    }}
                    className="checkbox-primary checkbox"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="locale" className="col-span-1">
                    Display Language
                  </label>
                  <div>
                    <Field
                      as="select"
                      id="locale"
                      name="locale"
                      className="select select-primary select-sm w-full"
                    >
                      {(
                        Object.keys(
                          availableLanguages
                        ) as (keyof typeof availableLanguages)[]
                      ).map((key) => (
                        <option
                          key={key}
                          value={availableLanguages[key].code}
                          lang={availableLanguages[key].code}
                        >
                          {availableLanguages[key].display}
                        </option>
                      ))}
                    </Field>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="supportUrl" className="col-span-1">
                    Get Support URL
                  </label>
                  <div className="col-span-2">
                    <Field
                      id="supportUrl"
                      name="supportUrl"
                      type="text"
                      inputMode="url"
                      className="input input-primary input-sm w-full"
                    />
                    {errors.supportUrl &&
                      touched.supportUrl &&
                      typeof errors.supportUrl === 'string' && (
                        <div className="text-error">{errors.supportUrl}</div>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="supportEmail" className="col-span-1">
                    Support Email
                  </label>
                  <div className="col-span-2">
                    <Field
                      id="supportEmail"
                      name="supportEmail"
                      type="text"
                      inputMode="email"
                      className="input input-primary input-sm w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="extendedHome" className="col-span-1">
                    <span className="mr-2">Enable Extended Homepage</span>
                    <p className="text-sm text-neutral-500">
                      Enable the extended homepage with FAQs
                    </p>
                  </label>
                  <Field
                    type="checkbox"
                    id="extendedHome"
                    name="extendedHome"
                    onChange={() => {
                      setFieldValue('extendedHome', !values.extendedHome);
                    }}
                    className="checkbox-primary checkbox"
                  />
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
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
export default GeneralSettings;
