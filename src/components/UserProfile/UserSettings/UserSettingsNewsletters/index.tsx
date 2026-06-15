'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toggle from '@app/components/Common/Toggle';
import Toast from '@app/components/Toast';
import { useUser } from '@app/hooks/useUser';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  CheckIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type { UserSettingsNewslettersResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const UserNewsletterSettings = () => {
  const intl = useIntl();
  const { userid } = useParams<{ userid: string }>();
  const { user } = useUser({ id: Number(userid) });
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsNewslettersResponse>(
    user ? `/api/v1/user/${user.id}/settings/newsletters` : null
  );

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <Formik
      enableReinitialize
      initialValues={{
        subscriptions: (data?.newsletters ?? []).reduce<
          Record<number, boolean>
        >((acc, newsletter) => {
          acc[newsletter.id] = newsletter.subscribed;
          return acc;
        }, {}),
      }}
      onSubmit={async (values) => {
        try {
          const unsubscribed = Object.entries(values.subscriptions)
            .filter(([, subscribed]) => !subscribed)
            .map(([id]) => Number(id));

          await axios.post(`/api/v1/user/${user?.id}/settings/newsletters`, {
            unsubscribed,
          });

          Toast({
            title: intl.formatMessage({
              id: 'newsletterSettings.saveSuccess',
              defaultMessage: 'Newsletter preferences saved successfully!',
            }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'newsletterSettings.saveError',
              defaultMessage: 'Newsletter preferences failed to save.',
            }),
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
            message: e instanceof Error ? e.message : undefined,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        return (
          <Form className="mt-3">
            <div className="max-w-2xl">
              <div className="mb-2">
                <h3 className="text-2xl font-extrabold">
                  <FormattedMessage
                    id="newsletterSettings.title"
                    defaultMessage="Newsletter Subscriptions"
                  />
                </h3>
              </div>
              {(data?.newsletters ?? [])
                .slice()
                .sort((a, b) => Number(b.isImportant) - Number(a.isImportant))
                .map((newsletter) => (
                  <div
                    key={`newsletter-sub-${newsletter.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 py-3"
                  >
                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        <span className="">{newsletter.name}</span>
                        {newsletter.isImportant && (
                          <Badge badgeType="error" className="uppercase">
                            <FormattedMessage
                              id="common.required"
                              defaultMessage="Required"
                            />
                          </Badge>
                        )}
                      </div>
                      {newsletter.description && (
                        <p className="mt-0.5 max-w-prose text-sm text-neutral">
                          {newsletter.description}
                        </p>
                      )}
                    </div>
                    {newsletter.isImportant ? (
                      <span
                        id={`newsletter-${newsletter.id}`}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={true}
                        className={`${
                          true ? 'bg-primary' : 'bg-neutral'
                        } relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring opacity-60 cursor-not-allowed`}
                        aria-disabled={true}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            true ? 'translate-x-5' : 'translate-x-0'
                          } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                        >
                          <span
                            className={`${
                              true
                                ? 'opacity-0 duration-100 ease-out'
                                : 'opacity-100 duration-200 ease-in'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <XMarkIcon className="h-3 w-3 text-neutral" />
                          </span>
                          <span
                            className={`${
                              true
                                ? 'opacity-100 duration-200 ease-in'
                                : 'opacity-0 duration-100 ease-out'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <CheckIcon className="h-3 w-3 text-primary" />
                          </span>
                        </span>
                      </span>
                    ) : (
                      <Toggle
                        id={`newsletter-${newsletter.id}`}
                        valueOf={values.subscriptions[newsletter.id] ?? true}
                        onClick={() =>
                          setFieldValue('subscriptions', {
                            ...values.subscriptions,
                            [newsletter.id]: !(
                              values.subscriptions[newsletter.id] ?? true
                            ),
                          })
                        }
                      />
                    )}
                  </div>
                ))}
            </div>
            <div className="divider divider-primary mb-0" />
            <div className="flex justify-end mt-4">
              <span className="ml-3 inline-flex rounded-md shadow-sm">
                <Button
                  buttonType="primary"
                  type="submit"
                  buttonSize="sm"
                  disabled={isSubmitting}
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
        );
      }}
    </Formik>
  );
};

export default UserNewsletterSettings;
