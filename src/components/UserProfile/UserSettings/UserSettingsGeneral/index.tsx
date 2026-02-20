'use client';
import Error from '@app/app/error';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis, {
  SmallLoadingEllipsis,
} from '@app/components/Common/LoadingEllipsis';
import QuotaSelector from '@app/components/QuotaSelector';
import Toggle from '@app/components/Common/Toggle';
import type { AvailableLocale } from '@app/context/LanguageContext';
import { availableLanguages } from '@app/context/LanguageContext';
import useLocale from '@app/hooks/useLocale';
import useSettings from '@app/hooks/useSettings';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import Toast, { dismissToast } from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useParams } from 'next/navigation';
import LibrarySelector from '@app/components/LibrarySelector';
import { momentWithLocale } from '@app/utils/momentLocale';
import DatePicker from 'react-datepicker';
import { useOnboardingContext } from '@app/context/OnboardingContext';
import 'react-datepicker/dist/react-datepicker.css';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import PythonServiceAlert from '@app/components/Admin/Settings/PythonServiceAlert';

const UserSettingsGeneral = () => {
  const intl = useIntl();
  const { locale, setLocale } = useLocale();
  const { resetOnboarding, data: onboardingData } = useOnboardingContext();
  const [inviteQuotaEnabled, setInviteQuotaEnabled] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [plexLibrariesDiffer, setPlexLibrariesDiffer] = useState(false);
  const [plexPermissionsDiffer, setPlexPermissionsDiffer] = useState<{
    allowDownloads: boolean;
    allowLiveTv: boolean;
  }>({ allowDownloads: false, allowLiveTv: false });
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
  const {
    data: plexLibrariesData,
    isLoading: plexLibrariesLoading,
    mutate: revalidatePlexLibraries,
  } = useSWR<{
    currentPlexLibraries: string | null;
    canFetchFromPlex: boolean;
    permissions?: {
      allowSync: boolean;
      allowCameraUpload: boolean;
      allowChannels: boolean;
    };
    error?: string;
  }>(
    user?.userType === UserType.PLEX &&
      user?.id !== 1 &&
      currentHasPermission(Permission.MANAGE_USERS) &&
      !hasPermission(Permission.MANAGE_USERS)
      ? `/api/v1/user/${user?.id}/plex/libraries`
      : null
  );
  const { data: allLibrariesData } = useSWR<{
    libraries: { id: string; name: string; enabled: boolean }[];
  }>(currentHasPermission(Permission.ADMIN) ? '/api/v1/settings/plex' : null, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    setInviteQuotaEnabled(
      data?.inviteQuotaLimit != undefined && data?.inviteQuotaDays != undefined
    );
  }, [data]);

  // Compare database library/permission values with current Plex state
  useEffect(() => {
    if (!data || !plexLibrariesData?.canFetchFromPlex) {
      setPlexLibrariesDiffer(false);
      setPlexPermissionsDiffer({ allowDownloads: false, allowLiveTv: false });
      return;
    }

    // === Library comparison ===
    const plexLibraries = plexLibrariesData.currentPlexLibraries;
    if (plexLibraries === null) {
      setPlexLibrariesDiffer(false);
    } else {
      // Resolve DB value - if 'server'/null/empty, use global default
      const dbValue =
        !data.sharedLibraries || data.sharedLibraries === 'server'
          ? data.globalSharedLibraries || 'all'
          : data.sharedLibraries;

      // Plex empty = all libraries
      const plexValue = plexLibraries === '' ? 'all' : plexLibraries;

      // Get all enabled library IDs for comparison
      const allEnabledIds =
        allLibrariesData?.libraries
          ?.filter((lib) => lib.enabled)
          ?.map((lib) => lib.id)
          ?.sort()
          ?.join('|') ?? '';

      // Normalize both values
      const normalizeValue = (val: string): string => {
        if (val === 'all' || val === '') return 'all';
        const sorted = val.split('|').sort().join('|');
        // Treat full library list as 'all'
        return sorted === allEnabledIds ? 'all' : sorted;
      };

      const normalizedDb = normalizeValue(dbValue);
      const normalizedPlex = normalizeValue(plexValue);
      setPlexLibrariesDiffer(normalizedDb !== normalizedPlex);
    }

    // === Permission comparison ===
    const plexPerms = plexLibrariesData.permissions;
    if (!plexPerms) {
      setPlexPermissionsDiffer({ allowDownloads: false, allowLiveTv: false });
    } else {
      setPlexPermissionsDiffer({
        allowDownloads: (data.allowDownloads ?? false) !== plexPerms.allowSync,
        allowLiveTv: (data.allowLiveTv ?? false) !== plexPerms.allowChannels,
      });
    }
  }, [data, plexLibrariesData, allLibrariesData]);

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
          trialPeriodEnabled: data?.trialPeriodEndsAt ? true : false,
          trialPeriodEndsAt: data?.trialPeriodEndsAt
            ? momentWithLocale(data.trialPeriodEndsAt).format('YYYY-MM-DD')
            : momentWithLocale().format('YYYY-MM-DD'),
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

          const shouldForceSync =
            (plexLibrariesDiffer ||
              plexPermissionsDiffer.allowDownloads ||
              plexPermissionsDiffer.allowLiveTv) &&
            isPlexUser &&
            canManageUsers;

          try {
            const submitData: {
              username: string;
              locale?: string;
              inviteQuotaLimit: number | null;
              inviteQuotaDays: number | null;
              sharedLibraries: string | null;
              allowDownloads: boolean;
              allowLiveTv: boolean;
              trialPeriodEndsAt?: string | null;
              forcePlexSync?: boolean;
            } = {
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
              forcePlexSync: shouldForceSync,
            };

            if (
              currentHasPermission(Permission.MANAGE_USERS) &&
              currentUser?.id !== user?.id &&
              user?.id !== 1 &&
              !hasPermission(Permission.MANAGE_USERS)
            ) {
              if (!values.trialPeriodEnabled) {
                submitData.trialPeriodEndsAt = null;
              } else {
                const dateStr = values.trialPeriodEndsAt;
                const endOfDay = momentWithLocale(dateStr)
                  .endOf('day')
                  .toISOString();
                submitData.trialPeriodEndsAt = endOfDay;
              }
            }

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
                isPlexUser &&
                canManageUsers &&
                (librariesChanged || shouldForceSync)
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
            if (revalidatePlexLibraries) {
              revalidatePlexLibraries();
            }
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
                <PythonServiceAlert />
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <div className="col-span-1">
                    <FormattedMessage
                      id="settings.accountType"
                      defaultMessage="Account Type"
                    />
                  </div>
                  <div className="mb-1 text-sm font-medium leading-5 sm:mt-2">
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
                  <div className="mb-1 text-sm font-medium leading-5 sm:mt-2">
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
                {user?.userType === UserType.PLEX &&
                  currentHasPermission(Permission.MANAGE_USERS) &&
                  !hasPermission(Permission.MANAGE_USERS) && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                        <label htmlFor="plexAccess" className="col-span-1">
                          <FormattedMessage
                            id="settings.plexAccess"
                            defaultMessage="Plex Access"
                          />
                          <span className="block text-xs text-neutral mt-1">
                            <FormattedMessage
                              id="settings.plexAccessDescription"
                              defaultMessage="Changes will sync with Plex automatically on save."
                            />
                          </span>
                        </label>
                        <div className="col-span-2">
                          {plexLibrariesLoading ? (
                            <div className="animate-pulse">
                              <div className="h-10 bg-neutral/20 rounded-md"></div>
                            </div>
                          ) : (
                            <>
                              <LibrarySelector
                                value={values.sharedLibraries}
                                serverValue={data.globalSharedLibraries}
                                isUserSettings
                                setFieldValue={setFieldValue}
                              />
                              {plexLibrariesDiffer &&
                                plexLibrariesData?.currentPlexLibraries !==
                                  null && (
                                  <div className="mt-2 text-sm text-warning">
                                    <ExclamationTriangleIcon className="inline h-5 w-5 mr-1" />
                                    <FormattedMessage
                                      id="settings.librariesDifferWarning"
                                      defaultMessage="Plex access differs from current settings:"
                                    />
                                    <span className="font-bold mx-1">
                                      {plexLibrariesData.currentPlexLibraries ===
                                      '' ? (
                                        <FormattedMessage
                                          id="settings.allLibraries"
                                          defaultMessage="All Libraries"
                                        />
                                      ) : (
                                        plexLibrariesData.currentPlexLibraries &&
                                        plexLibrariesData.currentPlexLibraries !==
                                          '' &&
                                        allLibrariesData?.libraries &&
                                        plexLibrariesData.currentPlexLibraries
                                          .split('|')
                                          .map((id) => {
                                            const lib =
                                              allLibrariesData.libraries.find(
                                                (l) => l.id === id
                                              );
                                            return lib?.name || id;
                                          })
                                          .join(', ')
                                      )}
                                      .
                                    </span>
                                    <FormattedMessage
                                      id="settings.saveChangesToSync"
                                      defaultMessage="Save changes to sync."
                                    />
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 sm:space-x-2">
                        <div className="col-span-1"></div>
                        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                          {!plexLibrariesLoading ? (
                            <>
                              <Toggle
                                id="allowDownloads"
                                valueOf={values.allowDownloads}
                                onClick={() =>
                                  setFieldValue(
                                    'allowDownloads',
                                    !values.allowDownloads
                                  )
                                }
                                title={
                                  <FormattedMessage
                                    id="invite.allowDownloads"
                                    defaultMessage="Allow Downloads"
                                  />
                                }
                              />
                              <Toggle
                                id="allowLiveTv"
                                valueOf={values.allowLiveTv}
                                onClick={() =>
                                  setFieldValue(
                                    'allowLiveTv',
                                    !values.allowLiveTv
                                  )
                                }
                                title={
                                  <FormattedMessage
                                    id="settings.allowLiveTv"
                                    defaultMessage="Allow Live TV Access"
                                  />
                                }
                              />
                            </>
                          ) : (
                            <>
                              <div className="inline-flex items-center space-x-2 animate-pulse">
                                <span
                                  className={`${
                                    values.allowDownloads
                                      ? 'bg-primary/70'
                                      : 'bg-neutral/70'
                                  } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`${
                                      values.allowDownloads
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                    } relative inline-block h-5 w-5 rounded-full bg-white/70 shadow transition duration-200 ease-in-out`}
                                  >
                                    <span
                                      className={`${
                                        values.allowDownloads
                                          ? 'opacity-0 duration-100 ease-out'
                                          : 'opacity-100 duration-200 ease-in'
                                      } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                    >
                                      <XMarkIcon className="h-3 w-3 text-neutral" />
                                    </span>
                                    <span
                                      className={`${
                                        values.allowDownloads
                                          ? 'opacity-100 duration-200 ease-in'
                                          : 'opacity-0 duration-100 ease-out'
                                      } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                    >
                                      <CheckIcon className="h-3 w-3 text-neutral" />
                                    </span>
                                  </span>
                                </span>
                                <span>
                                  <FormattedMessage
                                    id="settings.allowDownloads"
                                    defaultMessage="Allow Downloads"
                                  />
                                </span>
                              </div>
                              <div className="inline-flex items-center space-x-2 animate-pulse">
                                <span
                                  className={`${
                                    values.allowLiveTv
                                      ? 'bg-primary/70'
                                      : 'bg-neutral/70'
                                  } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`${
                                      values.allowLiveTv
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                    } relative inline-block h-5 w-5 rounded-full bg-white/70 shadow transition duration-200 ease-in-out`}
                                  >
                                    <span
                                      className={`${
                                        values.allowLiveTv
                                          ? 'opacity-0 duration-100 ease-out'
                                          : 'opacity-100 duration-200 ease-in'
                                      } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                    >
                                      <XMarkIcon className="h-3 w-3 text-neutral" />
                                    </span>
                                    <span
                                      className={`${
                                        values.allowLiveTv
                                          ? 'opacity-100 duration-200 ease-in'
                                          : 'opacity-0 duration-100 ease-out'
                                      } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                                    >
                                      <CheckIcon className="h-3 w-3 text-neutral" />
                                    </span>
                                  </span>
                                </span>
                                <span>
                                  <FormattedMessage
                                    id="settings.allowLiveTv"
                                    defaultMessage="Allow Live TV Access"
                                  />
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="col-span-1"></div>
                        <div className="col-span-2">
                          {(plexPermissionsDiffer.allowDownloads ||
                            plexPermissionsDiffer.allowLiveTv) && (
                            <>
                              <div className="text-sm text-warning">
                                <ExclamationTriangleIcon className="inline h-5 w-5 mr-1" />
                                <FormattedMessage
                                  id="settings.permissionsDifferWarning"
                                  defaultMessage="Plex permissions differ from current settings:"
                                />
                                {plexPermissionsDiffer.allowDownloads && (
                                  <span className="font-bold ml-1">
                                    <FormattedMessage
                                      id="settings.allowDownloads"
                                      defaultMessage="Allow Downloads"
                                    />
                                    {plexLibrariesData?.permissions
                                      ?.allowSync ? (
                                      <CheckCircleIcon className="inline h-5 w-5 ml-1 text-success mb-0.5" />
                                    ) : (
                                      <XCircleIcon className="inline h-5 w-5 ml-1 text-error mb-0.5" />
                                    )}
                                  </span>
                                )}
                                {plexPermissionsDiffer.allowLiveTv && (
                                  <span className="font-bold ml-1">
                                    <FormattedMessage
                                      id="settings.allowLiveTv"
                                      defaultMessage=" Allow Live TV Access"
                                    />
                                    {plexLibrariesData?.permissions
                                      ?.allowChannels ? (
                                      <CheckCircleIcon className="inline h-5 w-5 ml-1 text-success mb-0.5" />
                                    ) : (
                                      <XCircleIcon className="inline h-5 w-5 ml-1 text-error mb-0.5" />
                                    )}
                                  </span>
                                )}
                                <FormattedMessage
                                  id="settings.saveChangesToSync"
                                  defaultMessage=" Save changes to sync."
                                />
                              </div>
                            </>
                          )}
                          {plexLibrariesData?.permissions &&
                            (values.allowDownloads !==
                              plexLibrariesData.permissions.allowSync ||
                              values.allowLiveTv !==
                                plexLibrariesData.permissions
                                  .allowChannels) && (
                              <div className="text-sm text-error">
                                <ExclamationCircleIcon className="inline h-5 w-5 mr-1" />
                                <FormattedMessage
                                  id="settings.permissionsWillSyncWarning"
                                  defaultMessage="Changing these permissions will briefly remove and re-add the user's Plex server access to apply the changes."
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                {user?.userType === UserType.PLEX &&
                  (user?.id === currentUser.id ||
                    (currentHasPermission(Permission.MANAGE_USERS) &&
                      !hasPermission(Permission.MANAGE_USERS))) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                      <div className="col-span-1">
                        <FormattedMessage
                          id="settings.pinLibraries"
                          defaultMessage="Pin Libraries"
                        />
                        <span className="block text-xs text-neutral mt-1">
                          <FormattedMessage
                            id="settings.pinLibrariesHelp"
                            defaultMessage="Pin all your shared libraries to the Plex home screen"
                          />
                        </span>
                      </div>
                      <div className="col-span-2">
                        <Button
                          data-tutorial="library-pin"
                          buttonType="primary"
                          buttonSize="sm"
                          disabled={isPinning}
                          onClick={async () => {
                            setIsPinning(true);

                            const processingToastId = Toast({
                              title: intl.formatMessage({
                                id: 'settings.pinLibrariesProcessing',
                                defaultMessage: 'Pinning Libraries...',
                              }),
                              message: intl.formatMessage({
                                id: 'settings.pinLibrariesProcessingMessage',
                                defaultMessage:
                                  'Please wait while we pin your libraries to Plex',
                              }),
                              type: 'warning',
                              duration: 60000,
                            });

                            try {
                              const response = await axios.post(
                                `/api/v1/user/${user.id}/settings/pin-libraries`
                              );
                              dismissToast(processingToastId);

                              if (response.data.success) {
                                Toast({
                                  title: intl.formatMessage({
                                    id: 'settings.pinLibrariesSuccess',
                                    defaultMessage:
                                      'Libraries pinned successfully!',
                                  }),
                                  message: intl.formatMessage(
                                    {
                                      id: 'settings.pinLibrariesSuccessMessage',
                                      defaultMessage:
                                        '{count} {count, plural, one {library} other {libraries}} pinned to your Plex home screen',
                                    },
                                    {
                                      count: response.data.pinned_count || 0,
                                    }
                                  ),
                                  type: 'success',
                                  icon: <CheckBadgeIcon className="size-7" />,
                                });
                              }
                            } catch (e) {
                              dismissToast(processingToastId);

                              Toast({
                                title: intl.formatMessage({
                                  id: 'settings.pinLibrariesError',
                                  defaultMessage: 'Failed to pin libraries',
                                }),
                                message:
                                  e.response?.data?.message ||
                                  e.message ||
                                  intl.formatMessage({
                                    id: 'settings.pinLibrariesErrorMessage',
                                    defaultMessage:
                                      'An error occurred while pinning libraries',
                                  }),
                                type: 'error',
                                icon: <XCircleIcon className="size-7" />,
                              });
                            } finally {
                              setIsPinning(false);
                            }
                          }}
                        >
                          {isPinning ? (
                            <SmallLoadingEllipsis
                              text={intl.formatMessage({
                                id: 'settings.pleaseWait',
                                defaultMessage: 'Please wait',
                              })}
                            />
                          ) : (
                            <FormattedMessage
                              id="settings.pinLibrariesToPlex"
                              defaultMessage="Pin Libraries to Plex Home"
                            />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                {currentHasPermission(Permission.MANAGE_USERS) &&
                  !hasPermission(Permission.MANAGE_USERS) && (
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
                          <label htmlFor="globalOverride" className="ml-2">
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
                  )}
                {currentHasPermission(Permission.MANAGE_USERS) &&
                  currentUser?.id !== user?.id &&
                  user?.id !== 1 &&
                  !hasPermission(Permission.MANAGE_USERS) &&
                  data?.globalEnableTrialPeriod && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                      <div className="col-span-1">
                        <FormattedMessage
                          id="settings.trialPeriod"
                          defaultMessage="Trial Period"
                        />
                        <span className="block text-xs text-neutral mt-1">
                          <FormattedMessage
                            id="settings.trialPeriodEndDateDescription"
                            defaultMessage="Cannot create invites until after this date"
                          />{' '}
                          <FormattedMessage
                            id="settings.trialPeriodDefaultDays"
                            defaultMessage="{count, plural, one {(Default: # day)} other {(Default: # days)}}"
                            values={{
                              count: data?.globalTrialPeriodDays ?? 30,
                            }}
                          />
                        </span>
                      </div>
                      <div className="col-span-2">
                        <div className="mb-4 flex items-center">
                          <Field
                            type="checkbox"
                            id="trialPeriodEnabled"
                            name="trialPeriodEnabled"
                            className="checkbox checkbox-primary"
                            onChange={() =>
                              setFieldValue(
                                'trialPeriodEnabled',
                                !values.trialPeriodEnabled
                              )
                            }
                          />
                          <label htmlFor="trialPeriodEnabled" className="ml-2">
                            <FormattedMessage
                              id="settings.enableTrialPeriod"
                              defaultMessage="Enable Trial Period"
                            />
                          </label>
                        </div>
                        <DatePicker
                          disabled={!values.trialPeriodEnabled}
                          dateFormat="MMMM d, yyyy"
                          locale={locale !== 'en' ? locale : undefined}
                          showIcon
                          toggleCalendarOnIconClick
                          selected={
                            momentWithLocale(
                              values.trialPeriodEndsAt
                            ).toDate() ?? momentWithLocale().toDate()
                          }
                          onChange={(date: Date) =>
                            date
                              ? setFieldValue(
                                  'trialPeriodEndsAt',
                                  momentWithLocale(date).format('YYYY-MM-DD')
                                )
                              : null
                          }
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className={
                                values.trialPeriodEnabled ? '' : 'opacity-50'
                              }
                            >
                              <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                              <path
                                fillRule="evenodd"
                                d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          }
                          className={`input input-sm input-primary rounded-md disabled:border-1 disabled:border-primary/40 disabled:bg-opacity-40 disabled:text-opacity-40 ${
                            errors.trialPeriodEndsAt &&
                            touched.trialPeriodEndsAt
                              ? 'input-error'
                              : ''
                          }`}
                        />
                        {errors.trialPeriodEndsAt &&
                          touched.trialPeriodEndsAt && (
                            <div className="text-sm text-red-500 mt-1">
                              {errors.trialPeriodEndsAt}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                {(user?.id === currentUser.id ||
                  (currentHasPermission(Permission.MANAGE_USERS) &&
                    !hasPermission(Permission.MANAGE_USERS))) &&
                  (onboardingData?.settings?.welcomeEnabled ||
                    onboardingData?.settings?.tutorialEnabled) &&
                  (onboardingData?.status?.welcomeCompleted ||
                    onboardingData?.status?.welcomeDismissed ||
                    onboardingData?.status?.tutorialCompleted ||
                    (onboardingData?.status?.tutorialProgress?.length ?? 0) >
                      0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                      <div className="col-span-1">
                        <FormattedMessage
                          id="common.onboarding"
                          defaultMessage="Onboarding"
                        />
                        <span className="block text-xs text-neutral mt-1">
                          <FormattedMessage
                            id="settings.user.onboardingDescription"
                            defaultMessage="Reset the welcome modal and tutorial {ownProfile, select, true {} other {for this user}}"
                            values={{ ownProfile: user?.id === currentUser.id }}
                          />
                        </span>
                      </div>
                      <div className="col-span-2">
                        <ConfirmButton
                          buttonSize="sm"
                          confirmText={intl.formatMessage({
                            id: 'common.areYouSure',
                            defaultMessage: 'Are you sure?',
                          })}
                          onClick={async () => {
                            try {
                              await axios.post(
                                `/api/v1/user/${user?.id}/onboarding/reset`
                              );
                              if (user?.id === currentUser?.id) {
                                await resetOnboarding();
                              }
                              Toast({
                                title: intl.formatMessage({
                                  id: 'settings.user.onboardingResetSuccess',
                                  defaultMessage: 'Onboarding reset.',
                                }),
                                icon: <CheckBadgeIcon className="size-7" />,
                                type: 'success',
                              });
                            } catch (e) {
                              Toast({
                                title: intl.formatMessage({
                                  id: 'settings.user.onboardingResetError',
                                  defaultMessage: 'Failed to reset onboarding.',
                                }),
                                icon: <XCircleIcon className="size-7" />,
                                type: 'error',
                                message:
                                  e.response?.data?.message ||
                                  e.message ||
                                  String(e),
                              });
                            }
                          }}
                        >
                          <FormattedMessage
                            id="settings.user.resetOnboarding"
                            defaultMessage="Reset Onboarding"
                          />
                        </ConfirmButton>
                      </div>
                    </div>
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
