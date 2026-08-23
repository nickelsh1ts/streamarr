'use client';
import Alert from '@app/components/Common/Alert';
import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

interface AudiobookshelfModalProps {
  userId: number;
  show: boolean;
  onClose: () => void;
  onLinked: (accessToken: string | null) => void;
  /** Whether this Streamarr user already has a linked Audiobookshelf account. */
  alreadyLinked: boolean;
  /** MANAGE_USERS permission - only managers may attach or reset a pre-existing account. */
  isManager: boolean;
  /** Whether this user has already used their one-time "notify an admin" request. */
  alreadyNotified?: boolean;
}

const AudiobookshelfModal = ({
  userId,
  show,
  onClose,
  onLinked,
  alreadyLinked,
  isManager,
  alreadyNotified = false,
}: AudiobookshelfModalProps) => {
  const intl = useIntl();
  // Set when an existing (unlinked) account was found but only a manager may
  // attach it - offers to notify one instead of failing silently.
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const hasNotified = notified || alreadyNotified;
  // Current password only ever verifies an already-linked account; new/confirm
  // are required except when a manager is merely linking (not creating) one.
  const currentPasswordRequired = alreadyLinked && !isManager;
  const newPasswordRequired = alreadyLinked || !isManager;

  const AudiobookshelfSchema = Yup.object().shape({
    currentPassword: Yup.lazy(() =>
      currentPasswordRequired
        ? Yup.string().required(
            intl.formatMessage({
              id: 'linkedAccounts.audiobookshelfCurrentRequired',
              defaultMessage: 'You must provide the current password',
            })
          )
        : Yup.string().optional()
    ),
    newPassword: Yup.lazy(() => {
      const schema = Yup.string().min(
        8,
        intl.formatMessage({
          id: 'resetPassword.passwordTooShort',
          defaultMessage:
            'Password is too short; should be a minimum of 8 characters',
        })
      );
      return newPasswordRequired
        ? schema.required(
            intl.formatMessage({
              id: 'userSettings.password.newRequired',
              defaultMessage: 'You must provide a new password',
            })
          )
        : schema.optional();
    }),
    confirmPassword: Yup.lazy(() => {
      const schema = Yup.string().oneOf(
        [Yup.ref('newPassword'), null],
        intl.formatMessage({
          id: 'localSignup.passwordsMatch',
          defaultMessage: 'Passwords must match',
        })
      );
      return newPasswordRequired
        ? schema.required(
            intl.formatMessage({
              id: 'userSettings.password.confirmRequired',
              defaultMessage: 'You must confirm the new password',
            })
          )
        : schema.optional();
    }),
  });

  const handleNotify = async () => {
    setNotifying(true);
    try {
      await axios.post(
        `/api/v1/user/${userId}/settings/linked-accounts/audiobookshelf/notify`
      );
      setNotified(true);
    } catch (e) {
      Toast({
        title:
          e.response?.data?.message ??
          intl.formatMessage({
            id: 'linkedAccounts.audiobookshelfNotifyFailed',
            defaultMessage: 'Failed to send notifications.',
          }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setNotifying(false);
    }
  };

  const title = alreadyLinked
    ? intl.formatMessage({
        id: 'linkedAccounts.audiobookshelfResetModalTitle',
        defaultMessage: 'Reset Audiobookshelf Password',
      })
    : intl.formatMessage({
        id: 'linkedAccounts.audiobookshelfModalTitle',
        defaultMessage: 'Link Audiobookshelf Account',
      });

  return (
    <Formik
      initialValues={{
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }}
      validationSchema={AudiobookshelfSchema}
      enableReinitialize
      onSubmit={async (values, { resetForm }) => {
        try {
          const { data } = await axios.post<{ accessToken: string | null }>(
            `/api/v1/user/${userId}/settings/linked-accounts/audiobookshelf`,
            {
              currentPassword: values.currentPassword || undefined,
              newPassword: values.newPassword || undefined,
            }
          );
          Toast({
            title: alreadyLinked
              ? intl.formatMessage({
                  id: 'linkedAccounts.audiobookshelfResetSuccess',
                  defaultMessage: 'Audiobookshelf password reset successfully.',
                })
              : intl.formatMessage({
                  id: 'linkedAccounts.audiobookshelfLinkSuccess',
                  defaultMessage: 'Audiobookshelf account linked successfully.',
                }),
            type: 'success',
            icon: <CheckBadgeIcon className="size-7" />,
          });
          resetForm();
          onLinked(data.accessToken);
        } catch (e) {
          if (e.response?.status === 409 && !alreadyLinked) {
            setBlockedMessage(
              e.response?.data?.message ??
                intl.formatMessage({
                  id: 'linkedAccounts.audiobookshelfExistingAccountBlocked',
                  defaultMessage:
                    'An existing Audiobookshelf account matches your profile. Ask an administrator to link it for you.',
                })
            );
            return;
          }
          Toast({
            title: intl.formatMessage({
              id: 'linkedAccounts.audiobookshelfLinkFailed',
              defaultMessage:
                'An error occurred while linking your Audiobookshelf account',
            }),
            message: e.response?.data?.message ?? e.message,
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      }}
    >
      {({
        errors,
        touched,
        isSubmitting,
        isValid,
        handleSubmit,
        resetForm,
      }) => {
        const handleClose = () => {
          setBlockedMessage(null);
          setNotifying(false);
          setNotified(false);
          resetForm();
          onClose();
        };

        return (
          <Modal
            show={show}
            title={title}
            subtitle={
              isManager && !alreadyLinked
                ? intl.formatMessage({
                    id: 'linkedAccounts.audiobookshelfModalSubtitleManager',
                    defaultMessage:
                      'If an account with the same username/email exists on the Audiobookshelf server, it will be linked to this user. Otherwise, provide a password to create a new account.',
                  })
                : undefined
            }
            onCancel={handleClose}
            onOk={blockedMessage ? undefined : () => handleSubmit()}
            okText={
              blockedMessage
                ? undefined
                : isSubmitting
                  ? alreadyLinked
                    ? intl.formatMessage({
                        id: 'common.saving',
                        defaultMessage: 'Saving…',
                      })
                    : intl.formatMessage({
                        id: 'common.linking',
                        defaultMessage: 'Linking…',
                      })
                  : alreadyLinked
                    ? intl.formatMessage({
                        id: 'common.save',
                        defaultMessage: 'Save',
                      })
                    : intl.formatMessage({
                        id: 'common.linkAccount',
                        defaultMessage: 'Link Account',
                      })
            }
            onTertiary={blockedMessage ? handleNotify : undefined}
            tertiaryText={
              blockedMessage
                ? hasNotified
                  ? intl.formatMessage({
                      id: 'linkedAccounts.audiobookshelfNotifySent',
                      defaultMessage: 'Password Reset Requested',
                    })
                  : intl.formatMessage({
                      id: 'linkedAccounts.audiobookshelfNotify',
                      defaultMessage: 'Request Password Reset',
                    })
                : undefined
            }
            tertiaryButtonType="error"
            tertiaryDisabled={notifying || hasNotified}
            onSecondary={
              blockedMessage ? () => setBlockedMessage(null) : undefined
            }
            secondaryText={
              blockedMessage
                ? intl.formatMessage({
                    id: 'common.tryAgain',
                    defaultMessage: 'Try Again',
                  })
                : undefined
            }
            secondaryButtonType="primary"
            cancelText={
              blockedMessage
                ? intl.formatMessage({
                    id: 'common.close',
                    defaultMessage: 'Close',
                  })
                : intl.formatMessage({
                    id: 'common.cancel',
                    defaultMessage: 'Cancel',
                  })
            }
            okDisabled={isSubmitting || !isValid}
            loading={isSubmitting || notifying}
          >
            {blockedMessage ? (
              <div className="space-y-3 text-left">
                <Alert title={blockedMessage} type="warning" />
              </div>
            ) : (
              <Form className="space-y-4 text-left">
                {alreadyLinked && currentPasswordRequired && (
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="text-sm font-semibold"
                    >
                      <FormattedMessage
                        id="common.currentPassword"
                        defaultMessage="Current Password"
                      />

                      <span className="text-error ml-1">*</span>
                    </label>
                    <div className="mt-1 flex">
                      <SensitiveInput
                        as="field"
                        id="currentPassword"
                        name="currentPassword"
                        buttonSize="sm"
                        className="input input-sm input-primary w-full"
                      />
                    </div>
                    {errors.currentPassword && touched.currentPassword && (
                      <div className="text-error">{errors.currentPassword}</div>
                    )}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-semibold"
                  >
                    {alreadyLinked ? (
                      <FormattedMessage
                        id="common.newPassword"
                        defaultMessage="New Password"
                      />
                    ) : (
                      <FormattedMessage
                        id="common.password"
                        defaultMessage="Password"
                      />
                    )}
                    {newPasswordRequired ? (
                      <span className="text-error ml-1">*</span>
                    ) : (
                      <span className="text-neutral ml-2">
                        (
                        <FormattedMessage
                          id="common.optional"
                          defaultMessage="optional"
                        />
                        )
                      </span>
                    )}
                  </label>
                  <div className="mt-1 flex">
                    <SensitiveInput
                      as="field"
                      id="newPassword"
                      name="newPassword"
                      buttonSize="sm"
                      className="input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.newPassword && touched.newPassword && (
                    <div className="text-error">{errors.newPassword}</div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold"
                  >
                    <FormattedMessage
                      id="common.confirmPassword"
                      defaultMessage="Confirm Password"
                    />
                    {newPasswordRequired ? (
                      <span className="text-error ml-1">*</span>
                    ) : (
                      <span className="text-neutral ml-2">
                        (
                        <FormattedMessage
                          id="common.optional"
                          defaultMessage="optional"
                        />
                        )
                      </span>
                    )}
                  </label>
                  <div className="mt-1 flex">
                    <SensitiveInput
                      as="field"
                      id="confirmPassword"
                      name="confirmPassword"
                      buttonSize="sm"
                      className="input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <div className="text-error">{errors.confirmPassword}</div>
                  )}
                </div>
              </Form>
            )}
          </Modal>
        );
      }}
    </Formik>
  );
};

export default AudiobookshelfModal;
