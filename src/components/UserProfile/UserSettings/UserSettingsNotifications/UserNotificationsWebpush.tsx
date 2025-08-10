'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
import Toast from '@app/components/Toast';
import DeviceItem from '@app/components/UserProfile/UserSettings/UserSettingsNotifications/DeviceItem';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import {
  getPushSubscription,
  subscribeToPushNotifications,
  unsubscribeToPushNotifications,
  verifyPushSubscription,
} from '@app/utils/pushSubscriptionHelpers';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

const UserWebPushSettings = () => {
  const intl = useIntl();
  const searchParams = useParams<{ userid: string }>();
  const { user } = useUser({ id: Number(searchParams.userid) });
  const { currentSettings } = useSettings();
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [subEndpoint, setSubEndpoint] = useState<string | null>(null);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );
  const { data: dataDevices, mutate: revalidateDevices } = useSWR<
    {
      endpoint: string;
      p256dh: string;
      auth: string;
      userAgent: string;
      createdAt: Date;
    }[]
  >(`/api/v1/user/${user?.id}/pushSubscriptions`, { revalidateOnMount: true });

  // Subscribes to the push manager
  // Will only add to the database if subscribing for the first time
  const enablePushNotifications = async () => {
    try {
      const isSubscribed = await subscribeToPushNotifications(
        user?.id,
        currentSettings
      );

      if (isSubscribed) {
        localStorage.setItem('pushNotificationsEnabled', 'true');
        setWebPushEnabled(true);
        Toast({
          title: intl.formatMessage({
            id: 'userSettings.notifications.webpushEnabled',
            defaultMessage: 'Web push has been enabled.',
          }),
          type: 'success',
          icon: <CheckBadgeIcon className="size-7" />,
        });
      } else {
        throw new Error('Subscription failed');
      }
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.notifications.webpushEnableError',
          defaultMessage: 'Something went wrong while enabling web push.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidateDevices();
    }
  };

  // Unsubscribes from the push manager
  // Deletes/disables corresponding push subscription from database
  const disablePushNotifications = async (endpoint?: string) => {
    try {
      await unsubscribeToPushNotifications(user?.id, endpoint);

      localStorage.setItem('pushNotificationsEnabled', 'false');
      setWebPushEnabled(false);
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.notifications.webpushDisabled',
          defaultMessage: 'Web push has been disabled.',
        }),
        type: 'info',
        icon: <InformationCircleIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.notifications.webpushDisableError',
          defaultMessage: 'Something went wrong while disabling web push.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidateDevices();
    }
  };

  const deletePushSubscriptionFromBackend = async (endpoint: string) => {
    try {
      await axios.delete(
        `/api/v1/user/${user?.id}/pushSubscription/${encodeURIComponent(
          endpoint
        )}`
      );

      Toast({
        title: intl.formatMessage({
          id: 'userSettings.notifications.subscriptionDeleted',
          defaultMessage: 'Subscription Deleted Successfully.',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'userSettings.notifications.subscriptionDeleteError',
          defaultMessage:
            'Something went wrong while deleting the user subscription.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidateDevices();
    }
  };

  useEffect(() => {
    const verifyWebPush = async () => {
      const enabled = await verifyPushSubscription(user?.id, currentSettings);
      setWebPushEnabled(enabled);
    };

    if (user?.id) {
      verifyWebPush();
    }
  }, [user?.id, currentSettings]);

  useEffect(() => {
    const getSubscriptionEndpoint = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const { subscription } = await getPushSubscription();

        if (subscription) {
          setSubEndpoint(subscription.endpoint);
        } else {
          setSubEndpoint(null);
        }
      }
    };

    getSubscriptionEndpoint();
  }, [webPushEnabled]);

  useEffect(() => {
    const checkActiveSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const { subscription } = await getPushSubscription();
        setWebPushEnabled(!!subscription);
      }
    };
    checkActiveSubscription();
  }, [webPushEnabled]);

  const sortedDevices = useMemo(() => {
    if (!dataDevices || !subEndpoint) {
      return dataDevices;
    }

    return [...dataDevices].sort((a, b) => {
      if (a.endpoint === subEndpoint) {
        return -1;
      }
      if (b.endpoint === subEndpoint) {
        return 1;
      }

      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [dataDevices, subEndpoint]);

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <>
      <Formik
        initialValues={{
          types: data?.notificationTypes.webpush ?? ALL_NOTIFICATIONS,
        }}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            await axios.post(
              `/api/v1/user/${user?.id}/settings/notifications`,
              {
                pgpKey: data?.pgpKey,
                notificationTypes: {
                  webpush: values.types,
                },
              }
            );
            mutate('/api/v1/settings/public');
            Toast({
              title: intl.formatMessage({
                id: 'webpushNotifications.saveSuccess',
                defaultMessage:
                  'Web push notification settings saved successfully!',
              }),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch (e) {
            Toast({
              title: intl.formatMessage({
                id: 'webpushNotifications.saveError',
                defaultMessage:
                  'Web push notification settings failed to save.',
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
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType={`${webPushEnabled ? 'error' : 'primary'}`}
                    type="button"
                    buttonSize="sm"
                    onClick={() =>
                      webPushEnabled
                        ? disablePushNotifications()
                        : enablePushNotifications()
                    }
                  >
                    {webPushEnabled ? (
                      <CloudArrowDownIcon className="size-4 mr-2" />
                    ) : (
                      <CloudArrowUpIcon className="size-4 mr-2" />
                    )}
                    <span>
                      {webPushEnabled ? (
                        <FormattedMessage
                          id="userSettings.notifications.disableWebPush"
                          defaultMessage="Disable web push"
                        />
                      ) : (
                        <FormattedMessage
                          id="userSettings.notifications.enableWebPush"
                          defaultMessage="Enable web push"
                        />
                      )}
                    </span>
                  </Button>
                </span>
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
                        <FormattedMessage id="common.saving" />
                      ) : (
                        <FormattedMessage id="common.saveChanges" />
                      )}
                    </span>
                  </Button>
                </span>
              </div>
            </Form>
          );
        }}
      </Formik>
      <div className="mt-10 mb-6">
        <h3 className="text-2xl font-extrabold mb-2">
          <FormattedMessage
            id="userSettings.manageDevices"
            defaultMessage="Manage Devices"
          />
        </h3>
        <div className="section">
          {sortedDevices?.length ? (
            sortedDevices.map((device) => (
              <div className="py-2" key={`device-list-${device.endpoint}`}>
                <DeviceItem
                  deletePushSubscriptionFromBackend={
                    deletePushSubscriptionFromBackend
                  }
                  device={device}
                  subEndpoint={subEndpoint}
                />
              </div>
            ))
          ) : (
            <>
              <Alert
                title={
                  <FormattedMessage
                    id="userSettings.noWebPushSubscriptions"
                    defaultMessage="You have no web push subscriptions to show."
                  />
                }
                type="info"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UserWebPushSettings;
