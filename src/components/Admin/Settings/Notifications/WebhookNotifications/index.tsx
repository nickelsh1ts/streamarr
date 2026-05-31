'use client';
import Button from '@app/components/Common/Button';
import JSONEditor from '@app/components/Common/JSONEditor';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector from '@app/components/Common/NotificationTypeSelector';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  BeakerIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import {
  Field,
  FieldArray,
  Form,
  Formik,
  getIn,
  useFormikContext,
} from 'formik';
import { type ReactNode, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';
import { isValidHttpUrl } from '@app/utils/networkValidation';

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    notification_type: '{{notification_type}}',
    subject: '{{subject}}',
    message: '{{message}}',
    image: '{{image}}',
    '{{extra}}': [],
    notifyuser: {
      username: '{{notifyuser_username}}',
      email: '{{notifyuser_email}}',
      avatar: '{{notifyuser_avatar}}',
    },
  },
  null,
  2
);

const TEMPLATE_VARS: {
  groupLabel: ReactNode;
  vars: { name: string; desc: ReactNode }[];
}[] = [
  {
    groupLabel: (
      <FormattedMessage
        id="notifications.webhook.varGroupGeneral"
        defaultMessage="General"
      />
    ),
    vars: [
      {
        name: '{{notification_type}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varNotificationType"
            defaultMessage="The notification type (e.g. NEW_INVITE)"
          />
        ),
      },
      {
        name: '{{subject}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varSubject"
            defaultMessage="The notification subject"
          />
        ),
      },
      {
        name: '{{message}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varMessage"
            defaultMessage="The notification message body"
          />
        ),
      },
      {
        name: '{{image}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varImage"
            defaultMessage="The notification image URL"
          />
        ),
      },
    ],
  },
  {
    groupLabel: (
      <FormattedMessage
        id="notifications.webhook.varGroupNotifyUser"
        defaultMessage="Notify User"
      />
    ),
    vars: [
      {
        name: '{{notifyuser_username}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varNotifyUsername"
            defaultMessage="Recipient's display name"
          />
        ),
      },
      {
        name: '{{notifyuser_email}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varNotifyEmail"
            defaultMessage="Recipient's email address"
          />
        ),
      },
      {
        name: '{{notifyuser_avatar}}',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varNotifyAvatar"
            defaultMessage="Recipient's avatar URL"
          />
        ),
      },
    ],
  },
  {
    groupLabel: (
      <FormattedMessage
        id="notifications.webhook.varGroupSpecial"
        defaultMessage="Special (JSON keys)"
      />
    ),
    vars: [
      {
        name: '"{{extra}}": []',
        desc: (
          <FormattedMessage
            id="notifications.webhook.varExtra"
            defaultMessage="Array of additional data — use as a JSON key with an empty array value"
          />
        ),
      },
    ],
  },
];

