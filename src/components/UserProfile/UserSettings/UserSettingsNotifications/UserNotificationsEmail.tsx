'use client';
import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import { useUser } from '@app/hooks/useUser';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Form, Formik } from 'formik';
import useSWR from 'swr';
import * as Yup from 'yup';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'next/navigation';

const UserEmailSettings = () => {
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

  const UserNotificationsEmailSchema = Yup.object().shape({
    pgpKey: Yup.string()
      .nullable()
      .matches(
        /-----BEGIN PGP PUBLIC KEY BLOCK-----.+-----END PGP PUBLIC KEY BLOCK-----/,
        'You must provide a valid PGP public key'
      ),
  });

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <Formik
      initialValues={{
        pgpKey: data?.pgpKey ?? '',
        types: data?.notificationTypes.email ?? ALL_NOTIFICATIONS,
      }}
      validationSchema={UserNotificationsEmailSchema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            pgpKey: values.pgpKey,
            notificationTypes: {
              email: values.types,
            },
          });
          Toast({
            title: intl.formatMessage({
              id: 'emailNotifications.saveSuccess',
              defaultMessage: 'Email notification settings saved successfully!',
            }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'emailNotifications.saveError',
              defaultMessage: 'Email notification settings failed to save.',
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
          <Form className="mt-5">
            <div className="max-w-6xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="pgpKey" className="col-span-1">
                  <span className="mr-2">
                    <FormattedMessage
                      id="userSettings.pgpPublicKey"
                      defaultMessage="PGP Public Key"
                    />
                  </span>
                  <SettingsBadge badgeType="advanced" />
                  <p className="text-sm text-neutral">
                    <FormattedMessage
                      id="userSettings.pgpPublicKeyDescription"
                      defaultMessage="Encrypt email messages using {openPGP}."
                      values={{
                        openPGP: (
                          <a
                            href="https://www.openpgp.org/"
                            target="_blank"
                            rel="noreferrer"
                          >
                            OpenPGP
                          </a>
                        ),
                      }}
                    />
                  </p>
                </label>
                <div className="col-span-2">
                  <div className="flex">
                    <SensitiveInput
                      as="field"
                      id="pgpKey"
                      buttonSize="sm"
                      name="pgpKey"
                      className="font-mono text-xs input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.pgpKey &&
                    touched.pgpKey &&
                    typeof errors.pgpKey === 'string' && (
                      <div className="text-error">{errors.pgpKey}</div>
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
                error={
                  errors.types && touched.types
                    ? (errors.types as string)
                    : undefined
                }
              />
            </div>
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

export default UserEmailSettings;
