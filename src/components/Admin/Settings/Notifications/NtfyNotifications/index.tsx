'use client';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import { isValidHttpUrl } from '@app/utils/networkValidation';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const NtfyNotifications = () => {
  const intl = useIntl();

  const NtfySchema = Yup.object().shape({
    url: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.ntfy.urlRequired',
          defaultMessage: 'You must provide your ntfy server URL',
        })
      )
      .test(
        'valid-url',
        intl.formatMessage({
          id: 'notifications.ntfy.urlInvalid',
          defaultMessage: 'You must provide a valid URL',
        }),
        (value) => isValidHttpUrl(value)
      ),
    topic: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.ntfy.topicRequired',
          defaultMessage: 'You must provide your ntfy topic',
        })
      )
      .matches(
        /^[-_A-Za-z0-9]{1,64}$/,
        intl.formatMessage({
          id: 'notifications.ntfy.topicInvalid',
          defaultMessage:
            'Topic may only contain letters, numbers, dashes and underscores',
        })
      ),
    username: Yup.string().when('authMethod', {
      is: 'usernamePassword',
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'notifications.ntfy.usernameRequired',
            defaultMessage: 'You must provide a username',
          })
        ),
      otherwise: (schema) => schema.nullable(),
    }),
    password: Yup.string().when('authMethod', {
      is: 'usernamePassword',
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'notifications.ntfy.passwordRequired',
            defaultMessage: 'You must provide a password',
          })
        ),
      otherwise: (schema) => schema.nullable(),
    }),
    token: Yup.string().when('authMethod', {
      is: 'token',
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'notifications.ntfy.tokenRequired',
            defaultMessage: 'You must provide a token',
          })
        ),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/ntfy"
      providerName={intl.formatMessage({
        id: 'notifications.providers.ntfy',
        defaultMessage: 'ntfy',
      })}
      validationSchema={NtfySchema}
      fields={[
        {
          name: 'url',
          label: (
            <FormattedMessage
              id="notifications.fields.serverUrl"
              defaultMessage="Server URL"
            />
          ),
          type: 'text',
          required: true,
        },
        {
          name: 'topic',
          label: (
            <FormattedMessage
              id="notifications.fields.topic"
              defaultMessage="Topic"
            />
          ),
          type: 'text',
          required: true,
        },
        {
          name: 'authMethod',
          label: (
            <FormattedMessage
              id="notifications.fields.authentication"
              defaultMessage="Authentication"
            />
          ),
          type: 'select',
          defaultValue: 'none',
          options: [
            {
              value: 'none',
              label: (
                <FormattedMessage
                  id="notifications.fields.authMethodNone"
                  defaultMessage="None"
                />
              ),
            },
            {
              value: 'usernamePassword',
              label: (
                <FormattedMessage
                  id="notifications.fields.authMethodUsernamePassword"
                  defaultMessage="Username / Password"
                />
              ),
            },
            {
              value: 'token',
              label: (
                <FormattedMessage
                  id="notifications.fields.authMethodToken"
                  defaultMessage="Token"
                />
              ),
            },
          ],
        },
        {
          name: 'username',
          label: (
            <FormattedMessage id="common.username" defaultMessage="Username" />
          ),
          type: 'text',
          required: true,
          requires: 'authMethod=usernamePassword',
        },
        {
          name: 'password',
          label: (
            <FormattedMessage id="common.password" defaultMessage="Password" />
          ),
          type: 'password',
          required: true,
          requires: 'authMethod=usernamePassword',
        },
        {
          name: 'token',
          label: (
            <FormattedMessage
              id="notifications.fields.token"
              defaultMessage="Token"
            />
          ),
          type: 'password',
          required: true,
          requires: 'authMethod=token',
        },
        {
          name: 'priority',
          label: (
            <FormattedMessage
              id="notifications.fields.priority"
              defaultMessage="Priority"
            />
          ),
          type: 'select',
          defaultValue: '3',
          castToNumber: true,
          options: [
            {
              value: '1',
              label: intl.formatMessage({
                id: 'notifications.ntfy.priorityMin',
                defaultMessage: 'Minimum',
              }),
            },
            {
              value: '2',
              label: intl.formatMessage({
                id: 'notifications.ntfy.priorityLow',
                defaultMessage: 'Low',
              }),
            },
            {
              value: '3',
              label: intl.formatMessage({
                id: 'notifications.ntfy.priorityDefault',
                defaultMessage: 'Default',
              }),
            },
            {
              value: '4',
              label: intl.formatMessage({
                id: 'notifications.ntfy.priorityHigh',
                defaultMessage: 'High',
              }),
            },
            {
              value: '5',
              label: intl.formatMessage({
                id: 'notifications.ntfy.priorityUrgent',
                defaultMessage: 'Urgent',
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default NtfyNotifications;
