'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast, { dismissToast } from '@app/components/Toast';
import { BeakerIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useIntl, FormattedMessage } from 'react-intl';

const WebpushNotifications = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);
  const [isHttps, setIsHttps] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/webpush');

  useEffect(() => {
    setIsHttps(window.location.protocol.startsWith('https'));
  }, []);

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
            <Form className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
              <label htmlFor="preset">
                <FormattedMessage
                  id="emailNotifications.enableAgent"
                  defaultMessage="Enable Agent"
                />
                <span className="ml-1 text-error">*</span>
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
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-full mt-4">
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
                    <BeakerIcon className="size-5 mr-2" />
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
                    <ArrowDownTrayIcon className="size-5 mr-2" />
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
    </>
  );
};
export default WebpushNotifications;
