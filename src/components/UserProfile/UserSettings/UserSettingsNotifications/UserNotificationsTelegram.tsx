'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
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

const UserNotificationsTelegram = () => {
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
    telegramChatId: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.telegram.chatIdRequired',
        defaultMessage: 'You must provide your Telegram chat ID',
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
        telegramChatId: data?.telegramChatId ?? '',
        telegramMessageThreadId: data?.telegramMessageThreadId ?? '',
        telegramSendSilently: data?.telegramSendSilently ?? false,
        types: data?.notificationTypes.telegram ?? ALL_NOTIFICATIONS,
      }}
      validationSchema={schema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            telegramChatId: values.telegramChatId,
            telegramMessageThreadId: values.telegramMessageThreadId,
            telegramSendSilently: values.telegramSendSilently,
            notificationTypes: {
              telegram: values.types,
            },
          });

          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveSuccess',
                defaultMessage:
                  '{provider} notification settings saved successfully!',
              },
              { provider: 'Telegram' }
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
              { provider: 'Telegram' }
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
        <Form className="section">
          <div className="max-w-6xl space-y-5">
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="telegramChatId" className="col-span-1">
                <FormattedMessage
                  id="userSettings.notifications.telegramChatId"
                  defaultMessage="Chat ID"
                />
              </label>
              <div className="col-span-2">
                <Field
                  id="telegramChatId"
                  name="telegramChatId"
                  className="input input-sm input-primary w-full rounded-md"
                />
                {errors.telegramChatId && touched.telegramChatId && (
                  <div className="text-error">{errors.telegramChatId}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="telegramMessageThreadId" className="col-span-1">
                <FormattedMessage
                  id="userSettings.notifications.telegramMessageThreadId"
                  defaultMessage="Message Thread ID"
                />
              </label>
              <div className="col-span-2">
                <Field
                  id="telegramMessageThreadId"
                  name="telegramMessageThreadId"
                  className="input input-sm input-primary w-full rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="telegramSendSilently" className="col-span-1">
                <FormattedMessage
                  id="userSettings.notifications.telegramSendSilently"
                  defaultMessage="Send Silently"
                />
              </label>
              <div className="col-span-2">
                <Field
                  id="telegramSendSilently"
                  name="telegramSendSilently"
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary rounded-md"
                />
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
          <div className="divider divider-primary col-span-full mb-0" />
          <div className="col-span-3 mt-4 flex justify-end">
            <span className="ml-3 inline-flex rounded-md shadow-sm">
              <Button
                buttonType="primary"
                type="submit"
                buttonSize="sm"
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
        </Form>
      )}
    </Formik>
  );
};

export default UserNotificationsTelegram;
