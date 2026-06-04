'use client';
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
import { Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const UserNotificationsPushbullet = () => {
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

  const schema = Yup.object().shape({
    pushbulletAccessToken: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.pushbullet.accessTokenRequired',
        defaultMessage: 'You must provide your Pushbullet access token',
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
        pushbulletAccessToken: data?.pushbulletAccessToken ?? '',
        types: data?.notificationTypes.pushbullet ?? ALL_NOTIFICATIONS,
      }}
      validationSchema={schema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            pushbulletAccessToken: values.pushbulletAccessToken,
            notificationTypes: {
              pushbullet: values.types,
            },
          });

          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveSuccess',
                defaultMessage:
                  '{provider} notification settings saved successfully!',
              },
              { provider: 'Pushbullet' }
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
              { provider: 'Pushbullet' }
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
              <label htmlFor="pushbulletAccessToken" className="col-span-1">
                <FormattedMessage
                  id="userSettings.notifications.pushbulletAccessToken"
                  defaultMessage="Access Token"
                />
              </label>
              <div className="col-span-2">
                <div className="flex">
                  <SensitiveInput
                    as="field"
                    id="pushbulletAccessToken"
                    name="pushbulletAccessToken"
                    buttonSize="sm"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.pushbulletAccessToken &&
                  touched.pushbulletAccessToken && (
                    <div className="text-error">
                      {errors.pushbulletAccessToken}
                    </div>
                  )}
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

export default UserNotificationsPushbullet;
