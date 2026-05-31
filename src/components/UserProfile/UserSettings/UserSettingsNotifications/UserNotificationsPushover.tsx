'use client';
import type { NotificationSelectOption } from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { useUser } from '@app/hooks/useUser';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const UserNotificationsPushover = () => {
  const intl = useIntl();
  const { userid } = useParams<{ userid: string }>();
  const {
    user,
    loading: userLoading,
    error: userError,
  } = useUser({ id: Number(userid) });

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  const { data: soundsData } = useSWR<{ value: string; label: string }[]>(
    user && data?.pushoverApplicationToken
      ? `/api/v1/user/${user?.id}/settings/notifications/pushover/sounds`
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const soundOptions: NotificationSelectOption[] = [
    {
      value: '',
      label: intl.formatMessage({
        id: 'userSettings.notifications.soundDefault',
        defaultMessage: 'Device Default',
      }),
    },
    ...(soundsData ?? []).map((s) => ({ value: s.value, label: s.label })),
  ];

  const schema = Yup.object().shape({
    pushoverApplicationToken: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.pushover.applicationTokenRequired',
        defaultMessage: 'You must provide your Pushover application API token',
      })
    ),
    pushoverUserKey: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.pushover.userKeyRequired',
        defaultMessage: 'You must provide your Pushover user key',
      })
    ),
  });

  if (userLoading || (!data && !error)) {
    return <LoadingEllipsis />;
  }

  if (userError || !user) {
    return (
      <div className="text-error">
        <FormattedMessage
          id="userSettings.notifications.userLoadError"
          defaultMessage="Unable to load user profile settings."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-error">
        <FormattedMessage
          id="userSettings.notifications.settingsLoadError"
          defaultMessage="Unable to load notification settings."
        />
      </div>
    );
  }

  return (
    <Formik
      initialValues={{
        pushoverApplicationToken: data?.pushoverApplicationToken ?? '',
        pushoverUserKey: data?.pushoverUserKey ?? '',
        pushoverSound: data?.pushoverSound ?? '',
        types: data?.notificationTypes.pushover ?? ALL_NOTIFICATIONS,
      }}
      validationSchema={schema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            pushoverApplicationToken: values.pushoverApplicationToken,
            pushoverUserKey: values.pushoverUserKey,
            pushoverSound: values.pushoverSound,
            notificationTypes: {
              pushover: values.types,
            },
          });

          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveSuccess',
                defaultMessage:
                  '{provider} notification settings saved successfully!',
              },
              { provider: 'Pushover' }
            ),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        } catch (e) {
          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveError',
                defaultMessage:
                  '{provider} notification settings failed to save.',
              },
              { provider: 'Pushover' }
            ),
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
            message: e.message,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({
        values,
        errors,
        touched,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
        isValid,
      }) => (
        <Form className="mt-5">
          <div className="max-w-6xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="pushoverApplicationToken" className="col-span-1">
                <FormattedMessage
                  id="notifications.fields.pushoverApplicationToken"
                  defaultMessage="Application API Token"
                />
              </label>
              <div className="col-span-2">
                <div className="flex">
                  <SensitiveInput
                    as="field"
                    id="pushoverApplicationToken"
                    name="pushoverApplicationToken"
                    buttonSize="sm"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.pushoverApplicationToken &&
                  touched.pushoverApplicationToken && (
                    <div className="text-error">
                      {errors.pushoverApplicationToken}
                    </div>
                  )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="pushoverUserKey" className="col-span-1">
                <FormattedMessage
                  id="notifications.fields.pushoverUserKey"
                  defaultMessage="User Key"
                />
              </label>
              <div className="col-span-2">
                <div className="flex">
                  <SensitiveInput
                    as="field"
                    id="pushoverUserKey"
                    name="pushoverUserKey"
                    buttonSize="sm"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.pushoverUserKey && touched.pushoverUserKey && (
                  <div className="text-error">{errors.pushoverUserKey}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="pushoverSound" className="col-span-1">
                <FormattedMessage
                  id="notifications.fields.sound"
                  defaultMessage="Sound"
                />
              </label>
              <div className="col-span-2">
                <Field
                  id="pushoverSound"
                  name="pushoverSound"
                  as="select"
                  className="select select-sm select-primary rounded-md"
                  value={values.pushoverSound}
                  onChange={(e) => {
                    setFieldValue('pushoverSound', e.target.value);
                  }}
                >
                  {soundOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Field>
              </div>
            </div>
            <NotificationTypeSelector
              user={user}
              currentTypes={values.types}
              onUpdate={(newTypes) => {
                setFieldValue('types', newTypes);
                setFieldTouched('types');
              }}
            />
          </div>
          <div className="divider divider-primary mb-0 col-span-full" />
          <div className="flex justify-end col-span-3 mt-4">
            <span className="ml-3 inline-flex rounded-md shadow-sm">
              <Button
                buttonType="primary"
                type="submit"
                buttonSize="sm"
                disabled={isSubmitting || !isValid}
              >
                <ArrowDownTrayIcon className="size-4 mr-2" />
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
        </Form>
      )}
    </Formik>
  );
};

export default UserNotificationsPushover;
