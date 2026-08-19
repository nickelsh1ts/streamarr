'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast, { dismissToast } from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  BeakerIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';

const InAppNotifications = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/inapp');

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data?.enabled ?? false,
        retentionLimit: data?.options?.retentionLimit ?? 1,
        retentionTime: data?.options?.retentionTime ?? 'years',
      }}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/inapp', {
            enabled: values.enabled,
            options: {
              retentionLimit: values.retentionLimit,
              retentionTime: values.retentionTime,
            },
          });
          mutate('/api/v1/settings/public');
          Toast({
            title: intl.formatMessage({
              id: 'inAppNotifications.saveSuccess',
              defaultMessage:
                'In-app notification settings saved successfully.',
            }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        } catch {
          Toast({
            title: intl.formatMessage({
              id: 'inAppNotifications.saveError',
              defaultMessage: 'In App notification settings failed to save.',
            }),
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        const testSettings = async () => {
          setIsTesting(true);
          let toastId: string | undefined;
          try {
            Toast(
              {
                title: intl.formatMessage({
                  id: 'inAppNotifications.testSending',
                  defaultMessage: 'Sending In App test notification…',
                }),
                type: 'warning',
                icon: <BeakerIcon className="size-7" />,
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post('/api/v1/settings/notifications/inapp/test', {
              enabled: true,
              options: {},
            });
            if (toastId) dismissToast(toastId);
          } catch {
            if (toastId) dismissToast(toastId);
            Toast({
              title: intl.formatMessage({
                id: 'inAppNotifications.testError',
                defaultMessage: 'In App test notification failed to send.',
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
            <div className="max-w-5xl space-y-4">
              <div className="space-y-4 sm:grid sm:grid-cols-3 sm:items-center">
                <label htmlFor="enabled">
                  <FormattedMessage
                    id="notifications.enableAgent"
                    defaultMessage="Enable Agent"
                  />
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="flex">
                    <Field
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      className="checkbox checkbox-sm checkbox-primary rounded-md"
                    />
                  </div>
                </div>
                <label htmlFor="retentionAge">
                  <FormattedMessage
                    id="notifications.retentionAge"
                    defaultMessage="Retention Age"
                  />
                  <span className="text-error ml-1">*</span>
                  <span className="text-neutral block text-sm">
                    <FormattedMessage
                      id="inAppNotifications.retentionAgeDescription"
                      defaultMessage="The maximum age of in-app notifications before they are automatically deleted."
                    />
                  </span>
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="flex">
                    <div className="col-span-2 space-x-2">
                      <Field
                        as="select"
                        name="retentionLimit"
                        id="retentionLimit"
                        className="select select-sm select-primary w-auto min-w-20 shrink-0 rounded-md"
                        onChange={(e) =>
                          setFieldValue(
                            'retentionLimit',
                            Number(e.target.value)
                          )
                        }
                      >
                        <option id={`retention-forever`} value={0}>
                          <FormattedMessage
                            id="common.forever"
                            defaultMessage="Forever"
                          />
                        </option>
                        {[...Array(100)].map((_item, i) => (
                          <option
                            id={`retention-${i + 1}`}
                            value={i + 1}
                            key={`$retention-${i + 1}`}
                          >
                            {i + 1}
                          </option>
                        ))}
                      </Field>
                      {values.retentionLimit > 0 && (
                        <Field
                          as="select"
                          name="retentionTime"
                          id="retentionTime"
                          className="select select-sm select-primary w-auto min-w-20 shrink-0 rounded-md"
                          onChange={(e) =>
                            setFieldValue('retentionTime', e.target.value)
                          }
                        >
                          <option id={`retention-days`} value={'days'}>
                            <FormattedMessage
                              id="common.day"
                              defaultMessage="{count, plural, one {Day} other {Days}}"
                              values={{ count: values.retentionLimit }}
                            />
                          </option>
                          <option id={`retention-weeks`} value={'weeks'}>
                            <FormattedMessage
                              id="common.week"
                              defaultMessage="{count, plural, one {Week} other {Weeks}}"
                              values={{ count: values.retentionLimit }}
                            />
                          </option>
                          <option id={`retention-months`} value={'months'}>
                            <FormattedMessage
                              id="common.month"
                              defaultMessage="{count, plural, one {Month} other {Months}}"
                              values={{ count: values.retentionLimit }}
                            />
                          </option>
                          <option id={`retention-years`} value={'years'}>
                            <FormattedMessage
                              id="common.year"
                              defaultMessage="{count, plural, one {Year} other {Years}}"
                              values={{ count: values.retentionLimit }}
                            />
                          </option>
                        </Field>
                      )}
                    </div>
                  </div>
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
                    <FormattedMessage id="common.test" defaultMessage="Test" />
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
  );
};
export default InAppNotifications;
