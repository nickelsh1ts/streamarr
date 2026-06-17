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
import { Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const UserNotificationsDiscord = () => {
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
    discordId: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.discord.idRequired',
          defaultMessage: 'You must provide your Discord user ID',
        })
      )
      .matches(
        /^\d{17,20}$/,
        intl.formatMessage({
          id: 'notifications.discord.idInvalid',
          defaultMessage: 'You must provide a valid Discord user ID',
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
        discordId: data?.discordId ?? '',
        types: data?.notificationTypes.discord ?? ALL_NOTIFICATIONS,
      }}
      validationSchema={schema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            discordId: values.discordId,
            notificationTypes: {
              discord: values.types,
            },
          });

          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveSuccess',
                defaultMessage:
                  '{provider} notification settings saved successfully!',
              },
              { provider: 'Discord' }
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
              { provider: 'Discord' }
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
          <div className="max-w-6xl space-y-4">
            <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
              <label htmlFor="discordId" className="col-span-1">
                <FormattedMessage
                  id="userSettings.notifications.discordId"
                  defaultMessage="Discord User ID"
                />
              </label>
              <div className="col-span-2">
                <input
                  id="discordId"
                  name="discordId"
                  className="input input-sm input-primary w-full rounded-md"
                  value={values.discordId}
                  onChange={(e) => setFieldValue('discordId', e.target.value)}
                  onBlur={() => setFieldTouched('discordId')}
                />
                {errors.discordId && touched.discordId && (
                  <div className="text-error">{errors.discordId}</div>
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

export default UserNotificationsDiscord;
