'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
import Toast from '@app/components/Toast';
import { useUser } from '@app/hooks/useUser';
import { ArrowDownTrayIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { FormattedMessage } from 'react-intl';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const UserInAppSettings = () => {
  const intl = useIntl();
  const searchParams = useParams<{ userid: string }>();
  const { user } = useUser({ id: Number(searchParams.userid) });
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
            icon: <CheckBadgeIcon className="size-7" />,
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
                        defaultMessage="Saving..."
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
