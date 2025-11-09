'use client';
import Modal from '@app/components/Common/Modal';
import UserSelector from '@app/components/Common/UserSelector';
import type { ToastType } from '@app/components/Toast';
import Toast from '@app/components/Toast';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import type Notification from '@server/entity/Notification';
import type { UserResultsResponse } from '@server/interfaces/api/userInterfaces';
import { Permission } from '@server/lib/permissions';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';
import useSWR from 'swr';
import { getToastType } from '@app/components/Layout/Notifications';

interface NotificationModalProps {
  onClose: () => void;
  notification?: Notification;
  onSave?: () => void;
  show: boolean;
}

const NotificationModal = ({
  onClose,
  notification,
  onSave,
  show,
}: NotificationModalProps) => {
  const intl = useIntl();
  const { hasPermission: currentHasPermission } = useUser();

  const { data: userData } = useSWR<UserResultsResponse>(
    currentHasPermission(
      [Permission.CREATE_NOTIFICATIONS, Permission.MANAGE_NOTIFICATIONS],
      { type: 'or' }
    )
      ? '/api/v1/user?sort=displayname'
      : null
  );
  const filteredUserData =
    userData?.results.filter((user) => {
      const notificationTypes = user.settings?.notificationTypes;

      if (!notificationTypes || Object.keys(notificationTypes).length === 0) {
        return true;
      }
      const localMessageBit = NotificationType.LOCAL_MESSAGE;

      return (
        ((notificationTypes.inApp ?? 0) & localMessageBit) !== 0 ||
        ((notificationTypes.webpush ?? 0) & localMessageBit) !== 0 ||
        ((notificationTypes.email ?? 0) & localMessageBit) !== 0
      );
    }) ?? [];

  const createPreview = (values) => {
    let icon;
    switch (values.severity) {
      case NotificationSeverity.ERROR:
        icon = <XCircleIcon className="text-error-content size-7" />;
        break;
      case NotificationSeverity.WARNING:
        icon = (
          <ExclamationTriangleIcon className="text-warning-content size-7" />
        );
        break;
      case NotificationSeverity.INFO:
        icon = (
          <InformationCircleIcon className="text-primary-content size-7" />
        );
        break;
      case NotificationSeverity.SUCCESS:
        icon = <CheckBadgeIcon className="text-success-content size-7" />;
        break;
      case NotificationSeverity.PRIMARY:
        icon = (
          <InformationCircleIcon className="text-primary-content size-7" />
        );
        break;
      case NotificationSeverity.SECONDARY:
        icon = (
          <InformationCircleIcon className="text-secondary-content size-7" />
        );
        break;
      case NotificationSeverity.ACCENT:
        icon = <InformationCircleIcon className="text-accent-content size-7" />;
        break;
      default:
        icon = (
          <InformationCircleIcon className="text-primary-content size-7" />
        );
    }

    Toast({
      title: values.subject,
      message: values.message,
      type: getToastType(values.severity as NotificationSeverity) as ToastType,
      icon: icon,
    });
  };

  const notificationSchema = Yup.object().shape({
    subject: Yup.string()
      .max(
        40,
        intl.formatMessage({
          id: 'notificationModal.subjectMax',
          defaultMessage: 'Subject must not be more than 40 characters',
        })
      )
      .required(
        intl.formatMessage({
          id: 'notificationModal.subjectRequired',
          defaultMessage: 'Subject is required',
        })
      ),
    message: Yup.string().max(
      150,
      intl.formatMessage({
        id: 'notificationModal.descriptionMax',
        defaultMessage: 'Description must not be more than 150 characters',
      })
    ),
    actionUrl: Yup.string().when('actionUrlTitle', {
      is: (val: string) => val && val.length > 0,
      then: (schema) =>
        schema
          .matches(
            /^(https?:\/\/|\/)/,
            intl.formatMessage({
              id: 'notificationModal.actionUrlInvalid',
              defaultMessage:
                'Action URL must be a URL or base path starting with /',
            })
          )
          .required(
            intl.formatMessage({
              id: 'notificationModal.actionUrlRequired',
              defaultMessage:
                'Action URL is required when Action URL Title is provided',
            })
          ),
      otherwise: (schema) =>
        schema.matches(
          /^$|^(https?:\/\/|\/)/,
          intl.formatMessage({
            id: 'notificationModal.actionUrlInvalid',
            defaultMessage:
              'Action URL must be a URL or base path starting with /',
          })
        ),
    }),
    actionUrlTitle: Yup.string().max(
      40,
      intl.formatMessage({
        id: 'notificationModal.actionUrlTitleMax',
        defaultMessage: 'Action URL Title must not be more than 40 characters',
      })
    ),
    notifyUsers: Yup.array()
      .min(
        1,
        intl.formatMessage({
          id: 'notificationModal.notifyUsersRequired',
          defaultMessage: 'At least one user must be selected',
        })
      )
      .required(
        intl.formatMessage({
          id: 'notificationModal.notifyUsersRequired',
          defaultMessage: 'At least one user must be selected',
        })
      ),
  });

  return (
    <Formik
      enableReinitialize
      initialValues={{
        subject: notification?.subject || '',
        message: notification?.message || '',
        severity: notification?.severity || 'info',
        type: NotificationType.LOCAL_MESSAGE,
        actionUrl: notification?.actionUrl || '',
        actionUrlTitle: notification?.actionUrlTitle || '',
        notifyUsers: [] as User[],
      }}
      validationSchema={notificationSchema}
      onSubmit={async (values, { resetForm }) => {
        try {
          const submission = {
            type: values.type,
            subject: values.subject,
            message: values.message,
            severity: values.severity,
            actionUrl: values.actionUrl,
            actionUrlTitle: values.actionUrlTitle,
            notifyUser: values.notifyUsers.map((user) => user.id),
          };

          if (!notification) {
            await axios.post('/api/v1/notification', submission);
          } else {
            await axios.put(
              `/api/v1/notification/${notification.id}`,
              submission
            );
          }
          resetForm();
          onSave();
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'notificationModal.saveError',
              defaultMessage: 'There was an error saving the notification',
            }),
            message: e.message,
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      }}
    >
      {({
        errors,
        touched,
        values,
        handleSubmit,
        isSubmitting,
        isValid,
        setFieldValue,
        setFieldTouched,
      }) => {
        return (
          <Modal
            onCancel={onClose}
            cancelText={intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })}
            cancelButtonType="default"
            okButtonType="primary"
            okText={
              isSubmitting
                ? intl.formatMessage({
                    id: 'common.saving',
                    defaultMessage: 'Saving...',
                  })
                : notification
                  ? intl.formatMessage({
                      id: 'common.saveChanges',
                      defaultMessage: 'Save Changes',
                    })
                  : intl.formatMessage({
                      id: 'common.sendNotification',
                      defaultMessage: 'Send Notification',
                    })
            }
            onOk={() => handleSubmit()}
            okDisabled={isSubmitting || !isValid}
            secondaryButtonType="warning"
            secondaryDisabled={
              !isValid || isSubmitting || values.subject === ''
            }
            secondaryText={intl.formatMessage({
              id: 'common.preview',
              defaultMessage: 'Preview',
            })}
            onSecondary={() => createPreview(values)}
            title={
              notification
                ? intl.formatMessage({
                    id: 'notificationModal.editNotification',
                    defaultMessage: 'Edit Notification',
                  })
                : intl.formatMessage({
                    id: 'notificationModal.sendTitle',
                    defaultMessage: 'Send a Notification',
                  })
            }
            show={show}
          >
            <Form className="space-y-2">
              <div className="border-t border-primary pt-4">
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="notificationModal.subject"
                    defaultMessage="Subject"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div>
                  <Field
                    id="subject"
                    name="subject"
                    type="text"
                    className={`input input-sm input-primary rounded-md w-full ${
                      errors.subject && touched.subject ? 'input-error' : ''
                    }`}
                  />
                  {errors.subject && touched.subject && (
                    <div className="text-error">{errors.subject}</div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="notificationModal.message"
                    defaultMessage="Message"
                  />
                </label>
                <div>
                  <Field
                    as="textarea"
                    id="message"
                    name="message"
                    rows={3}
                    className={`input input-sm input-primary rounded-md w-full h-16 leading-normal ${
                      errors.message && touched.message ? 'input-error' : ''
                    }`}
                  />
                  {errors.message && touched.message && (
                    <div className="text-error">{errors.message}</div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="actionUrlTitle"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="notificationModal.actionUrlTitle"
                    defaultMessage="Action URL Title"
                  />
                  <span className="text-neutral-500 ml-2">
                    (
                    <FormattedMessage
                      id="common.optional"
                      defaultMessage="optional"
                    />
                    )
                  </span>
                </label>
                <div>
                  <Field
                    as="input"
                    id="actionUrlTitle"
                    name="actionUrlTitle"
                    className={`input input-sm input-primary rounded-md w-full ${
                      errors.actionUrlTitle && touched.actionUrlTitle
                        ? 'input-error'
                        : ''
                    }`}
                  />
                  {errors.actionUrlTitle && touched.actionUrlTitle && (
                    <div className="text-error">{errors.actionUrlTitle}</div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="actionUrl"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="notificationModal.actionUrl"
                    defaultMessage="Action URL"
                  />
                  {values.actionUrlTitle ? (
                    <span className="text-error ml-1">*</span>
                  ) : (
                    <span className="text-neutral-500 ml-2">
                      (
                      <FormattedMessage
                        id="common.optional"
                        defaultMessage="optional"
                      />
                      )
                    </span>
                  )}
                </label>
                <div>
                  <Field
                    as="input"
                    id="actionUrl"
                    name="actionUrl"
                    className={`input input-sm input-primary rounded-md w-full ${
                      errors.actionUrl && touched.actionUrl ? 'input-error' : ''
                    }`}
                  />
                  {errors.actionUrl && touched.actionUrl && (
                    <div className="text-error">{errors.actionUrl}</div>
                  )}
                </div>
              </div>
              <div className="">
                <label
                  htmlFor="severity"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="notificationModal.severity"
                    defaultMessage="Severity"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field
                    as="select"
                    id="severity"
                    name="severity"
                    className="select select-sm select-primary w-full"
                  >
                    {Object.entries(NotificationSeverity).map(([key, val]) => (
                      <option key={key} value={val}>
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Field>
                </div>
              </div>
              <div>
                <label
                  htmlFor="notifyUsers"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="notificationModal.notifyUsers"
                    defaultMessage="Notify Users"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div>
                  <UserSelector
                    userData={filteredUserData}
                    multiple
                    valid={!errors.notifyUsers || !touched.notifyUsers}
                    onChange={(users) => {
                      const usersArray = Array.isArray(users)
                        ? users
                        : users
                          ? [users]
                          : [];
                      setFieldValue('notifyUsers', usersArray);
                    }}
                    onBlur={() => {
                      setFieldTouched('notifyUsers', true, false);
                    }}
                  />
                  {errors.notifyUsers && touched.notifyUsers && (
                    <div className="text-error">
                      {String(errors.notifyUsers)}
                    </div>
                  )}
                </div>
              </div>
            </Form>
          </Modal>
        );
      }}
    </Formik>
  );
};
export default NotificationModal;