const TemplateVarsPanel = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
      >
        <ChevronRightIcon
          className={`size-4 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
        />
        <FormattedMessage
          id="notifications.webhook.templateVariables"
          defaultMessage="Template Variables"
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="mt-3 rounded-lg border border-base-content/10 bg-base-200 p-4 space-y-4 text-xs">
            {TEMPLATE_VARS.map((group, i) => (
              <div key={i}>
                <p className="font-semibold mb-2 opacity-80">
                  {group.groupLabel}
                </p>
                <table className="w-full">
                  <tbody>
                    {group.vars.map((v) => (
                      <tr key={v.name} className="align-top">
                        <td className="pr-4 pb-1 font-mono whitespace-nowrap text-primary">
                          {v.name}
                        </td>
                        <td className="pb-1 opacity-70">{v.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResetPayloadButton = () => {
  const { setFieldValue } = useFormikContext();
  const intl = useIntl();

  return (
    <div className="flex justify-end mb-1">
      <Button
        type="button"
        buttonSize="xs"
        buttonType="ghost"
        onClick={() => setFieldValue('jsonPayload', DEFAULT_PAYLOAD)}
        title={intl.formatMessage({
          id: 'notifications.webhook.resetPayload',
          defaultMessage: 'Reset to Default',
        })}
      >
        <ArrowPathIcon className="size-4 mr-1" />
        <FormattedMessage
          id="notifications.webhook.resetPayload"
          defaultMessage="Reset to Default"
        />
      </Button>
    </div>
  );
};

const WebhookNotifications = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/webhook');

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  const providerName = intl.formatMessage({
    id: 'notifications.providers.webhook',
    defaultMessage: 'Webhook',
  });

  const WebhookSchema = Yup.object().shape({
    webhookUrl: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.webhook.urlRequired',
          defaultMessage: 'You must provide a valid URL',
        })
      )
      .test(
        'valid-http-url',
        intl.formatMessage({
          id: 'notifications.webhook.urlRequired',
          defaultMessage: 'You must provide a valid URL',
        }),
        (value) => isValidHttpUrl(value)
      ),
    authHeader: Yup.string().test(
      'no-duplicate-authorization-header',
      intl.formatMessage({
        id: 'notifications.webhook.authHeaderConflict',
        defaultMessage:
          "You cannot use both the Authorization Header field and an 'Authorization' custom header. Remove one.",
      }),
      function (value) {
        if (!value) {
          return true;
        }

        const customHeaders = ((
          this.parent as { customHeaders?: { key: string }[] }
        ).customHeaders ?? []) as { key: string }[];

        return !customHeaders.some(
          (header) => header.key?.trim().toLowerCase() === 'authorization'
        );
      }
    ),
    customHeaders: Yup.array().of(
      Yup.object().shape({
        key: Yup.string().required(
          intl.formatMessage({
            id: 'notifications.webhook.headerNameRequired',
            defaultMessage: 'You must provide a header name',
          })
        ),
        value: Yup.string().required(
          intl.formatMessage({
            id: 'notifications.webhook.headerValueRequired',
            defaultMessage: 'You must provide a header value',
          })
        ),
      })
    ),
    jsonPayload: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.webhook.payloadRequired',
          defaultMessage: 'You must provide a JSON payload',
        })
      )
      .test(
        'valid-json',
        intl.formatMessage({
          id: 'notifications.webhook.payloadInvalidJson',
          defaultMessage: 'You must provide valid JSON',
        }),
        (value) => {
          if (!value || !value.trim()) return true;

          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }
      )
      .test(
        'non-empty-json-object',
        intl.formatMessage({
          id: 'notifications.webhook.payloadEmptyJson',
          defaultMessage: 'JSON payload must not be empty',
        }),
        (value) => {
          if (!value || !value.trim()) return true;

          try {
            const parsed = JSON.parse(value);
            return (
              typeof parsed === 'object' &&
              parsed !== null &&
              !Array.isArray(parsed) &&
              Object.keys(parsed).length > 0
            );
          } catch {
            return true;
          }
        }
      ),
  });

  return (
    <Formik
      enableReinitialize
      validationSchema={WebhookSchema}
      initialValues={{
        enabled: data?.enabled ?? false,
        types: (data?.types as number | undefined) ?? 0,
        webhookUrl: data?.options?.webhookUrl ?? '',
        authHeader: data?.options?.authHeader ?? '',
        customHeaders: (data?.options?.customHeaders ?? []) as {
          key: string;
          value: string;
        }[],
        jsonPayload: data?.options?.jsonPayload || DEFAULT_PAYLOAD,
      }}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/webhook', {
            enabled: values.enabled,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              authHeader: values.authHeader || undefined,
              customHeaders: values.customHeaders.filter((h) => h.key),
              jsonPayload: values.jsonPayload,
            },
          });

          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveSuccess',
                defaultMessage:
                  '{provider} notification settings saved successfully!',
              },
              { provider: providerName }
            ),
            icon: <CheckBadgeIcon className="size-7" />,
            type: 'success',
          });
        } catch {
          Toast({
            title: intl.formatMessage(
              {
                id: 'notifications.provider.saveError',
                defaultMessage:
                  '{provider} notification settings failed to save.',
              },
              { provider: providerName }
            ),
            icon: <XMarkIcon className="size-7" />,
            type: 'error',
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({
        isSubmitting,
        values,
        setFieldValue,
        setFieldTouched,
        errors,
        touched,
        isValid,
      }) => {
        const testSettings = async () => {
          setIsTesting(true);
          try {
            await axios.post('/api/v1/settings/notifications/webhook/test', {
              enabled: true,
              types: values.types,
              options: {
                webhookUrl: values.webhookUrl,
                authHeader: values.authHeader || undefined,
                customHeaders: values.customHeaders.filter((h) => h.key),
                jsonPayload: values.jsonPayload,
              },
            });

            Toast({
              title: intl.formatMessage(
                {
                  id: 'notifications.provider.testSuccess',
                  defaultMessage: '{provider} test notification sent!',
                },
                { provider: providerName }
              ),
              icon: <CheckBadgeIcon className="size-7" />,
              type: 'success',
            });
          } catch {
            Toast({
              title: intl.formatMessage(
                {
                  id: 'notifications.provider.testError',
                  defaultMessage:
                    '{provider} test notification failed to send.',
                },
                { provider: providerName }
              ),
              icon: <XMarkIcon className="size-7" />,
              type: 'error',
            });
          } finally {
            setIsTesting(false);
          }
        };

        const hasAuthHeaderConflict =
          !!values.authHeader &&
          values.customHeaders.some(
            (h) => h.key.toLowerCase() === 'authorization'
          );

        return (
          <Form>
            <div className="mt-5">
              <div className="space-y-4 max-w-5xl">
                <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 max-sm:space-y-4 max-sm:space-y-reverse">
                  <label htmlFor="enabled">
                    <FormattedMessage
                      id="notifications.enableAgent"
                      defaultMessage="Enable Agent"
                    />
                  </label>
                  <div className="sm:col-span-2 mt-2 sm:mt-0">
                    <Field
                      id="enabled"
                      name="enabled"
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary rounded-md"
                    />
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <label htmlFor="webhookUrl">
                    <FormattedMessage
                      id="notifications.fields.webhookUrl"
                      defaultMessage="Webhook URL"
                    />
                    <span className="ml-1 text-error">*</span>
                  </label>
                  <div className="sm:col-span-2 mt-2 sm:mt-0">
                    <Field
                      id="webhookUrl"
                      name="webhookUrl"
                      type="text"
                      className="input input-sm input-primary rounded-md w-full"
                    />
                    {errors.webhookUrl &&
                      touched.webhookUrl &&
                      typeof errors.webhookUrl === 'string' && (
                        <div className="text-error text-sm mt-1">
                          {errors.webhookUrl}
                        </div>
                      )}
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <label htmlFor="authHeader">
                    <FormattedMessage
                      id="notifications.fields.authorizationHeader"
                      defaultMessage="Authorization Header"
                    />
                  </label>
                  <div className="sm:col-span-2 mt-2 sm:mt-0">
                    <Field
                      id="authHeader"
                      name="authHeader"
                      type="text"
                      className="input input-sm input-primary rounded-md w-full"
                    />
                    {hasAuthHeaderConflict && (
                      <p className="mt-1 text-xs text-warning">
                        <FormattedMessage
                          id="notifications.webhook.authHeaderConflict"
                          defaultMessage="You cannot use both the Authorization Header field and an 'Authorization' custom header. Remove one."
                        />
                      </p>
                    )}
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <label htmlFor="customHeaders">
                    <FormattedMessage
                      id="notifications.webhook.customHeaders"
                      defaultMessage="Custom Headers"
                    />
                  </label>
                  <div className="sm:col-span-2 space-y-2">
                    <FieldArray name="customHeaders">
                      {({ push, remove }) => (
                        <>
                          {values.customHeaders.map((_, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-x-2 sm:items-start">
                                <div>
                                  <Field
                                    name={`customHeaders.${idx}.key`}
                                    type="text"
                                    placeholder={intl.formatMessage({
                                      id: 'notifications.webhook.headerName',
                                      defaultMessage: 'Header Name',
                                    })}
                                    className="input input-sm input-primary rounded-md w-full"
                                  />
                                  <div className="text-xs text-error mt-1">
                                    {getIn(
                                      touched,
                                      `customHeaders.${idx}.key`
                                    ) &&
                                      typeof getIn(
                                        errors,
                                        `customHeaders.${idx}.key`
                                      ) === 'string' &&
                                      getIn(errors, `customHeaders.${idx}.key`)}
                                  </div>
                                </div>
                                <div>
                                  <Field
                                    name={`customHeaders.${idx}.value`}
                                    type="text"
                                    placeholder={intl.formatMessage({
                                      id: 'notifications.webhook.headerValue',
                                      defaultMessage: 'Value',
                                    })}
                                    className="input input-sm input-primary rounded-md w-full"
                                  />
                                  <div className="text-xs text-error mt-1">
                                    {getIn(
                                      touched,
                                      `customHeaders.${idx}.value`
                                    ) &&
                                      typeof getIn(
                                        errors,
                                        `customHeaders.${idx}.value`
                                      ) === 'string' &&
                                      getIn(
                                        errors,
                                        `customHeaders.${idx}.value`
                                      )}
                                  </div>
                                </div>
                                <div className="justify-self-stretch sm:justify-self-end sm:row-span-2 sm:self-start">
                                  <Button
                                    type="button"
                                    buttonSize="sm"
                                    buttonType="error"
                                    className="max-sm:w-full max-sm:justify-center"
                                    onClick={() => remove(idx)}
                                    aria-label={intl.formatMessage({
                                      id: 'notifications.webhook.removeHeader',
                                      defaultMessage: 'Remove header',
                                    })}
                                  >
                                    <TrashIcon className="size-4" />
                                    <span className="sm:hidden ml-1">
                                      <FormattedMessage
                                        id="common.removeHeader"
                                        defaultMessage="Remove"
                                      />
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            type="button"
                            buttonSize="sm"
                            buttonType="ghost"
                            className="max-sm:w-full"
                            onClick={() => push({ key: '', value: '' })}
                          >
                            <PlusIcon className="size-4 mr-1" />
                            <FormattedMessage
                              id="notifications.webhook.addHeader"
                              defaultMessage="Add Header"
                            />
                          </Button>
                        </>
                      )}
                    </FieldArray>
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <label htmlFor="jsonPayload">
                    <FormattedMessage
                      id="notifications.fields.jsonPayload"
                      defaultMessage="JSON Payload"
                    />
                    <span className="ml-1 text-error">*</span>
                  </label>
                  <div className="sm:col-span-2 mt-2 sm:mt-0">
                    <ResetPayloadButton />
                    <JSONEditor
                      value={values.jsonPayload}
                      fontSize={14}
                      onChange={(val) => {
                        setFieldValue('jsonPayload', val);
                        setFieldTouched('jsonPayload', true, false);
                      }}
                    />
                    {getIn(touched, 'jsonPayload') &&
                      typeof getIn(errors, 'jsonPayload') === 'string' && (
                        <div className="text-error text-sm mt-1">
                          {getIn(errors, 'jsonPayload')}
                        </div>
                      )}
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <div />
                  <div className="sm:col-span-2">
                    <TemplateVarsPanel />
                  </div>
                </div>
                <NotificationTypeSelector
                  currentTypes={values.enabled ? values.types : 0}
                  onUpdate={(newTypes) => {
                    setFieldValue('types', newTypes);
                    setFieldTouched('types');
                    if (newTypes) {
                      setFieldValue('enabled', true);
                    }
                  }}
                  error={
                    values.enabled && !values.types && touched.types
                      ? intl.formatMessage({
                          id: 'notifications.validation.typesRequired',
                          defaultMessage:
                            'You must select at least one notification type.',
                        })
                      : undefined
                  }
                />
              </div>
              <div className="divider divider-primary mb-0" />
              <div className="flex justify-end gap-3">
                <Button
                  buttonSize="sm"
                  buttonType="warning"
                  disabled={
                    isSubmitting ||
                    !isValid ||
                    isTesting ||
                    hasAuthHeaderConflict
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    testSettings();
                  }}
                >
                  <BeakerIcon className="size-5 mr-2" />
                  <FormattedMessage id="common.test" defaultMessage="Test" />
                </Button>
                <Button
                  buttonSize="sm"
                  buttonType="primary"
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !isValid ||
                    isTesting ||
                    hasAuthHeaderConflict ||
                    (values.enabled && !values.types)
                  }
                >
                  <ArrowDownTrayIcon className="size-5 mr-2" />
                  <FormattedMessage
                    id="common.saveChanges"
                    defaultMessage="Save Changes"
                  />
                </Button>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default WebhookNotifications;
