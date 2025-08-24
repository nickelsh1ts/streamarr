'use client';
import Error from '@app/app/error';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import QuotaSelector from '@app/components/QuotaSelector';
import type { AvailableLocale } from '@app/context/LanguageContext';
import { availableLanguages } from '@app/context/LanguageContext';
import useLocale from '@app/hooks/useLocale';
import useSettings from '@app/hooks/useSettings';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import { XCircleIcon } from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useParams } from 'next/navigation';
import LibrarySelector from '@app/components/LibrarySelector';

const UserSettingsGeneral = () => {
  const intl = useIntl();
  const { locale, setLocale } = useLocale();
  const [inviteQuotaEnabled, setInviteQuotaEnabled] = useState(false);
  const searchParams = useParams<{ userid: string }>();
  const {
    user,
    hasPermission,
    revalidate: revalidateUser,
  } = useUser({
    id: Number(searchParams.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const { currentSettings } = useSettings();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  useEffect(() => {
    setInviteQuotaEnabled(
      data?.inviteQuotaLimit != undefined && data?.inviteQuotaDays != undefined
    );
  }, [data]);

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return (
      <Error
        statusCode={500}
        error={{ name: 'Error', message: '' }}
        reset={() => {}}
      />
    );
  }

  return (
    <div className="mb-6 mt-3">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="generalSettings.title"
          defaultMessage="General Settings"
        />
      </h3>
      <Formik
        initialValues={{
          displayName: data?.username ?? '',
          locale: data?.locale,
          inviteQuotaLimit:
            data?.inviteQuotaLimit ?? data?.globalInviteQuotaLimit ?? 1,
          inviteQuotaDays:
            data?.inviteQuotaDays ?? data?.globalInviteQuotaDays ?? 0,
          sharedLibraries:
            data?.sharedLibraries === null
              ? 'server'
              : data?.sharedLibraries && data?.sharedLibraries !== ''
                ? data.sharedLibraries
                : 'server',
          allowDownloads: data?.allowDownloads ?? false,
          allowLiveTv: data?.allowLiveTv ?? false,
        }}
        enableReinitialize
        onSubmit={async (values) => {
          // Handle previous values correctly to detect changes
          const previousSharedLibraries =
            data?.sharedLibraries === null
              ? 'server'
              : data?.sharedLibraries && data?.sharedLibraries !== ''
                ? data.sharedLibraries
                : 'server';

          const newSharedLibraries =
            values.sharedLibraries === 'server' || values.sharedLibraries === ''
              ? 'server'
              : values.sharedLibraries;

          const librariesChanged =
            previousSharedLibraries !== (newSharedLibraries || 'server');

          const isPlexUser = user?.userType === UserType.PLEX;
          const canManageUsers = currentHasPermission(Permission.MANAGE_USERS);

          try {
            const submitData = {
              username: values.displayName,
              locale: values.locale,
              inviteQuotaLimit: inviteQuotaEnabled
                ? values.inviteQuotaLimit
                : null,
              inviteQuotaDays: inviteQuotaEnabled
                ? values.inviteQuotaDays
                : null,
              sharedLibraries: newSharedLibraries,
              allowDownloads: values.allowDownloads,
              allowLiveTv: values.allowLiveTv,
            };

            await axios.post(
              `/api/v1/user/${user?.id}/settings/main`,
              submitData
            );

            if (currentUser?.id === user?.id && setLocale) {
              setLocale(
                (values.locale
                  ? values.locale
                  : currentSettings.locale) as AvailableLocale
              );
            }

            Toast({
              title: intl.formatMessage({
                id: 'common.saveSuccess',
                defaultMessage: 'Settings saved successfully!',
              }),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
              message:
                isPlexUser && canManageUsers && librariesChanged
                  ? intl.formatMessage({
                      id: 'settings.librariesSynced',
                      defaultMessage: 'Libraries have been synced with Plex.',
                    })
                  : undefined,
            });
          } catch (e) {
            Toast({
              title: intl.formatMessage({
                id: 'settings.saveError',
                defaultMessage: 'Something went wrong while saving settings.',
              }),
              type: 'error',
              message: e.message,
              icon: <XCircleIcon className="size-7" />,
            });
          } finally {
            revalidate();
            revalidateUser();
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
        }) => {
          return (
            <Form className="mt-5">
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
                      {user?.id === 1 ? (
                        <FormattedMessage
                          id="common.owner"
                          defaultMessage="Owner"
                        />
                      ) : hasPermission(Permission.ADMIN) ? (
                        <FormattedMessage
                          id="common.admin"
                          defaultMessage="Admin"
                        />
                      ) : (
                        <FormattedMessage
                          id="common.user"
                          defaultMessage="User"
                        />
                      )}
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
                      <option value="" lang={locale}>
                        <FormattedMessage
                          id="common.default"
                          defaultMessage="Default"
                        />{' '}
                        ({availableLanguages[currentSettings.locale].display})
                      </option>
                      {(
                        Object.keys(
                          availableLanguages
                        ) as (keyof typeof availableLanguages)[]
                      ).map((key) => (
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
                {currentHasPermission(Permission.MANAGE_USERS) &&
                  !hasPermission(Permission.MANAGE_USERS) && (
                    <>
                      {user?.userType === UserType.PLEX && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                            <label htmlFor="plexAccess" className="col-span-1">
                              <FormattedMessage
                                id="settings.plexAccess"
                                defaultMessage="Plex Access"
                              />
                              <span className="block text-xs text-gray-400 mt-1">
                                <FormattedMessage
                                  id="settings.plexAccessDescription"
                                  defaultMessage="Changes will sync with Plex automatically on save."
                                />
                              </span>
                            </label>
                            <div className="col-span-2">
                              <LibrarySelector
                                value={values.sharedLibraries}
                                serverValue={data.globalSharedLibraries}
                                isUserSettings
                                setFieldValue={setFieldValue}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                            <div className="col-span-1"></div>
                            <div className="inline-flex items-center space-x-2">
                              <span
                                id="allowDownloads"
                                role="checkbox"
                                tabIndex={0}
                                aria-checked={values.allowDownloads}
                                onClick={() =>
                                  setFieldValue(
                                    'allowDownloads',
                                    !values.allowDownloads
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Space') {
                                    e.preventDefault();
                                    setFieldValue(
                                      'allowDownloads',
                                      !values.allowDownloads
                                    );
                                  }
                                }}
                                className={`${
                                  values.allowDownloads
                                    ? 'bg-primary'
                                    : 'bg-neutral-700'
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`${
                                    values.allowDownloads
                                      ? 'translate-x-5'
                                      : 'translate-x-0'
                                  } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                                >
                                  <span
                                    className={`${
                                      values.allowDownloads
                                        ? 'opacity-0 duration-100 ease-out'
                                        : 'opacity-100 duration-200 ease-in'
                                    } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                  >
                                    <XMarkIcon className="h-3 w-3 text-neutral-400" />
                                  </span>
                                  <span
                                    className={`${
                                      values.allowDownloads
                                        ? 'opacity-100 duration-200 ease-in'
                                        : 'opacity-0 duration-100 ease-out'
                                    } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                  >
                                    <CheckIcon className="h-3 w-3 text-primary" />
                                  </span>
                                </span>
                              </span>
                              <label htmlFor="allowDownloads">
                                <FormattedMessage
                                  id="invite.allowDownloads"
                                  defaultMessage="Allow Downloads"
                                />
                              </label>
                            </div>
                            <div className="inline-flex items-center space-x-2">
                              <span
                                id="allowLiveTv"
                                role="checkbox"
                                tabIndex={0}
                                aria-checked={values.allowLiveTv}
                                onClick={() =>
                                  setFieldValue(
                                    'allowLiveTv',
                                    !values.allowLiveTv
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Space') {
                                    e.preventDefault();
                                    setFieldValue(
                                      'allowLiveTv',
                                      !values.allowLiveTv
                                    );
                                  }
                                }}
                                className={`${
                                  values.allowLiveTv
                                    ? 'bg-primary'
                                    : 'bg-neutral-700'
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`${
                                    values.allowLiveTv
                                      ? 'translate-x-5'
                                      : 'translate-x-0'
                                  } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                                >
                                  <span
                                    className={`${
                                      values.allowLiveTv
                                        ? 'opacity-0 duration-100 ease-out'
                                        : 'opacity-100 duration-200 ease-in'
                                    } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                  >
                                    <XMarkIcon className="h-3 w-3 text-neutral-400" />
                                  </span>
                                  <span
                                    className={`${
                                      values.allowLiveTv
                                        ? 'opacity-100 duration-200 ease-in'
                                        : 'opacity-0 duration-100 ease-out'
                                    } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                  >
                                    <CheckIcon className="h-3 w-3 text-primary" />
                                  </span>
                                </span>
                              </span>
                              <label htmlFor="allowLiveTv">
                                <FormattedMessage
                                  id="settings.allowLiveTv"
                                  defaultMessage="Allow Live TV Access"
                                />
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                        <div className="col-span-1">
                          <span>
                            <FormattedMessage
                              id="settings.inviteQuota"
                              defaultMessage="Invite Quota"
                            />
                          </span>
                        </div>
                        <div className="col-span-2">
                          <div className="mb-4 flex items-center">
                            <input
                              type="checkbox"
                              id="globalOverride"
                              className="checkbox checkbox-primary"
                              checked={inviteQuotaEnabled}
                              onChange={() => setInviteQuotaEnabled((s) => !s)}
                            />
                            <label
                              htmlFor="globalOverride"
                              className="ml-2 text-gray-300"
                            >
                              <FormattedMessage
                                id="settings.overrideGlobalLimit"
                                defaultMessage="Override Global Limit"
                              />
                            </label>
                          </div>
                          <QuotaSelector
                            isDisabled={!inviteQuotaEnabled}
                            dayFieldName="inviteQuotaDays"
                            limitFieldName="inviteQuotaLimit"
                            onChange={setFieldValue}
                            defaultDays={values.inviteQuotaDays}
                            defaultLimit={values.inviteQuotaLimit}
                            dayOverride={
                              !inviteQuotaEnabled
                                ? data?.globalInviteQuotaDays
                                : undefined
                            }
                            limitOverride={
                              !inviteQuotaEnabled
                                ? data?.globalInviteQuotaLimit
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    type="submit"
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
    </div>
  );
};

export default UserSettingsGeneral;
