'use client';
import type { User } from '@server/entity/User';
import { Form, Formik, Field } from 'formik';
import Button from '@app/components/Common/Button';
import Toast from '@app/components/Toast';
import {
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  InformationCircleIcon,
  XCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import Badge from '@app/components/Common/Badge';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import { availableLanguages } from '@app/context/LanguageContext';
import { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import * as Yup from 'yup';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
import Alert from '@app/components/Common/Alert';
import {
  subscribeToPushNotifications,
  unsubscribeToPushNotifications,
} from '@app/utils/pushSubscriptionHelpers';
import useSettings from '@app/hooks/useSettings';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { FormattedMessage, useIntl } from 'react-intl';

const ConfirmAccountForm = ({
  onComplete,
  user,
}: {
  user: User;
  onComplete: () => Promise<void> | void;
}) => {
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const { currentSettings } = useSettings();
  const { hasPermission: currentHasPermission, user: currentUser } = useUser();
  const intl = useIntl();
  // Fetch user settings data for initial values and global defaults
  const { data, error } = useSWR(
    user ? `/api/v1/user/${user.id}/settings/main` : null
  );
  // Fetch password status for this user
  const {
    data: passwordData,
    error: passwordError,
    mutate: revalidatePassword,
  } = useSWR(user ? `/api/v1/user/${user.id}/settings/password` : null);
  // Fetch notification settings
  const {
    data: notificationsData,
    error: notificationsError,
    mutate: revalidateNotifications,
  } = useSWR(user ? `/api/v1/user/${user.id}/settings/notifications` : null);
  const defaultLocale = data?.locale || 'en';

  // Password validation schema: make password fields optional
  const PasswordChangeSchema = Yup.object().shape({
    currentPassword: Yup.string().when(
      ['newPassword', 'confirmPassword'],
      (newPassword, confirmPassword) => {
        if (
          (!!newPassword || !!confirmPassword) &&
          passwordData?.hasPassword &&
          currentUser?.id === user?.id
        ) {
          return Yup.string().required(
            intl.formatMessage({
              id: 'userSettings.password.currentRequired',
              defaultMessage: 'You must provide your current password',
            })
          );
        }
        return Yup.string().optional();
      }
    ),
    newPassword: Yup.string()
      .min(
        8,
        intl.formatMessage({
          id: 'resetPassword.passwordTooShort',
          defaultMessage:
            'Password is too short; should be a minimum of 8 characters',
        })
      )
      .notRequired(),
    confirmPassword: Yup.string()
      .oneOf(
        [Yup.ref('newPassword'), null],
        intl.formatMessage({
          id: 'localSignup.passwordsMatch',
          defaultMessage: 'Passwords must match',
        })
      )
      .notRequired(),
  });
  const CombinedSchema = PasswordChangeSchema;

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
            id: 'confirmAccount.webPushEnabled',
            defaultMessage: 'Web Push Notifications Enabled',
          }),
          type: 'success',
          icon: <CheckBadgeIcon className="size-7" />,
        });
      } else {
        Toast({
          title: intl.formatMessage({
            id: 'confirmAccount.subscriptionFailed',
            defaultMessage: 'Failed to subscribe to web push notifications',
          }),
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
        });
      }
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'confirmAccount.webPushEnableError',
          defaultMessage: 'Failed to enable web push notifications',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
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
          id: 'confirmAccount.webPushDisabled',
          defaultMessage: 'Web push has been disabled',
        }),
        type: 'info',
        icon: <InformationCircleIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'confirmAccount.webPushDisableError',
          defaultMessage: 'Failed to disable web push notifications',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
    }
  };

  // Only render form if user and all settings are loaded and user is authed
  if (
    !user ||
    !currentUser ||
    (!data && !error) ||
    (!passwordData && !passwordError) ||
    (!notificationsData && !notificationsError)
  ) {
    return <LoadingEllipsis />;
  }

  return (
    <Formik
      initialValues={{
        displayName: data?.username ?? user?.username ?? '',
        locale: data?.locale ?? '',
        inviteQuotaLimit:
          data?.inviteQuotaLimit ?? data?.globalInviteQuotaLimit ?? 1,
        inviteQuotaDays:
          data?.inviteQuotaDays ?? data?.globalInviteQuotaDays ?? 0,
        sharedLibraries:
          data?.sharedLibraries && data?.sharedLibraries !== ''
            ? data.sharedLibraries
            : 'server',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        emailTypes:
          notificationsData?.notificationTypes?.email ?? ALL_NOTIFICATIONS,
        webpushTypes:
          notificationsData?.notificationTypes?.webpush ?? ALL_NOTIFICATIONS,
      }}
      enableReinitialize
      validationSchema={CombinedSchema}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          // Save general settings
          await axios.post(`/api/v1/user/${user.id}/settings/main`, {
            username: values.displayName,
            locale: values.locale,
            sharedLibraries: values.sharedLibraries
              ? values.sharedLibraries
              : null,
          });
          // Save password settings only if newPassword is filled
          if (values.newPassword) {
            await axios.post(`/api/v1/user/${user.id}/settings/password`, {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
              confirmPassword: values.confirmPassword,
            });
          }
          // Save notification settings (only notification types)
          await axios.post(`/api/v1/user/${user.id}/settings/notifications`, {
            notificationTypes: {
              email: values.emailTypes,
              webpush: values.webpushTypes,
            },
          });
          Toast({
            title: intl.formatMessage({
              id: 'confirmAccount.settingsSaved',
              defaultMessage: 'Account settings saved successfully!',
            }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
          await onComplete();
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'confirmAccount.error',
              defaultMessage: 'Failed to confirm account.',
            }),
            message: e.message,
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        } finally {
          setSubmitting(false);
          revalidatePassword();
          revalidateNotifications();
          resetForm();
        }
      }}
    >
      {({
        isSubmitting,
        values,
        errors,
        touched,
        setFieldValue,
        setFieldTouched,
      }) => (
        <Form>
          <div className="max-w-6xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <div className="col-span-1">
                <FormattedMessage
                  id="settings.accountType"
                  defaultMessage="Account Type"
                />
              </div>
              <div className="mb-1 text-sm font-medium leading-5 text-gray-400 sm:mt-2">
                <div className="flex max-w-lg items-center">
                  {user?.userType === UserType.PLEX ? (
                    <Badge badgeType="warning">
                      <FormattedMessage
                        id="common.plexUser"
                        defaultMessage="Plex User"
                      />
                    </Badge>
                  ) : (
                    <Badge badgeType="default">
                      <FormattedMessage
                        id="common.localUser"
                        defaultMessage="Local User"
                      />
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <div className="col-span-1">
                <FormattedMessage id="common.role" defaultMessage="Role" />
              </div>
              <div className="mb-1 text-sm font-medium leading-5 text-gray-400 sm:mt-2">
                <div className="flex max-w-lg items-center">
                  {user?.id === 1
                    ? intl.formatMessage({
                        id: 'common.owner',
                        defaultMessage: 'Owner',
                      })
                    : currentHasPermission(Permission.ADMIN)
                      ? intl.formatMessage({
                          id: 'common.admin',
                          defaultMessage: 'Admin',
                        })
                      : intl.formatMessage({
                          id: 'common.user',
                          defaultMessage: 'User',
                        })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="displayName" className="col-span-1">
                <FormattedMessage
                  id="common.displayName"
                  defaultMessage="Display Name"
                />
              </label>
              <div className="col-span-2">
                <Field
                  id="displayName"
                  name="displayName"
                  type="text"
                  className="input input-primary input-sm w-full"
                  placeholder={
                    user?.plexUsername ? user.plexUsername : user?.email
                  }
                />
                {errors.displayName &&
                  touched.displayName &&
                  typeof errors.displayName === 'string' && (
                    <div className="error">{errors.displayName}</div>
                  )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="locale" className="col-span-1">
                <FormattedMessage
                  id="common.displayLanguage"
                  defaultMessage="Display Language"
                />
              </label>
              <div className="col-span-2">
                <Field
                  as="select"
                  id="locale"
                  name="locale"
                  className="select select-primary select-sm w-full"
                >
                  <option value="" lang={defaultLocale}>
                    {intl.formatMessage({
                      id: 'common.default',
                      defaultMessage: 'Default',
                    })}{' '}
                    ({availableLanguages[defaultLocale]?.display})
                  </option>
                  {Object.keys(availableLanguages).map((key) => (
                    <option
                      key={key}
                      value={availableLanguages[key].code}
                      lang={availableLanguages[key].code}
                    >
                      {availableLanguages[key].display}
                    </option>
                  ))}
                </Field>
              </div>
            </div>
            {currentSettings?.localLogin && (
              <div className="mb-6 mt-3">
                <h3 className="text-2xl font-extrabold mb-2">
                  <FormattedMessage
                    id="common.password"
                    defaultMessage="Password"
                  />
                </h3>
                {!passwordData.hasPassword && (
                  <Alert
                    type="warning"
                    title={intl.formatMessage({
                      id: 'confirmAccount.plexOAuthWarning',
                      defaultMessage:
                        'Your account currently uses Plex OAuth to authenticate. Optionally configure a password below to enable sign-in as a "local user" using your email address.',
                    })}
                  />
                )}
                <div className="max-w-6xl space-y-5">
                  {passwordData.hasPassword && user?.id === currentUser?.id && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 pb-6">
                      <label htmlFor="currentPassword" className="col-span-1">
                        <FormattedMessage
                          id="common.currentPassword"
                          defaultMessage="Current Password"
                        />
                      </label>
                      <div className="col-span-2">
                        <div className="flex">
                          <SensitiveInput
                            as="field"
                            id="currentPassword"
                            buttonSize="sm"
                            name="currentPassword"
                            className="input input-sm input-primary w-full"
                          />
                        </div>
                        {errors.currentPassword &&
                          touched.currentPassword &&
                          typeof errors.currentPassword === 'string' && (
                            <div className="text-error">
                              {errors.currentPassword}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                    <label htmlFor="newPassword" className="col-span-1">
                      <FormattedMessage
                        id="common.newPassword"
                        defaultMessage="New Password"
                      />
                    </label>
                    <div className="col-span-2">
                      <div className="flex">
                        <SensitiveInput
                          as="field"
                          id="newPassword"
                          buttonSize="sm"
                          name="newPassword"
                          className="input input-sm input-primary w-full"
                        />
                      </div>
                      {errors.newPassword &&
                        touched.newPassword &&
                        typeof errors.newPassword === 'string' && (
                          <div className="text-error">{errors.newPassword}</div>
                        )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                    <label htmlFor="confirmPassword" className="col-span-1">
                      <FormattedMessage
                        id="common.confirmPassword"
                        defaultMessage="Confirm Password"
                      />
                    </label>
                    <div className="col-span-2">
                      <div className="flex">
                        <SensitiveInput
                          as="field"
                          id="confirmPassword"
                          buttonSize="sm"
                          name="confirmPassword"
                          className="input input-sm input-primary w-full"
                        />
                      </div>
                      {errors.confirmPassword &&
                        touched.confirmPassword &&
                        typeof errors.confirmPassword === 'string' && (
                          <div className="text-error">
                            {errors.confirmPassword}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-6 mt-3">
              <h3 className="text-2xl font-extrabold mb-2">
                <FormattedMessage
                  id="settings.notifications"
                  defaultMessage="Notification Settings"
                />
              </h3>
              <h4 className="text-xl font-semibold mb-1">
                <FormattedMessage id="common.email" defaultMessage="Email" />
              </h4>
              <div className="max-w-6xl space-y-2">
                <NotificationTypeSelector
                  user={user}
                  currentTypes={values.emailTypes}
                  onUpdate={(newTypes) => {
                    setFieldValue('emailTypes', newTypes);
                    setFieldTouched('emailTypes');
                  }}
                  error={
                    errors.emailTypes && touched.emailTypes
                      ? (errors.emailTypes as string)
                      : undefined
                  }
                />
                <h4 className="text-xl font-semibold mb-1">
                  <FormattedMessage
                    id="common.webPush"
                    defaultMessage="Web Push"
                  />
                </h4>
                <div className="flex col-span-3 mt-4">
                  <span className="inline-flex rounded-md shadow-sm">
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
                        {webPushEnabled
                          ? intl.formatMessage({
                              id: 'confirmAccount.disableWebPush',
                              defaultMessage: 'Disable Web Push',
                            })
                          : intl.formatMessage({
                              id: 'confirmAccount.enableWebPush',
                              defaultMessage: 'Enable Web Push',
                            })}
                      </span>
                    </Button>
                  </span>
                </div>
                <NotificationTypeSelector
                  user={user}
                  currentTypes={values.webpushTypes}
                  onUpdate={(newTypes) => {
                    setFieldValue('webpushTypes', newTypes);
                    setFieldTouched('webpushTypes');
                  }}
                  error={
                    errors.webpushTypes && touched.webpushTypes
                      ? (errors.webpushTypes as string)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            buttonType="primary"
            className="w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? intl.formatMessage({
                  id: 'confirmAccount.finalizingAccount',
                  defaultMessage: 'Finalizing Account...',
                })
              : intl.formatMessage({
                  id: 'signUp.confirmAccount',
                  defaultMessage: 'Confirm Account',
                })}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default ConfirmAccountForm;
