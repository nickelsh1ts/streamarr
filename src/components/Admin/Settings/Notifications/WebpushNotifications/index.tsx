'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast, { dismissToast } from '@app/components/Toast';
import { useClientValue } from '@app/hooks/useIsClient';
import { ArrowDownTrayIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';

const WebpushNotifications = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);
  const isHttps = useClientValue(
    () => window.location.protocol.startsWith('https'),
    false
  );
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/webpush');

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <>
      {!isHttps && (
        <Alert
          title={intl.formatMessage({
            id: 'webpushNotifications.httpsRequired',
            defaultMessage:
              'In order to receive web push notifications, Streamarr must be served over HTTPS.',
          })}
          type="warning"
        />
      )}
      <Formik
        initialValues={{
          enabled: data.enabled,
        }}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/notifications/webpush', {
              enabled: values.enabled,
              options: {},
            });
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
          } catch {
            Toast({
              title: intl.formatMessage({
                id: 'webpushNotifications.saveError',
                defaultMessage:
                  'Web push notification settings failed to save.',
              }),
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidate();
          }
        }}
      >
        {({ isSubmitting }) => {
          const testSettings = async () => {
            setIsTesting(true);
            let toastId: string | undefined;
            try {
              Toast(
                {
                  title: intl.formatMessage({
                    id: 'webpushNotifications.testSending',
                    defaultMessage: 'Sending web push test notification…',
                  }),
                  type: 'warning',
                  icon: <BeakerIcon className="size-7" />,
                },
                (id) => {
                  toastId = id;
                }
              );
              await axios.post('/api/v1/settings/notifications/webpush/test', {
                enabled: true,
                options: {},
              });
              if (toastId) dismissToast(toastId);
              Toast({
                title: intl.formatMessage({
                  id: 'webpushNotifications.testSuccess',
                  defaultMessage: 'Web push test notification sent!',
                }),
                type: 'success',
                icon: <CheckBadgeIcon className="size-7" />,
              });
            } catch {
              if (toastId) dismissToast(toastId);
              Toast({
                title: intl.formatMessage({
                  id: 'webpushNotifications.testError',
                  defaultMessage: 'Web push test notification failed to send.',
                }),
                type: 'error',
                icon: <XCircleIcon className="size-7" />,
              });
            } finally {
              setIsTesting(false);
            }
          };

          return (
            <Form className="mt-5">
              <div className="max-w-5xl max-sm:space-y-4 max-sm:space-y-reverse sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
                <label htmlFor="preset">
                  <FormattedMessage
                    id="notifications.enableAgent"
                    defaultMessage="Enable Agent"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      className="checkbox checkbox-sm checkbox-primary rounded-md"
                    />
                  </div>
                </div>
              </div>
              <div className="divider divider-primary col-span-full mb-0" />
              <div className="col-span-full mt-4 flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonSize="sm"
                    buttonType="warning"
                    disabled={isSubmitting || isTesting}
                    onClick={(e) => {
                      e.preventDefault();
                      testSettings();
                    }}
                    className="disabled:bg-warning/30"
                  >
                    <BeakerIcon className="mr-2 size-5" />
                    <span>
                      <FormattedMessage
                        id="common.test"
                        defaultMessage="Test"
                      />
                    </span>
                  </Button>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonSize="sm"
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || isTesting}
                  >
                    <ArrowDownTrayIcon className="mr-2 size-5" />
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
    </>
  );
};
export default WebpushNotifications;
