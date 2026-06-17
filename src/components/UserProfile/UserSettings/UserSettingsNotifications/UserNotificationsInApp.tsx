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

const UserInAppSettings = () => {
  const intl = useIntl();
  const { userid } = useParams<{ userid: string }>();
  const { user } = useUser({ id: Number(userid) });
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <Formik
      initialValues={{
        types: data?.notificationTypes.inApp ?? ALL_NOTIFICATIONS,
      }}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            notificationTypes: {
              inApp: values.types,
            },
          });
          Toast({
            title: intl.formatMessage({
              id: 'inAppNotifications.saveSuccess',
              defaultMessage:
                'In-app notification settings saved successfully.',
            }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'inAppNotifications.saveError',
              defaultMessage: 'In App notification settings failed to save.',
            }),
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
        errors,
        touched,
        isSubmitting,
        isValid,
        values,
        setFieldValue,
        setFieldTouched,
      }) => {
        return (
          <Form className="section">
            <NotificationTypeSelector
              user={user}
              currentTypes={values.types}
              onUpdate={(newTypes) => {
                setFieldValue('types', newTypes);
                setFieldTouched('types');
              }}
              error={
                errors.types && touched.types
                  ? (errors.types as string)
                  : undefined
              }
            />
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
        );
      }}
    </Formik>
  );
};

export default UserInAppSettings;
