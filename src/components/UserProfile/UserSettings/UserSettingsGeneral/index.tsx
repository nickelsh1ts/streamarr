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
import useSWR from 'swr';
import Toast from '@app/components/Toast';
import { ArrowDownTrayIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useParams } from 'next/navigation';
import LibrarySelector from '@app/components/LibrarySelector';

//TODO: Allow library selector to edit shared libraries in plex

const UserSettingsGeneral = () => {
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
      <h3 className="text-2xl font-extrabold">General Settings</h3>
      <Formik
        initialValues={{
          displayName: data?.username ?? '',
          locale: data?.locale,
          inviteQuotaLimit:
            data?.inviteQuotaLimit ?? data?.globalInviteQuotaLimit ?? 1,
          inviteQuotaDays:
            data?.inviteQuotaDays ?? data?.globalInviteQuotaDays ?? 0,
          sharedLibraries:
            data?.sharedLibraries && data?.sharedLibraries !== ''
              ? data.sharedLibraries
              : 'server',
        }}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            await axios.post(`/api/v1/user/${user?.id}/settings/main`, {
              username: values.displayName,
              locale: values.locale,
              inviteQuotaLimit: inviteQuotaEnabled
                ? values.inviteQuotaLimit
                : null,
              inviteQuotaDays: inviteQuotaEnabled
                ? values.inviteQuotaDays
                : null,
              sharedLibraries: values.sharedLibraries
                ? values.sharedLibraries
                : null,
            });

            if (currentUser?.id === user?.id && setLocale) {
              setLocale(
                (values.locale
                  ? values.locale
                  : currentSettings.locale) as AvailableLocale
              );
            }

            Toast({
              title: 'Settings Saved Successfully!',
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch (e) {
            Toast({
              title: 'Something went wrong while saving settings.',
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
                  <div className="col-span-1">Account Type</div>
                  <div className="mb-1 text-sm font-medium leading-5 text-gray-400 sm:mt-2">
                    <div className="flex max-w-lg items-center">
                      {user?.userType === UserType.PLEX ? (
                        <Badge badgeType="warning">Plex User</Badge>
                      ) : (
                        <Badge badgeType="default">Local User</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <div className="col-span-1">Role</div>
                  <div className="mb-1 text-sm font-medium leading-5 text-gray-400 sm:mt-2">
                    <div className="flex max-w-lg items-center">
                      {user?.id === 1
                        ? 'Owner'
                        : hasPermission(Permission.ADMIN)
                          ? 'Admin'
                          : 'User'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="displayName" className="col-span-1">
                    Display Name
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
                    Display Language
                  </label>
                  <div className="col-span-2">
                    <Field
                      as="select"
                      id="locale"
                      name="locale"
                      className="select select-primary select-sm w-full"
                    >
                      <option value="" lang={locale}>
                        Default (
                        {availableLanguages[currentSettings.locale].display})
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                        <label htmlFor="sharedLibraries" className="col-span-1">
                          Shared Libraries
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
                        <div className="col-span-1">
                          <span>Invite Quota</span>
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
                              Override Global Limit
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
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
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
