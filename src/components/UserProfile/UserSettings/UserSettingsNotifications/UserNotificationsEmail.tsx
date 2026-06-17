'use client';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector, {
  ALL_NOTIFICATIONS,
} from '@app/components/Common/NotificationTypeSelector';
import SensitiveInput from '@app/components/Common/SensitiveInput';
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

const UserEmailSettings = () => {
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

  const UserNotificationsEmailSchema = Yup.object().shape({
    pgpKey: Yup.string()
      .nullable()
      .matches(
        /^$|-----BEGIN PGP PUBLIC KEY BLOCK-----.+-----END PGP PUBLIC KEY BLOCK-----/s,
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
              <div className="grid grid-cols-1 space-y-2 sm:grid-cols-3 sm:space-y-0 sm:space-x-2">
                <label htmlFor="pgpKey" className="col-span-1">
                  <span className="mr-2">
                    <FormattedMessage
                      id="userSettings.pgpPublicKey"
                      defaultMessage="PGP Public Key"
                    />
                  </span>
                  <SettingsBadge badgeType="advanced" />
                  <p className="text-neutral text-sm">
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
                      type="textarea"
                      className="textarea textarea-sm textarea-primary w-full font-mono text-xs"
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

export default UserEmailSettings;
