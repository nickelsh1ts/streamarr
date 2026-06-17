'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import NotificationTypeSelector from '@app/components/Common/NotificationTypeSelector';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import type { User } from '@app/hooks/useUser';
import { ArrowDownTrayIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon, XMarkIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

export type NotificationSelectOption = {
  value: string;
  label: ReactNode;
};

export type NotificationField = {
  name: string;
  label: ReactNode;
  type: 'text' | 'password' | 'number' | 'checkbox' | 'textarea' | 'select';
  placeholder?: string;
  /** Options for `type: 'select'` fields. */
  options?: NotificationSelectOption[];
  /** Explicitly disable this field (e.g. while sounds are loading). */
  disabled?: boolean;
  /** Parse this field as a number before sending to the API (useful for select fields with numeric option values). */
  castToNumber?: boolean;
  /** Mark this field as required when the agent is enabled. Shows a red asterisk and validates via Yup. */
  required?: boolean;
  /** Default value used for initialValues when data has no stored value. Defaults to '' (or false for checkbox). */
  defaultValue?: string;
  /**
   * One or more conditions that must be satisfied before this field is shown.
   * Prefix with `!` to negate. Use `fieldName=value` to require an exact value.
   * All entries must pass (AND logic — same as permission array checks).
   */
  requires?: string | string[];
  /** Custom error message to display when this required field is empty. If omitted, uses generic 'This field is required.' message. */
  requiredMessage?: string;
};

const isVisible = (
  field: NotificationField,
  values: Record<string, unknown>
): boolean => {
  if (!field.requires) return true;
  const reqs = Array.isArray(field.requires)
    ? field.requires
    : [field.requires];
  return reqs.every((req) => {
    const negate = req.startsWith('!');
    const bare = negate ? req.slice(1) : req;
    const eqIdx = bare.indexOf('=');
    if (eqIdx !== -1) {
      const fieldName = bare.slice(0, eqIdx);
      const expected = bare.slice(eqIdx + 1);
      const match = values[fieldName] === expected;
      return negate ? !match : match;
    }
    return negate ? !values[bare] : Boolean(values[bare]);
  });
};

type ProviderNotificationsFormProps = {
  user?: User;
  endpoint: string;
  providerName: string;
  fields: NotificationField[];
  /** Optional: provide your own validation schema for full control. If provided, overrides default field-based schema generation. */
  validationSchema?: Yup.Schema;
};

const ProviderNotificationsForm = ({
  user,
  endpoint,
  providerName,
  fields,
  validationSchema: externalSchema,
}: ProviderNotificationsFormProps) => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);
  const { data, error, mutate: revalidate } = useSWR(endpoint);

  const requiredMessage = intl.formatMessage({
    id: 'validation.required',
    defaultMessage: 'This field is required.',
  });

  const hasValue = (value: unknown) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return value !== undefined && value !== null;
  };

  const requiredFields = fields.filter((f) => f.required);

  const typesRequiredMessage = intl.formatMessage({
    id: 'notifications.validation.typesRequired',
    defaultMessage: 'You must select at least one notification type.',
  });

  // Build validation schema if external schema is not provided
  const validationSchema =
    externalSchema ||
    Yup.object().shape({
      ...requiredFields.reduce<Record<string, Yup.StringSchema>>(
        (acc, field) => {
          acc[field.name] = Yup.string().test(
            'required-if-visible',
            field.requiredMessage || requiredMessage,
            function (value) {
              const values = this.parent as Record<string, unknown>;
              if (!Boolean(values.enabled) || !isVisible(field, values)) {
                return true;
              }

              return hasValue(value);
            }
          );
          return acc;
        },
        {}
      ),
    });

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  const buildOptions = (values: Record<string, unknown>) =>
    fields.reduce<Record<string, unknown>>((acc, field) => {
      const value = values[field.name];
      acc[field.name] =
        field.type === 'number' || field.castToNumber
          ? value === ''
            ? undefined
            : Number(value)
          : value;
      return acc;
    }, {});

  return (
    <Formik
      enableReinitialize
      initialValues={{
        enabled: data?.enabled ?? false,
        types: (data?.types as number | undefined) ?? 0,
        ...fields.reduce(
          (acc, field) => ({
            ...acc,
            [field.name]:
              data?.options?.[field.name] ??
              (field.type === 'checkbox' ? false : (field.defaultValue ?? '')),
          }),
          {}
        ),
      }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        try {
          await axios.post(endpoint, {
            enabled: values.enabled,
            types: values.types,
            options: buildOptions(values),
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
        errors,
        touched,
        isValid,
        setFieldValue,
        setFieldTouched,
      }) => {
        const testSettings = async () => {
          setIsTesting(true);

          try {
            await axios.post(`${endpoint}/test`, {
              enabled: true,
              types: values.types,
              options: buildOptions(values),
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

        return (
          <Form>
            <div className="mt-5">
              <div className="max-w-5xl space-y-4">
                <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
                  <label htmlFor="enabled">
                    <FormattedMessage
                      id="notifications.enableAgent"
                      defaultMessage="Enable Agent"
                    />
                  </label>
                  <div className="mt-2 sm:col-span-2 sm:mt-0">
                    <Field
                      id="enabled"
                      name="enabled"
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary rounded-md"
                    />
                  </div>
                </div>
                {fields.map((field) =>
                  isVisible(field, values as Record<string, unknown>) ? (
                    <div
                      key={field.name}
                      className="sm:grid sm:grid-cols-3 sm:gap-4"
                    >
                      <label htmlFor={field.name}>
                        {field.label}
                        {field.required && (
                          <span className="text-error ml-1">*</span>
                        )}
                      </label>
                      <div className="mt-2 sm:col-span-2 sm:mt-0">
                        {field.type === 'checkbox' ? (
                          <Field
                            id={field.name}
                            name={field.name}
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary rounded-md"
                          />
                        ) : field.type === 'textarea' ? (
                          <Field
                            id={field.name}
                            name={field.name}
                            as="textarea"
                            rows={4}
                            className="textarea textarea-sm textarea-primary w-full rounded-md"
                            placeholder={field.placeholder}
                          />
                        ) : field.type === 'password' ? (
                          <div className="flex">
                            <SensitiveInput
                              as="field"
                              id={field.name}
                              name={field.name}
                              buttonSize="sm"
                              className="input input-sm input-primary w-full rounded-md"
                              placeholder={field.placeholder}
                            />
                          </div>
                        ) : field.type === 'select' ? (
                          <Field
                            id={field.name}
                            name={field.name}
                            as="select"
                            className="select select-sm select-primary w-auto min-w-36 shrink-0 rounded-md"
                            disabled={field.disabled}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Field>
                        ) : (
                          <Field
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            className={`input input-sm input-primary rounded-md ${field.type === 'number' ? 'w-1/6' : 'w-full'}`}
                            placeholder={field.placeholder}
                          />
                        )}
                        {errors[field.name] &&
                          touched[field.name] &&
                          typeof errors[field.name] === 'string' && (
                            <div className="text-error mt-1 text-sm">
                              {errors[field.name] as string}
                            </div>
                          )}
                      </div>
                    </div>
                  ) : null
                )}
                <NotificationTypeSelector
                  user={user ? user : null}
                  currentTypes={
                    values.enabled ? (values.types as number) || 0 : 0
                  }
                  onUpdate={(newTypes) => {
                    setFieldValue('types', newTypes);
                    setFieldTouched('types');
                    if (newTypes) {
                      setFieldValue('enabled', true);
                    }
                  }}
                  error={
                    !user && values.enabled && !values.types && touched.types
                      ? typesRequiredMessage
                      : undefined
                  }
                />
              </div>
              <div className="divider divider-primary mb-0" />
              <div className="flex justify-end gap-3">
                <Button
                  buttonSize="sm"
                  buttonType="warning"
                  disabled={isSubmitting || !isValid || isTesting}
                  onClick={(e) => {
                    e.preventDefault();
                    testSettings();
                  }}
                >
                  <BeakerIcon className="mr-2 size-5" />
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
                    (!user && values.enabled && !values.types)
                  }
                >
                  <ArrowDownTrayIcon className="mr-2 size-5" />
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

export default ProviderNotificationsForm;
