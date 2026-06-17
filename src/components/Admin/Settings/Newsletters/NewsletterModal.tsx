'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import Toggle from '@app/components/Common/Toggle';
import Tooltip from '@app/components/Common/ToolTip';
import UserSelector from '@app/components/Common/UserSelector';
import Toast from '@app/components/Toast';
import useLocale from '@app/hooks/useLocale';
import type { User } from '@app/hooks/useUser';
import { registerDatePickerLocale } from '@app/utils/datepickerLocale';
import { ClockIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type Newsletter from '@server/entity/Newsletter';
import type { RecentlyAddedTypeConfig } from '@server/entity/Newsletter';
import type { NewsletterVariablesResponse } from '@server/interfaces/api/newsletterInterfaces';
import type { UserResultsResponse } from '@server/interfaces/api/userInterfaces';
import type { Library, PlexSettings } from '@server/lib/settings';
import axios from 'axios';
import cronstrue from 'cronstrue';
import { Field, Form, Formik } from 'formik';
import { forwardRef, useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

interface NewsletterModalProps {
  show: boolean;
  newsletter?: Newsletter | null;
  onClose: () => void;
  onSave: () => void;
}

const DatePickerInput = forwardRef<
  HTMLInputElement,
  {
    value?: string;
    onClick?: () => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    icon: React.ReactNode;
    invalid?: boolean;
  }
>(({ value, onClick, onChange, placeholder, icon, invalid }, ref) => (
  <div
    className={`input input-sm relative flex w-full items-center gap-2 ${
      invalid ? 'input-error' : 'input-primary'
    }`}
    onClick={onClick}
  >
    {icon}
    <input
      ref={ref}
      type="text"
      readOnly
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="grow cursor-pointer bg-transparent focus:outline-none"
    />
  </div>
));
DatePickerInput.displayName = 'DatePickerInput';

const RECENTLY_ADDED_TYPES: {
  key: string;
  match: Library['type'][];
}[] = [
  { key: 'movie', match: ['movie'] },
  { key: 'show', match: ['show'] },
  { key: 'artist', match: ['artist'] },
  { key: 'photo', match: ['photo'] },
  { key: 'other', match: ['other'] },
];

const TOP_STREAMS_TYPES: {
  key: string;
  match: Library['type'][];
}[] = [
  { key: 'movie', match: ['movie'] },
  { key: 'show', match: ['show'] },
  { key: 'artist', match: ['artist'] },
];

const NewsletterModal = ({
  show,
  newsletter,
  onClose,
  onSave,
}: NewsletterModalProps) => {
  const intl = useIntl();
  const { locale } = useLocale();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    registerDatePickerLocale(locale);
  }, [locale]);
  const datePickerLocale = locale !== 'en' ? locale : undefined;

  // Static (literal) labels so FormatJS can extract them.
  const recentlyAddedLabel = (key: string): string => {
    switch (key) {
      case 'movie':
        return intl.formatMessage({
          id: 'newsletters.recentMovies',
          defaultMessage: 'Recently Added Movies',
        });
      case 'show':
        return intl.formatMessage({
          id: 'newsletters.recentShows',
          defaultMessage: 'Recently Added TV Shows',
        });
      case 'artist':
        return intl.formatMessage({
          id: 'newsletters.recentMusic',
          defaultMessage: 'Recently Added Music',
        });
      case 'photo':
        return intl.formatMessage({
          id: 'newsletters.recentPhotos',
          defaultMessage: 'Recently Added Photos',
        });
      default:
        return intl.formatMessage({
          id: 'newsletters.recentOther',
          defaultMessage: 'Recently Added',
        });
    }
  };

  const topStreamsLabel = (key: string): string => {
    switch (key) {
      case 'movie':
        return intl.formatMessage({
          id: 'newsletters.topMovies',
          defaultMessage: 'Top Movies',
        });
      case 'show':
        return intl.formatMessage({
          id: 'newsletters.topShows',
          defaultMessage: 'Top TV Shows',
        });
      default:
        return intl.formatMessage({
          id: 'newsletters.topMusic',
          defaultMessage: 'Top Music',
        });
    }
  };

  const { data: variables } = useSWR<NewsletterVariablesResponse>(
    show ? '/api/v1/settings/newsletter/variables' : null
  );
  const { data: userData } = useSWR<UserResultsResponse>(
    show ? '/api/v1/user?take=1000&sort=displayname' : null
  );
  const { data: plexSettings } = useSWR<PlexSettings>(
    show ? '/api/v1/settings/plex' : null
  );

  const libraries = plexSettings?.libraries.filter((l) => l.enabled) ?? [];

  // Only show recently-added type sections for which at least one enabled
  // library of that type exists.
  const availableTypes = RECENTLY_ADDED_TYPES.filter((type) =>
    libraries.some((library) => type.match.includes(library.type))
  );

  const availableTopStreamTypes = TOP_STREAMS_TYPES.filter((type) =>
    libraries.some((library) => type.match.includes(library.type))
  );

  const librariesForType = (type: { match: Library['type'][] }) =>
    libraries.filter((library) => type.match.includes(library.type));

  const savedRecipientIds = newsletter?.recipientIds ?? [];
  const initialRecipientUsers: User[] = userData?.results
    ? userData.results.filter((user) => savedRecipientIds.includes(user.id))
    : [];

  const insertToken = (
    token: string,
    values: { body: string },
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const textarea = bodyRef.current;

    if (!textarea) {
      setFieldValue('body', `${values.body}${token}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = values.body.slice(0, start) + token + values.body.slice(end);
    setFieldValue('body', next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
    });
  };

  const newsletterSchema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage({
        id: 'newsletters.validation.nameRequired',
        defaultMessage: 'Name is required',
      })
    ),
    subject: Yup.string().required(
      intl.formatMessage({
        id: 'newsletters.validation.subjectRequired',
        defaultMessage: 'Subject is required',
      })
    ),
    cronSchedule: Yup.string().when(['enabled', 'scheduleType'], {
      is: (enabled: boolean, scheduleType: string) =>
        enabled && scheduleType === 'recurring',
      then: (schema) =>
        schema
          .required(
            intl.formatMessage({
              id: 'newsletters.validation.cronRequired',
              defaultMessage:
                'A schedule is required for recurring newsletters',
            })
          )
          .test(
            'cron-fields',
            intl.formatMessage({
              id: 'newsletters.validation.cronInvalid',
              defaultMessage: 'Enter a valid cron schedule (5 fields).',
            }),
            (value) => !value || value.trim().split(/\s+/).length === 5
          )
          .test(
            'cron-frequency',
            intl.formatMessage({
              id: 'newsletters.validation.cronTooFrequent',
              defaultMessage: 'Newsletters can run at most once per hour.',
            }),
            (value) => {
              if (!value) {
                return true;
              }
              // Minute field must be a single fixed value — a wildcard, step
              // (*/n), range (a-b), or list (a,b) would fire more than hourly.
              return /^\d+$/.test(value.trim().split(/\s+/)[0]);
            }
          ),
    }),
    sendAt: Yup.date()
      .nullable()
      .when(['enabled', 'scheduleType'], {
        is: (enabled: boolean, scheduleType: string) =>
          enabled && scheduleType === 'once',
        then: (schema) =>
          schema.required(
            intl.formatMessage({
              id: 'newsletters.validation.sendAtRequired',
              defaultMessage: 'A date is required for one-time newsletters',
            })
          ),
      }),
  });

  // Build initial per-type recently-added config from the saved newsletter.
  const initialRecentlyAdded: Record<string, RecentlyAddedTypeConfig> = {};
  for (const type of RECENTLY_ADDED_TYPES) {
    const saved = newsletter?.blocks?.recentlyAdded?.[type.key];
    initialRecentlyAdded[type.key] = {
      enabled: saved?.enabled ?? false,
      days: saved?.days ?? 7,
      count: saved?.count ?? 6,
      libraries: saved?.libraries ?? [],
      header: saved?.header ?? '',
    };
  }

  // Build initial per-type top-streams config from the saved newsletter.
  const initialTopStreams: Record<string, RecentlyAddedTypeConfig> = {};
  for (const type of TOP_STREAMS_TYPES) {
    const saved = newsletter?.blocks?.topStreams?.[type.key];
    initialTopStreams[type.key] = {
      enabled: saved?.enabled ?? false,
      days: saved?.days ?? 7,
      count: saved?.count ?? 5,
      libraries: saved?.libraries ?? [],
      header: saved?.header ?? '',
    };
  }

  const buildSubmission = (values: FormValues) => ({
    name: values.name,
    subject: values.subject,
    description: values.description,
    body: values.body,
    bodyFormat: values.bodyFormat,
    blocks: {
      recentlyAdded: values.recentlyAdded,
      topStreams: values.topStreams,
      byTag: {
        header: values.byTagHeader,
        count: Number(values.byTagCount),
        plex: {
          enabled: values.byTagPlexEnabled,
          label: values.byTagPlexLabel,
          libraries: values.byTagPlexLibraries,
        },
        servarr: {
          enabled: values.byTagServarrEnabled,
          radarrTag: values.byTagRadarrTag,
          sonarrTag: values.byTagSonarrTag,
        },
      },
    },
    recipientMode: values.recipientMode,
    recipientIds: values.recipientUsers.map((user) => user.id),
    isImportant: values.isImportant,
    enabled: values.enabled,
    scheduleType: values.scheduleType,
    cronSchedule:
      values.scheduleType === 'recurring' ? values.cronSchedule : null,
    sendAt:
      values.scheduleType === 'once' && values.sendAt
        ? values.sendAt.toISOString()
        : null,
  });

  interface FormValues {
    name: string;
    subject: string;
    description: string;
    body: string;
    bodyFormat: 'markdown' | 'html';
    recentlyAdded: Record<string, RecentlyAddedTypeConfig>;
    topStreams: Record<string, RecentlyAddedTypeConfig>;
    byTagPlexEnabled: boolean;
    byTagPlexLabel: string;
    byTagPlexLibraries: string[];
    byTagServarrEnabled: boolean;
    byTagRadarrTag: string;
    byTagSonarrTag: string;
    byTagCount: number;
    byTagHeader: string;
    recipientMode: 'all' | 'custom';
    recipientUsers: User[];
    isImportant: boolean;
    enabled: boolean;
    scheduleType: 'once' | 'recurring';
    cronSchedule: string;
    sendAt: Date | null;
  }

  return (
    <Formik<FormValues>
      enableReinitialize
      initialValues={{
        name: newsletter?.name ?? '',
        subject: newsletter?.subject ?? '',
        description: newsletter?.description ?? '',
        body: newsletter?.body ?? '',
        bodyFormat: newsletter?.bodyFormat ?? 'markdown',
        recentlyAdded: initialRecentlyAdded,
        topStreams: initialTopStreams,
        byTagPlexEnabled: newsletter?.blocks?.byTag?.plex?.enabled ?? false,
        byTagPlexLabel: newsletter?.blocks?.byTag?.plex?.label ?? '',
        byTagPlexLibraries: newsletter?.blocks?.byTag?.plex?.libraries ?? [],
        byTagServarrEnabled:
          newsletter?.blocks?.byTag?.servarr?.enabled ?? false,
        byTagRadarrTag: newsletter?.blocks?.byTag?.servarr?.radarrTag ?? '',
        byTagSonarrTag: newsletter?.blocks?.byTag?.servarr?.sonarrTag ?? '',
        byTagCount: newsletter?.blocks?.byTag?.count ?? 12,
        byTagHeader: newsletter?.blocks?.byTag?.header ?? '',
        recipientMode: newsletter?.recipientMode ?? 'all',
        recipientUsers: initialRecipientUsers,
        isImportant: newsletter?.isImportant ?? false,
        enabled: newsletter?.enabled ?? false,
        scheduleType: newsletter?.scheduleType ?? 'recurring',
        cronSchedule: newsletter?.cronSchedule ?? '0 9 * * 1',
        sendAt: newsletter?.sendAt ? new Date(newsletter.sendAt) : null,
      }}
      validationSchema={newsletterSchema}
      onSubmit={async (values) => {
        try {
          const submission = buildSubmission(values);

          if (newsletter) {
            await axios.put(
              `/api/v1/settings/newsletter/${newsletter.id}`,
              submission
            );
          } else {
            await axios.post('/api/v1/settings/newsletter', submission);
          }

          onSave();
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'newsletters.saveError',
              defaultMessage: 'There was an error saving the newsletter',
            }),
            message:
              e?.response?.data?.message ??
              (e instanceof Error ? e.message : ''),
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
        let cronPreview = '';
        if (values.scheduleType === 'recurring' && values.cronSchedule) {
          try {
            cronPreview = cronstrue.toString(values.cronSchedule);
          } catch {
            cronPreview = intl.formatMessage({
              id: 'newsletters.invalidCron',
              defaultMessage: 'Invalid schedule expression',
            });
          }
        }

        const previewNewsletter = async () => {
          try {
            const response = await axios.post(
              '/api/v1/settings/newsletter/preview',
              buildSubmission(values),
              { responseType: 'text' }
            );
            setPreviewHtml(response.data);
          } catch (e) {
            Toast({
              title: intl.formatMessage({
                id: 'newsletters.previewError',
                defaultMessage: 'Unable to generate preview',
              }),
              message:
                e?.response?.data?.message ??
                (e instanceof Error ? e.message : ''),
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
            });
          }
        };

        const setRecentlyAdded = (
          key: string,
          patch: Partial<RecentlyAddedTypeConfig>
        ) => {
          setFieldValue('recentlyAdded', {
            ...values.recentlyAdded,
            [key]: { ...values.recentlyAdded[key], ...patch },
          });
        };

        const setTopStreams = (
          key: string,
          patch: Partial<RecentlyAddedTypeConfig>
        ) => {
          setFieldValue('topStreams', {
            ...values.topStreams,
            [key]: { ...values.topStreams[key], ...patch },
          });
        };

        return (
          <>
            <Modal
              show={show && !previewHtml}
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
                      defaultMessage: 'Saving…',
                    })
                  : intl.formatMessage({
                      id: 'common.save',
                      defaultMessage: 'Save',
                    })
              }
              onOk={() => handleSubmit()}
              okDisabled={isSubmitting || !isValid}
              secondaryButtonType="default"
              secondaryText={intl.formatMessage({
                id: 'common.preview',
                defaultMessage: 'Preview',
              })}
              onSecondary={() => previewNewsletter()}
              title={
                newsletter
                  ? intl.formatMessage({
                      id: 'newsletters.editNewsletter',
                      defaultMessage: 'Edit Newsletter',
                    })
                  : intl.formatMessage({
                      id: 'newsletters.createNewsletter',
                      defaultMessage: 'Create Newsletter',
                    })
              }
            >
              <Form className="space-y-3">
                <div className="border-primary border-t pt-4">
                  <label
                    htmlFor="name"
                    className="block text-left text-sm leading-6 font-medium"
                  >
                    <FormattedMessage id="common.name" defaultMessage="Name" />
                    <span className="text-error ml-1">*</span>
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    className={`input input-sm input-primary w-full rounded-md ${
                      errors.name && touched.name ? 'input-error' : ''
                    }`}
                  />
                  {errors.name && touched.name && (
                    <div className="text-error">{errors.name}</div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-left text-sm leading-6 font-medium"
                  >
                    <FormattedMessage
                      id="newsletters.subject"
                      defaultMessage="Email Subject"
                    />
                    <span className="text-error ml-1">*</span>
                  </label>
                  <Field
                    id="subject"
                    name="subject"
                    type="text"
                    className={`input input-sm input-primary w-full rounded-md ${
                      errors.subject && touched.subject ? 'input-error' : ''
                    }`}
                  />
                  {errors.subject && touched.subject && (
                    <div className="text-error">{errors.subject}</div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-left text-sm leading-6 font-medium"
                  >
                    <FormattedMessage
                      id="newsletters.descriptionLabel"
                      defaultMessage="Description"
                    />
                  </label>
                  <Field
                    as="textarea"
                    id="description"
                    name="description"
                    rows={2}
                    className="input input-sm input-primary h-auto w-full rounded-md py-2"
                  />
                  <p className="text-neutral mt-1 text-left text-sm">
                    <FormattedMessage
                      id="newsletters.descriptionTip"
                      defaultMessage="Shown to users under this newsletter in their subscription settings."
                    />
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="bodyFormat"
                    className="block text-left text-sm leading-6 font-medium"
                  >
                    <FormattedMessage
                      id="newsletters.bodyFormat"
                      defaultMessage="Body Format"
                    />
                  </label>
                  <Field
                    as="select"
                    id="bodyFormat"
                    name="bodyFormat"
                    className="select select-sm select-primary w-full"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                  </Field>
                </div>

                <div>
                  <label
                    htmlFor="body"
                    className="block text-left text-sm leading-6 font-medium"
                  >
                    <FormattedMessage
                      id="newsletters.body"
                      defaultMessage="Body"
                    />
                  </label>
                  {variables && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {[...variables.tokens, ...variables.blocks].map(
                        (variable) => (
                          <Button
                            type="button"
                            buttonType="ghost"
                            buttonSize="xs"
                            key={variable.token}
                            title={variable.description}
                            onClick={() =>
                              insertToken(variable.token, values, setFieldValue)
                            }
                            className="btn-neutral"
                          >
                            {variable.token}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                  <Field name="body">
                    {({ field }) => (
                      <textarea
                        {...field}
                        id="body"
                        ref={bodyRef}
                        rows={6}
                        className="textarea textarea-sm textarea-primary w-full font-mono"
                      />
                    )}
                  </Field>
                </div>

                <div className="border-primary space-y-3 rounded-md border p-3">
                  <p className="text-sm font-semibold">
                    <FormattedMessage
                      id="newsletters.recentlyAdded"
                      defaultMessage="Recently Added"
                    />
                  </p>
                  {availableTypes.length === 0 && (
                    <p className="text-neutral text-sm">
                      <FormattedMessage
                        id="newsletters.noLibraries"
                        defaultMessage="No enabled Plex libraries were found."
                      />
                    </p>
                  )}
                  {availableTypes.map((type) => {
                    const config = values.recentlyAdded[type.key];
                    const typeLibraries = librariesForType(type);
                    return (
                      <div key={type.key}>
                        <Toggle
                          id={`recentlyAdded-${type.key}`}
                          valueOf={config.enabled}
                          onClick={() =>
                            setRecentlyAdded(type.key, {
                              enabled: !config.enabled,
                            })
                          }
                          title={recentlyAddedLabel(type.key)}
                        />
                        {config.enabled && (
                          <div className="mt-2 ml-2 space-y-2">
                            <div className="flex gap-4">
                              <div>
                                <label
                                  htmlFor={`recentlyAdded-${type.key}-days`}
                                  className="block"
                                >
                                  <FormattedMessage
                                    id="newsletters.pastDays"
                                    defaultMessage="Past Days"
                                  />
                                </label>
                                <input
                                  id={`recentlyAdded-${type.key}-days`}
                                  type="number"
                                  min={1}
                                  value={config.days ?? 7}
                                  onChange={(e) =>
                                    setRecentlyAdded(type.key, {
                                      days: Number(e.target.value),
                                    })
                                  }
                                  className="input input-sm input-primary w-24 rounded-md"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`recentlyAdded-${type.key}-count`}
                                  className="block"
                                >
                                  <FormattedMessage
                                    id="newsletters.maxItems"
                                    defaultMessage="Max Items"
                                  />
                                </label>
                                <input
                                  id={`recentlyAdded-${type.key}-count`}
                                  type="number"
                                  min={1}
                                  max={24}
                                  value={config.count ?? 6}
                                  onChange={(e) =>
                                    setRecentlyAdded(type.key, {
                                      count: Number(e.target.value),
                                    })
                                  }
                                  className="input input-sm input-primary w-24 rounded-md"
                                />
                              </div>
                            </div>
                            {typeLibraries.length > 1 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {typeLibraries
                                  .sort((a, b) => Number(a.id) - Number(b.id))
                                  .map((library) => {
                                    const checked = (
                                      config.libraries ?? []
                                    ).includes(library.id);
                                    return (
                                      <label
                                        key={library.id}
                                        className="flex items-center gap-1"
                                      >
                                        <input
                                          type="checkbox"
                                          className="checkbox checkbox-sm checkbox-primary"
                                          checked={checked}
                                          onChange={() =>
                                            setRecentlyAdded(type.key, {
                                              libraries: checked
                                                ? (
                                                    config.libraries ?? []
                                                  ).filter(
                                                    (id) => id !== library.id
                                                  )
                                                : [
                                                    ...(config.libraries ?? []),
                                                    library.id,
                                                  ],
                                            })
                                          }
                                        />
                                        {library.name}
                                      </label>
                                    );
                                  })}
                              </div>
                            )}
                            <div>
                              <label
                                htmlFor={`recentlyAdded-${type.key}-header`}
                                className="block"
                              >
                                <FormattedMessage
                                  id="newsletters.sectionHeader"
                                  defaultMessage="Section Header"
                                />
                              </label>
                              <input
                                id={`recentlyAdded-${type.key}-header`}
                                type="text"
                                value={config.header ?? ''}
                                placeholder={recentlyAddedLabel(type.key)}
                                onChange={(e) =>
                                  setRecentlyAdded(type.key, {
                                    header: e.target.value,
                                  })
                                }
                                className="input input-sm input-primary w-full rounded-md"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="border-primary space-y-3 rounded-md border p-3">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">
                      <FormattedMessage
                        id="newsletters.topStreams"
                        defaultMessage="Top Streams"
                      />
                    </p>
                    {availableTopStreamTypes.length === 0 && (
                      <p className="text-neutral text-sm">
                        <FormattedMessage
                          id="newsletters.noLibraries"
                          defaultMessage="No enabled Plex libraries were found."
                        />
                      </p>
                    )}
                    {availableTopStreamTypes.map((type) => {
                      const config = values.topStreams[type.key];
                      const typeLibraries = librariesForType(type);
                      return (
                        <div key={type.key}>
                          <Toggle
                            id={`topStreams-${type.key}`}
                            valueOf={config.enabled}
                            onClick={() =>
                              setTopStreams(type.key, {
                                enabled: !config.enabled,
                              })
                            }
                            title={topStreamsLabel(type.key)}
                          />
                          {config.enabled && (
                            <div className="mt-2 ml-2 space-y-2">
                              <div className="flex gap-4">
                                <div>
                                  <label
                                    htmlFor={`topStreams-${type.key}-days`}
                                    className="block"
                                  >
                                    <FormattedMessage
                                      id="newsletters.pastDays"
                                      defaultMessage="Past Days"
                                    />
                                  </label>
                                  <input
                                    id={`topStreams-${type.key}-days`}
                                    type="number"
                                    min={1}
                                    value={config.days ?? 7}
                                    onChange={(e) =>
                                      setTopStreams(type.key, {
                                        days: Number(e.target.value),
                                      })
                                    }
                                    className="input input-sm input-primary w-24 rounded-md"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`topStreams-${type.key}-count`}
                                    className="block"
                                  >
                                    <FormattedMessage
                                      id="newsletters.maxItems"
                                      defaultMessage="Max Items"
                                    />
                                  </label>
                                  <input
                                    id={`topStreams-${type.key}-count`}
                                    type="number"
                                    min={1}
                                    max={24}
                                    value={config.count ?? 5}
                                    onChange={(e) =>
                                      setTopStreams(type.key, {
                                        count: Number(e.target.value),
                                      })
                                    }
                                    className="input input-sm input-primary w-24 rounded-md"
                                  />
                                </div>
                              </div>
                              {typeLibraries.length > 1 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {typeLibraries
                                    .sort((a, b) => Number(a.id) - Number(b.id))
                                    .map((library) => {
                                      const checked = (
                                        config.libraries ?? []
                                      ).includes(library.id);
                                      return (
                                        <label
                                          key={library.id}
                                          className="flex items-center gap-1"
                                        >
                                          <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm checkbox-primary"
                                            checked={checked}
                                            onChange={() =>
                                              setTopStreams(type.key, {
                                                libraries: checked
                                                  ? (
                                                      config.libraries ?? []
                                                    ).filter(
                                                      (id) => id !== library.id
                                                    )
                                                  : [
                                                      ...(config.libraries ??
                                                        []),
                                                      library.id,
                                                    ],
                                              })
                                            }
                                          />
                                          {library.name}
                                        </label>
                                      );
                                    })}
                                </div>
                              )}
                              <div>
                                <label
                                  htmlFor={`topStreams-${type.key}-header`}
                                  className="block"
                                >
                                  <FormattedMessage
                                    id="newsletters.sectionHeader"
                                    defaultMessage="Section Header"
                                  />
                                </label>
                                <input
                                  id={`topStreams-${type.key}-header`}
                                  type="text"
                                  value={config.header ?? ''}
                                  placeholder={topStreamsLabel(type.key)}
                                  onChange={(e) =>
                                    setTopStreams(type.key, {
                                      header: e.target.value,
                                    })
                                  }
                                  className="input input-sm input-primary w-full rounded-md"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-primary space-y-3 rounded-md border p-3">
                  <p className="text-sm font-semibold">
                    <FormattedMessage
                      id="newsletters.byTag"
                      defaultMessage="By Tag"
                    />
                  </p>
                  <div>
                    <Toggle
                      id="byTagPlexEnabled"
                      valueOf={values.byTagPlexEnabled}
                      onClick={() =>
                        setFieldValue(
                          'byTagPlexEnabled',
                          !values.byTagPlexEnabled
                        )
                      }
                      title={intl.formatMessage({
                        id: 'newsletters.byPlexLabel',
                        defaultMessage: 'By Plex Label',
                      })}
                    />
                    {values.byTagPlexEnabled && (
                      <div className="mt-2 ml-2 space-y-2">
                        <div>
                          <label htmlFor="byTagPlexLabel" className="block">
                            <FormattedMessage
                              id="newsletters.plexLabel"
                              defaultMessage="Plex Label"
                            />
                          </label>
                          <Field
                            id="byTagPlexLabel"
                            type="text"
                            name="byTagPlexLabel"
                            className="input input-sm input-primary w-full rounded-md"
                          />
                        </div>
                        {(() => {
                          const byTagLibraries = libraries.filter(
                            (library) =>
                              library.type === 'movie' ||
                              library.type === 'show'
                          );
                          if (byTagLibraries.length <= 1) {
                            return null;
                          }
                          return (
                            <div>
                              <p className="block">
                                <FormattedMessage
                                  id="newsletters.plexLabelLibraries"
                                  defaultMessage="Plex Label Libraries"
                                />
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {byTagLibraries
                                  .sort((a, b) => Number(a.id) - Number(b.id))
                                  .map((library) => {
                                    const checked =
                                      values.byTagPlexLibraries.includes(
                                        library.id
                                      );
                                    return (
                                      <label
                                        key={library.id}
                                        className="flex items-center gap-1"
                                      >
                                        <input
                                          type="checkbox"
                                          className="checkbox checkbox-sm checkbox-primary"
                                          checked={checked}
                                          onChange={() =>
                                            setFieldValue(
                                              'byTagPlexLibraries',
                                              checked
                                                ? values.byTagPlexLibraries.filter(
                                                    (id) => id !== library.id
                                                  )
                                                : [
                                                    ...values.byTagPlexLibraries,
                                                    library.id,
                                                  ]
                                            )
                                          }
                                        />
                                        {library.name}
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div>
                    <Toggle
                      id="byTagServarrEnabled"
                      valueOf={values.byTagServarrEnabled}
                      onClick={() =>
                        setFieldValue(
                          'byTagServarrEnabled',
                          !values.byTagServarrEnabled
                        )
                      }
                      title={intl.formatMessage({
                        id: 'newsletters.byServarrTag',
                        defaultMessage: 'By Radarr/Sonarr Tag',
                      })}
                    />
                    {values.byTagServarrEnabled && (
                      <div className="mt-2 ml-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <label htmlFor="byTagRadarrTag" className="block">
                            <FormattedMessage
                              id="newsletters.radarrTag"
                              defaultMessage="Radarr Tag"
                            />
                          </label>
                          <Field
                            id="byTagRadarrTag"
                            type="text"
                            name="byTagRadarrTag"
                            className="input input-sm input-primary w-full rounded-md"
                          />
                        </div>
                        <div>
                          <label htmlFor="byTagSonarrTag" className="block">
                            <FormattedMessage
                              id="newsletters.sonarrTag"
                              defaultMessage="Sonarr Tag"
                            />
                          </label>
                          <Field
                            id="byTagSonarrTag"
                            type="text"
                            name="byTagSonarrTag"
                            className="input input-sm input-primary w-full rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {(values.byTagPlexEnabled || values.byTagServarrEnabled) && (
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <label htmlFor="byTagCount" className="block">
                          <FormattedMessage
                            id="newsletters.maxItems"
                            defaultMessage="Max Items"
                          />
                        </label>
                        <Field
                          id="byTagCount"
                          type="number"
                          name="byTagCount"
                          min={1}
                          max={24}
                          className="input input-sm input-primary w-24 rounded-md"
                        />
                      </div>
                      <div className="grow">
                        <label htmlFor="byTagHeader" className="block">
                          <FormattedMessage
                            id="newsletters.sectionHeader"
                            defaultMessage="Section Header"
                          />
                        </label>
                        <Field
                          id="byTagHeader"
                          type="text"
                          name="byTagHeader"
                          className="input input-sm input-primary w-full rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="recipientMode"
                    className="block text-left text-sm leading-6 font-medium"
                  >
                    <FormattedMessage
                      id="newsletters.recipients"
                      defaultMessage="Recipients"
                    />
                  </label>
                  <Field
                    as="select"
                    id="recipientMode"
                    name="recipientMode"
                    className="select select-sm select-primary w-full"
                  >
                    <option value="all">
                      {intl.formatMessage({
                        id: 'newsletters.allSubscribers',
                        defaultMessage: 'All subscribed users',
                      })}
                    </option>
                    <option value="custom">
                      {intl.formatMessage({
                        id: 'newsletters.customRecipients',
                        defaultMessage: 'Specific users',
                      })}
                    </option>
                  </Field>
                  {values.recipientMode === 'custom' && (
                    <div className="mt-3">
                      <UserSelector
                        multiple
                        userData={userData?.results}
                        existingUser={initialRecipientUsers}
                        onChange={(users) => {
                          const usersArray = Array.isArray(users)
                            ? users
                            : users
                              ? [users]
                              : [];
                          setFieldValue('recipientUsers', usersArray);
                        }}
                        onBlur={() => setFieldTouched('recipientUsers', true)}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="inline-flex items-center space-x-2">
                    <Tooltip
                      className="z-1050"
                      content={intl.formatMessage({
                        id: 'newsletters.isImportantTooltip',
                        defaultMessage: 'No Opt-Out!',
                      })}
                    >
                      <span
                        id="isImportant"
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={values.isImportant}
                        onClick={() =>
                          setFieldValue('isImportant', !values.isImportant)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setFieldValue('isImportant', !values.isImportant);
                          }
                        }}
                        className={`${
                          values.isImportant ? 'bg-error' : 'bg-neutral'
                        } ring-error relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out hover:cursor-pointer focus:ring focus:outline-none`}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            values.isImportant
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                        >
                          <span
                            className={`${
                              values.isImportant
                                ? 'opacity-0 duration-100 ease-out'
                                : 'opacity-100 duration-200 ease-in'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <XMarkIcon className="text-neutral h-3 w-3" />
                          </span>
                          <span
                            className={`${
                              values.isImportant
                                ? 'opacity-100 duration-200 ease-in'
                                : 'opacity-0 duration-100 ease-out'
                            } text-extrabold text-error absolute inset-0 flex h-full w-full items-center justify-center text-lg transition-opacity`}
                          >
                            !
                          </span>
                        </span>
                      </span>
                    </Tooltip>
                    <label htmlFor="isImportant">
                      <FormattedMessage
                        id="newsletters.isImportant"
                        defaultMessage="Important!"
                      />
                    </label>
                  </div>
                  {values.isImportant && (
                    <Alert
                      title={intl.formatMessage({
                        id: 'newsletters.importantWarning',
                        defaultMessage:
                          'Important newsletters are delivered to every selected recipient. They will not be able to opt-out. Use sparingly.',
                      })}
                    />
                  )}
                </div>
                <div className="border-primary space-y-3 rounded-md border p-3">
                  <Toggle
                    id="enabled"
                    valueOf={values.enabled}
                    onClick={() => setFieldValue('enabled', !values.enabled)}
                    title={intl.formatMessage({
                      id: 'newsletters.scheduleEnabled',
                      defaultMessage: 'Enable schedule',
                    })}
                  />
                  {values.enabled && (
                    <>
                      <div>
                        <label
                          htmlFor="scheduleType"
                          className="block text-left text-sm leading-6 font-medium"
                        >
                          <FormattedMessage
                            id="newsletters.scheduleType"
                            defaultMessage="Schedule Type"
                          />
                        </label>
                        <Field
                          as="select"
                          id="scheduleType"
                          name="scheduleType"
                          className="select select-sm select-primary w-full"
                        >
                          <option value="recurring">
                            {intl.formatMessage({
                              id: 'newsletters.recurring',
                              defaultMessage: 'Recurring',
                            })}
                          </option>
                          <option value="once">
                            {intl.formatMessage({
                              id: 'newsletters.once',
                              defaultMessage: 'Once',
                            })}
                          </option>
                        </Field>
                      </div>
                      {values.scheduleType === 'recurring' ? (
                        <div>
                          <label
                            htmlFor="cronSchedule"
                            className="block text-left text-sm leading-6 font-medium"
                          >
                            <FormattedMessage
                              id="newsletters.cronSchedule"
                              defaultMessage="Cron Schedule"
                            />
                          </label>
                          <Field
                            id="cronSchedule"
                            name="cronSchedule"
                            type="text"
                            className={`input input-sm input-primary w-full rounded-md font-mono ${
                              errors.cronSchedule && touched.cronSchedule
                                ? 'input-error'
                                : ''
                            }`}
                          />
                          {cronPreview && (
                            <p className="text-neutral mt-1">{cronPreview}</p>
                          )}
                          {errors.cronSchedule && touched.cronSchedule && (
                            <div className="text-error">
                              {errors.cronSchedule}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor="sendOn"
                            className="block text-left text-sm leading-6 font-medium"
                          >
                            <FormattedMessage
                              id="newsletters.sendOn"
                              defaultMessage="Send On"
                            />
                          </label>
                          <div className="flex flex-col items-center gap-2 sm:flex-row">
                            <DatePicker
                              id="sendAt"
                              selected={
                                values.sendAt ??
                                (() => {
                                  const date = new Date();
                                  date.setHours(date.getHours() + 1);
                                  return date;
                                })()
                              }
                              locale={datePickerLocale}
                              closeOnScroll
                              onChange={(date: Date | null) => {
                                if (!date) {
                                  setFieldValue('sendAt', null);
                                  return;
                                }
                                const next = new Date(date);
                                next.setHours(
                                  values.sendAt?.getHours() ?? next.getHours(),
                                  values.sendAt?.getMinutes() ??
                                    next.getMinutes(),
                                  0,
                                  0
                                );
                                setFieldValue('sendAt', next);
                              }}
                              minDate={new Date()}
                              dateFormat="P"
                              showYearDropdown
                              yearDropdownItemNumber={2}
                              scrollableYearDropdown
                              showMonthDropdown
                              wrapperClassName="w-full"
                              customInput={
                                <DatePickerInput
                                  invalid={!!(errors.sendAt && touched.sendAt)}
                                  icon={
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="text-primary absolute right-4 h-5 w-5 shrink-0"
                                    >
                                      <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                                      <path
                                        fillRule="evenodd"
                                        d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  }
                                />
                              }
                            />
                            <span className="">
                              <FormattedMessage
                                id="common.at"
                                defaultMessage="at"
                              />
                            </span>
                            <DatePicker
                              selected={
                                values.sendAt ??
                                (() => {
                                  const date = new Date();
                                  date.setHours(date.getHours() + 1);
                                  return date;
                                })()
                              }
                              locale={datePickerLocale}
                              closeOnScroll
                              onChange={(date: Date | null) => {
                                setFieldValue('sendAt', date);
                              }}
                              showTimeSelect
                              showTimeSelectOnly
                              timeIntervals={15}
                              dateFormat="h:mm aa"
                              timeCaption={intl.formatMessage({
                                id: 'newsletters.sendAt',
                                defaultMessage: 'Send At',
                              })}
                              wrapperClassName="w-full"
                              customInput={
                                <DatePickerInput
                                  invalid={!!(errors.sendAt && touched.sendAt)}
                                  icon={
                                    <ClockIcon className="text-primary absolute right-4 h-5 w-5 shrink-0" />
                                  }
                                />
                              }
                            />
                          </div>
                          {errors.sendAt && touched.sendAt && (
                            <div className="text-error">
                              {String(errors.sendAt)}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Form>
            </Modal>

            <Modal
              show={!!previewHtml}
              onCancel={() => setPreviewHtml(null)}
              cancelText={intl.formatMessage({
                id: 'common.close',
                defaultMessage: 'Close',
              })}
              cancelButtonType="default"
              title={intl.formatMessage({
                id: 'newsletters.preview',
                defaultMessage: 'Newsletter Preview',
              })}
            >
              <iframe
                title="newsletter-preview"
                className="border-primary h-[60vh] w-full rounded-md border"
                style={{ backgroundColor: '#1f1f1f' }}
                srcDoc={
                  previewHtml
                    ? previewHtml.replace(
                        /<head>/i,
                        `<head><base href="${
                          typeof window !== 'undefined'
                            ? window.location.origin
                            : ''
                        }/">`
                      )
                    : ''
                }
              />
            </Modal>
          </>
        );
      }}
    </Formik>
  );
};

export default NewsletterModal;
