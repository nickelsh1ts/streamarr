'use client';
import SettingsBadge from '@app/components/Admin/Settings/SettingsBadge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { BeakerIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';
import { useIntl, FormattedMessage } from 'react-intl';

const EmailNotifications = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/email');

  const NotificationsEmailSchema = Yup.object().shape({
    emailFrom: Yup.string()
      .when('enabled', (enabled, schema) =>
        enabled
          ? schema.nullable().required(
              intl.formatMessage({
                id: 'signIn.emailRequired',
                defaultMessage: 'You must provide a valid email address',
              })
            )
          : schema.nullable()
      )
      .email(
        intl.formatMessage({
          id: 'signIn.emailRequired',
          defaultMessage: 'You must provide a valid email address',
        })
      ),
    smtpHost: Yup.string()
      .when('enabled', (enabled, schema) =>
        enabled
          ? schema.nullable().required(
              intl.formatMessage({
                id: 'servicesSettings.validation.hostname',
                defaultMessage:
                  'You must provide a valid hostname or IP address',
              })
            )
          : schema.nullable()
      )
      .matches(
        /^(((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])):((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))@)?(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
        intl.formatMessage({
          id: 'servicesSettings.validation.hostname',
          defaultMessage: 'You must provide a valid hostname or IP address',
        })
      ),
    smtpPort: Yup.number().when('enabled', (enabled, schema) =>
      enabled
        ? schema.nullable().required(
            intl.formatMessage({
              id: 'plexSettings.validation.port',
              defaultMessage: 'You must provide a valid port number',
            })
          )
        : schema.nullable()
    ),
    pgpPrivateKey: Yup.string()
      .nullable()
      .test(
        'pgp-pair',
        intl.formatMessage({
          id: 'emailNotifications.validation.pgpPrivateKey.passwordRequired',
          defaultMessage:
            'You must provide a PGP password if you set a private key',
        }),
        function (value) {
          const { pgpPassword } = this.parent;
          if (!value && !pgpPassword) return true; // both empty: valid
          if (value && !pgpPassword) return false; // key set, password missing: invalid
          return true; // all other cases: valid
        }
      )
      .matches(
        /^$|-----BEGIN PGP PRIVATE KEY BLOCK-----.+-----END PGP PRIVATE KEY BLOCK-----/,
        intl.formatMessage({
          id: 'emailNotifications.validation.pgpPrivateKey.format',
          defaultMessage: 'You must provide a valid PGP private key',
        })
      ),
    pgpPassword: Yup.string()
      .nullable()
      .test(
        'pgp-pair',
        intl.formatMessage({
          id: 'emailNotifications.validation.pgpPassword.keyRequired',
          defaultMessage:
            'You must provide a PGP private key if you set a password',
        }),
        function (value) {
          const { pgpPrivateKey } = this.parent;
          if (!value && !pgpPrivateKey) return true; // both empty: valid
          if (value && !pgpPrivateKey) return false; // password set, key missing: invalid
          return true; // all other cases: valid
        }
      ),
  });

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data?.enabled ?? false,
        emailFrom: data?.options?.emailFrom,
        smtpHost: data?.options?.smtpHost,
        smtpPort: data?.options?.smtpPort ?? 587,
        encryption: data?.options
          ? data.options.secure
            ? 'implicit'
            : data.options.requireTls
              ? 'opportunistic'
              : data.options.ignoreTls
                ? 'none'
                : 'default'
          : 'default',
        authUser: data?.options?.authUser,
        authPass: data?.options?.authPass,
        allowSelfSigned: data?.options?.allowSelfSigned ?? false,
        senderName: data?.options?.senderName,
        pgpPrivateKey: data?.options?.pgpPrivateKey,
        pgpPassword: data?.options?.pgpPassword,
      }}
      validationSchema={NotificationsEmailSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/email', {
            enabled: values.enabled,
            options: {
              emailFrom: values.emailFrom,
              smtpHost: values.smtpHost,
              smtpPort: Number(values.smtpPort),
              secure: values.encryption === 'implicit',
              ignoreTls: values.encryption === 'none',
              requireTls: values.encryption === 'opportunistic',
              authUser: values.authUser,
              authPass: values.authPass,
              allowSelfSigned: values.allowSelfSigned,
              senderName: values.senderName,
              pgpPrivateKey: values.pgpPrivateKey,
              pgpPassword: values.pgpPassword,
            },
          });
          mutate('/api/v1/settings/public');

          Toast({
            title: intl.formatMessage({
              id: 'emailNotifications.saveSuccess',
              defaultMessage: 'Email notification settings saved successfully!',
            }),
            icon: <CheckBadgeIcon className="size-7" />,
            type: 'success',
          });
        } catch {
          Toast({
            title: intl.formatMessage({
              id: 'emailNotifications.saveError',
              defaultMessage: 'Email notification settings failed to save.',
            }),
            icon: <XMarkIcon className="size-7" />,
            type: 'error',
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ errors, touched, isSubmitting, values, isValid }) => {
        const testSettings = async () => {
          setIsTesting(true);
          try {
            Toast({
              title: intl.formatMessage({
                id: 'emailNotifications.testSending',
                defaultMessage: 'Sending email test notification…',
              }),
              icon: <BeakerIcon className="size-7" />,
              type: 'warning',
            });
            await axios.post('/api/v1/settings/notifications/email/test', {
              enabled: true,
              options: {
                emailFrom: values.emailFrom,
                smtpHost: values.smtpHost,
                smtpPort: Number(values.smtpPort),
                secure: values.encryption === 'implicit',
                ignoreTls: values.encryption === 'none',
                requireTls: values.encryption === 'opportunistic',
                authUser: values.authUser,
                authPass: values.authPass,
                allowSelfSigned: values.allowSelfSigned,
                senderName: values.senderName,
                pgpPrivateKey: values.pgpPrivateKey,
                pgpPassword: values.pgpPassword,
              },
            });

            Toast({
              title: intl.formatMessage({
                id: 'emailNotifications.testSuccess',
                defaultMessage: 'Email test notification sent!',
              }),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch {
            Toast({
              title: intl.formatMessage({
                id: 'emailNotifications.testError',
                defaultMessage: 'Email test notification failed to send.',
              }),
              type: 'error',
              icon: <XMarkIcon className="size-7" />,
            });
          } finally {
            setIsTesting(false);
          }
        };
        return (
          <Form>
            <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
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
                    id="enabled"
                    name="enabled"
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary rounded-md w-full"
                  />
                </div>
              </div>
              <label htmlFor="senderName">
                <FormattedMessage
                  id="emailNotifications.senderName"
                  defaultMessage="Sender Name"
                />
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <Field
                    className="input input-sm input-primary rounded-md w-full"
                    id="senderName"
                    name="senderName"
                    type="text"
                  />
                </div>
              </div>
              <label htmlFor="emailFrom">
                <FormattedMessage
                  id="emailNotifications.senderAddress"
                  defaultMessage="Sender Address"
                />
                <span className="ml-1 text-error">*</span>
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <Field
                    id="emailFrom"
                    name="emailFrom"
                    type="text"
                    inputMode="email"
                    autoComplete="off"
                    data-1pignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.emailFrom &&
                  touched.emailFrom &&
                  typeof errors.emailFrom === 'string' && (
                    <div className="error">{errors.emailFrom}</div>
                  )}
              </div>
              <label htmlFor="smtpHost">
                <FormattedMessage
                  id="emailNotifications.smtpHost"
                  defaultMessage="SMTP Host"
                />
                <span className="ml-1 text-error">*</span>
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <Field
                    id="smtpHost"
                    name="smtpHost"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    data-1pignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.smtpHost &&
                  touched.smtpHost &&
                  typeof errors.smtpHost === 'string' && (
                    <div className="error">{errors.smtpHost}</div>
                  )}
              </div>
              <label htmlFor="smtpPort">
                <FormattedMessage
                  id="emailNotifications.smtpPort"
                  defaultMessage="SMTP Port"
                />
                <span className="ml-1 text-error">*</span>
              </label>
              <div className="sm:col-span-2">
                <Field
                  id="smtpPort"
                  name="smtpPort"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  data-1pignore="true"
                  data-lpignore="true"
                  data-bwignore="true"
                  className="input input-sm input-primary rounded-md w-1/6"
                />
                {errors.smtpPort &&
                  touched.smtpPort &&
                  typeof errors.smtpPort === 'string' && (
                    <div className="error">{errors.smtpPort}</div>
                  )}
              </div>
              <label htmlFor="encryption">
                <FormattedMessage
                  id="emailNotifications.encryptionMethod"
                  defaultMessage="Encryption Method"
                />
                <span className="ml-1 text-error">*</span>
                <span className="block text-sm text-neutral-500">
                  <FormattedMessage
                    id="emailNotifications.encryptionMethodDescription"
                    defaultMessage="In most cases, Implicit TLS uses port 465 and STARTTLS uses port 587"
                  />
                </span>
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <Field
                    as="select"
                    id="encryption"
                    name="encryption"
                    className="select select-sm select-primary rounded-md w-full"
                  >
                    <option value="none">
                      {intl.formatMessage({
                        id: 'common.none',
                        defaultMessage: 'None',
                      })}
                    </option>
                    <option value="default">
                      {intl.formatMessage({
                        id: 'emailNotifications.encryption.default',
                        defaultMessage: 'Use STARTTLS if available',
                      })}
                    </option>
                    <option value="opportunistic">
                      {intl.formatMessage({
                        id: 'emailNotifications.encryption.opportunistic',
                        defaultMessage: 'Always use STARTTLS',
                      })}
                    </option>
                    <option value="implicit">
                      {intl.formatMessage({
                        id: 'emailNotifications.encryption.implicit',
                        defaultMessage: 'Use Implicit TLS',
                      })}
                    </option>
                  </Field>
                </div>
              </div>
              <label htmlFor="allowSelfSigned" className="checkbox-label">
                <FormattedMessage
                  id="emailNotifications.allowSelfSigned"
                  defaultMessage="Allow Self-Signed Certificates"
                />
              </label>
              <div className="sm:col-span-2">
                <Field
                  type="checkbox"
                  id="allowSelfSigned"
                  name="allowSelfSigned"
                  className="checkbox checkbox-sm checkbox-primary rounded-md w-full"
                />
              </div>
              <label htmlFor="authUser">
                <FormattedMessage
                  id="emailNotifications.smtpUsername"
                  defaultMessage="SMTP Username"
                />
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <Field
                    type="text"
                    id="authUser"
                    name="authUser"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
              </div>
              <label htmlFor="authPass">
                <FormattedMessage
                  id="emailNotifications.smtpPassword"
                  defaultMessage="SMTP Password"
                />
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <SensitiveInput
                    as="field"
                    id="authPass"
                    name="authPass"
                    buttonSize="sm"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
              </div>
              <label htmlFor="pgpPrivateKey">
                <span className="mr-2">
                  <FormattedMessage
                    id="emailNotifications.pgpPrivateKey"
                    defaultMessage="PGP Private Key"
                  />
                </span>
                <SettingsBadge badgeType="advanced" />
                <span className="block text-sm text-neutral-500">
                  <FormattedMessage
                    id="emailNotifications.pgpPasswordDescription"
                    defaultMessage="Sign encrypted email messages using {link}"
                    values={{
                      link: (
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
                </span>
              </label>
              <div className="sm:col-span-2">
                <div className="flex">
                  <SensitiveInput
                    as="field"
                    id="pgpPrivateKey"
                    name="pgpPrivateKey"
                    buttonSize="sm"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.pgpPrivateKey &&
                  touched.pgpPrivateKey &&
                  typeof errors.pgpPrivateKey === 'string' && (
                    <div className="error">{errors.pgpPrivateKey}</div>
                  )}
              </div>
              <label htmlFor="pgpPassword">
                <span className="mr-2">
                  <FormattedMessage
                    id="emailNotifications.pgpPassword"
                    defaultMessage="PGP Password"
                  />
                </span>
                <SettingsBadge badgeType="advanced" />
                <p className="text-sm text-neutral-500">
                  <FormattedMessage
                    id="emailNotifications.pgpPasswordDescription"
                    defaultMessage="Sign encrypted email messages using {link}"
                    values={{
                      link: (
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
              <div className="sm:col-span-2">
                <div className="flex">
                  <SensitiveInput
                    as="field"
                    id="pgpPassword"
                    name="pgpPassword"
                    buttonSize="sm"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
                {errors.pgpPassword &&
                  touched.pgpPassword &&
                  typeof errors.pgpPassword === 'string' && (
                    <div className="error">{errors.pgpPassword}</div>
                  )}
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-full mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonSize="sm"
                    buttonType="warning"
                    disabled={isSubmitting || !isValid || isTesting}
                    onClick={(e) => {
                      e.preventDefault();
                      testSettings();
                    }}
                    className="disabled:bg-warning/30"
                  >
                    <BeakerIcon className="size-5 mr-2" />
                    <span>
                      {isTesting ? (
                        <FormattedMessage
                          id="common.testing"
                          defaultMessage="Testing..."
                        />
                      ) : (
                        <FormattedMessage
                          id="common.test"
                          defaultMessage="Test"
                        />
                      )}
                    </span>
                  </Button>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonSize="sm"
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid || isTesting}
                  >
                    <ArrowDownTrayIcon className="size-5 mr-2" />
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
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};
export default EmailNotifications;
