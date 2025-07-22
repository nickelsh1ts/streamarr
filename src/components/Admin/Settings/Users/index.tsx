'use client';
import PermissionEdit from '@app/components/Admin/PermissionEdit';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Tooltip from '@app/components/Common/ToolTip';
import LibrarySelector from '@app/components/LibrarySelector';
import QuotaSelector from '@app/components/QuotaSelector';
import Toast from '@app/components/Toast';
import { ArrowDownTrayIcon, XCircleIcon } from '@heroicons/react/24/outline';
import {
  CheckBadgeIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import useSWR, { mutate } from 'swr';

const UserSettings = () => {
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="mb-6">
      <h3 className="text-2xl font-extrabold">User Settings</h3>
      <p className="mb-5">Configure global and default user settings.</p>
      <Formik
        initialValues={{
          localLogin: data?.localLogin,
          newPlexLogin: data?.newPlexLogin,
          inviteQuotaLimit: data?.defaultQuotas.invites.quotaLimit ?? 3,
          inviteQuotaDays: data?.defaultQuotas.invites.quotaDays ?? 0,
          defaultPermissions: data?.defaultPermissions ?? 0,
          inviteUsageLimit: data?.defaultQuotas.invites.quotaUsage ?? 1,
          inviteExpiryLimit: data?.defaultQuotas.invites.quotaExpiryLimit ?? 1,
          inviteExpiryTime:
            data?.defaultQuotas.invites.quotaExpiryTime ?? 'days',
          sharedLibraries: data?.sharedLibraries ?? '',
          downloads: data?.downloads,
          liveTv: data?.liveTv,
          plexHome: data?.plexHome,
        }}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/main', {
              localLogin: values.localLogin,
              newPlexLogin: values.newPlexLogin,
              defaultQuotas: {
                invites: {
                  quotaLimit: values.inviteQuotaLimit,
                  quotaDays: values.inviteQuotaDays,
                  quotaUsage: values.inviteUsageLimit,
                  quotaExpiryLimit: values.inviteExpiryLimit,
                  quotaExpiryTime: values.inviteExpiryTime,
                },
              },
              defaultPermissions: values.defaultPermissions,
              sharedLibraries: values.sharedLibraries,
              downloads: values.downloads,
              liveTv: values.liveTv,
              plexHome: values.plexHome,
            });
            mutate('/api/v1/settings/public');

            Toast({
              title: 'User settings saved successfully!',
              icon: <CheckBadgeIcon className="size-7" />,
              type: 'success',
            });
          } catch {
            Toast({
              title: 'Something went wrong while saving settings.',
              icon: <XCircleIcon className="size-7" />,
              type: 'error',
            });
          } finally {
            revalidate();
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue }) => {
          return (
            <Form className="mt-5 max-w-6xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-y-5">
                <label
                  htmlFor="localLogin"
                  className="font-bold block mt-2 sm:mt-5"
                >
                  Enable Local Sign-in
                  <span className="text-sm block font-light text-neutral-300">
                    Allow users to sign in using their email address and
                    password, instead of Plex OAuth
                  </span>
                </label>
                <div className="col-span-2">
                  <Field
                    type="checkbox"
                    id="localLogin"
                    name="localLogin"
                    onChange={() => {
                      setFieldValue('localLogin', !values.localLogin);
                    }}
                    className="checkbox checkbox-primary rounded-md"
                  />
                </div>
                <label htmlFor="plexLogin" className="font-bold block">
                  Enable New Plex Sign-in
                  <span className="text-sm block font-light text-neutral-300">
                    Allow Plex users to sign in without first being imported
                  </span>
                </label>
                <div className="col-span-2">
                  <Field
                    type="checkbox"
                    id="newPlexLogin"
                    name="newPlexLogin"
                    onChange={() => {
                      setFieldValue('newPlexLogin', !values.newPlexLogin);
                    }}
                    className="checkbox checkbox-primary rounded-md"
                  />
                </div>
                <label htmlFor="inviteLimit" className="font-bold block">
                  Default Invite Quotas
                </label>
                <div className="col-span-2">
                  <QuotaSelector
                    onChange={setFieldValue}
                    dayFieldName="inviteQuotaDays"
                    limitFieldName="inviteQuotaLimit"
                    defaultDays={values.inviteQuotaDays}
                    defaultLimit={values.inviteQuotaLimit}
                  />
                </div>
                <div></div>
                <div className="col-span-2 space-x-4">
                  <Field
                    as="select"
                    name="inviteUsageLimit"
                    id="inviteUsageLimit"
                    className="select select-sm select-primary rounded-md"
                    onChange={(e) =>
                      setFieldValue('inviteUsageLimit', Number(e.target.value))
                    }
                  >
                    <option value={0}>Unlimited</option>
                    {[...Array(100)].map((_item, i) => (
                      <option value={i + 1} key={`$invite-limit-${i + 1}`}>
                        {i + 1}
                      </option>
                    ))}
                  </Field>
                  <span>
                    use
                    {(values.inviteUsageLimit > 1 ||
                      values.inviteUsageLimit === 0) &&
                      's'}{' '}
                    per invite
                  </span>
                </div>
                <div className="" />
                <div className="col-span-2 space-x-2">
                  <span>Expires {values.inviteExpiryLimit > 0 && 'after'}</span>
                  <Field
                    as="select"
                    name="inviteExpiryLimit"
                    id="inviteExpiryLimit"
                    className="select select-sm select-primary rounded-md"
                    onChange={(e) =>
                      setFieldValue('inviteExpiryLimit', Number(e.target.value))
                    }
                  >
                    <option value={0}>Never</option>
                    {[...Array(100)].map((_item, i) => (
                      <option value={i + 1} key={`$invite-expiry-${i + 1}`}>
                        {i + 1}
                      </option>
                    ))}
                  </Field>
                  {values.inviteExpiryLimit > 0 && (
                    <Field
                      as="select"
                      name="inviteExpiryTime"
                      id="inviteExpiryTime"
                      className="select select-sm select-primary rounded-md"
                      onChange={(e) =>
                        setFieldValue('inviteExpiryTime', e.target.value)
                      }
                    >
                      <option value={'days'}>
                        Day{values.inviteExpiryLimit > 1 && 's'}
                      </option>
                      <option value={'weeks'}>
                        Week{values.inviteExpiryLimit > 1 && 's'}
                      </option>
                      <option value={'months'}>
                        Month{values.inviteExpiryLimit > 1 && 's'}
                      </option>
                    </Field>
                  )}
                </div>
                <span id="group-label" className="block font-bold">
                  Default Invite Settings
                  <span className="text-sm block font-light text-neutral-300">
                    Initial settings associated to new invites
                  </span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 col-span-2 gap-2">
                  <div className="inline-flex items-center space-x-2">
                    <span
                      id="downloads"
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={values.downloads}
                      onClick={() =>
                        setFieldValue('downloads', !values.downloads)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Space') {
                          e.preventDefault();
                          setFieldValue('downloads', !values.downloads);
                        }
                      }}
                      className={`${
                        values.downloads ? 'bg-primary' : 'bg-neutral-700'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          values.downloads ? 'translate-x-5' : 'translate-x-0'
                        } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                      >
                        <span
                          className={`${
                            values.downloads
                              ? 'opacity-0 duration-100 ease-out'
                              : 'opacity-100 duration-200 ease-in'
                          } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                        >
                          <XMarkIcon className="h-3 w-3 text-neutral-400" />
                        </span>
                        <span
                          className={`${
                            values.downloads
                              ? 'opacity-100 duration-200 ease-in'
                              : 'opacity-0 duration-100 ease-out'
                          } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                        >
                          <CheckIcon className="h-3 w-3 text-primary" />
                        </span>
                      </span>
                    </span>
                    <label htmlFor="downloads">Allow Downloads</label>
                  </div>
                  <div className="inline-flex items-center space-x-2">
                    <span
                      id="liveTv"
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={values.liveTv}
                      onClick={() => setFieldValue('liveTv', !values.liveTv)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Space') {
                          e.preventDefault();
                          setFieldValue('liveTv', !values.liveTv);
                        }
                      }}
                      className={`${
                        values.liveTv ? 'bg-primary' : 'bg-neutral-700'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          values.liveTv ? 'translate-x-5' : 'translate-x-0'
                        } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                      >
                        <span
                          className={`${
                            values.liveTv
                              ? 'opacity-0 duration-100 ease-out'
                              : 'opacity-100 duration-200 ease-in'
                          } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                        >
                          <XMarkIcon className="h-3 w-3 text-neutral-400" />
                        </span>
                        <span
                          className={`${
                            values.liveTv
                              ? 'opacity-100 duration-200 ease-in'
                              : 'opacity-0 duration-100 ease-out'
                          } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                        >
                          <CheckIcon className="h-3 w-3 text-primary" />
                        </span>
                      </span>
                    </span>
                    <label htmlFor="liveTv">Allow Live TV Access</label>
                  </div>
                  <Tooltip content="Admin only: per invite.">
                    <div className="inline-flex items-center space-x-2">
                      <span
                        id="plexHome"
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={values.plexHome}
                        onClick={() => undefined}
                        onKeyDown={() => undefined}
                        className={`${
                          values.plexHome ? 'bg-primary' : 'bg-neutral-700'
                        } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring opacity-60 cursor-not-allowed`}
                        aria-disabled={true}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            values.plexHome ? 'translate-x-5' : 'translate-x-0'
                          } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
                        >
                          <span
                            className={`${
                              values.plexHome
                                ? 'opacity-0 duration-100 ease-out'
                                : 'opacity-100 duration-200 ease-in'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <XMarkIcon className="h-3 w-3 text-neutral-400" />
                          </span>
                          <span
                            className={`${
                              values.plexHome
                                ? 'opacity-100 duration-200 ease-in'
                                : 'opacity-0 duration-100 ease-out'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <CheckIcon className="h-3 w-3 text-primary" />
                          </span>
                        </span>
                      </span>
                      <label htmlFor="plexHome">Invite to Plex Home</label>
                    </div>
                  </Tooltip>
                </div>
                <span id="group-label" className="block font-bold">
                  Default Shared Libraries
                  <span className="text-sm block font-light text-neutral-300">
                    Initial libraries shared with new users
                  </span>
                </span>
                <div className="col-span-2">
                  <LibrarySelector
                    value={values.sharedLibraries}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <span id="group-label" className="block font-bold">
                  Default Permissions
                  <span className="text-sm block font-light text-neutral-300">
                    Initial permissions assigned to new users
                  </span>
                </span>
                <div className="col-span-2">
                  <div className="max-w-lg">
                    <PermissionEdit
                      currentPermission={values.defaultPermissions}
                      onUpdate={(newPermissions) =>
                        setFieldValue('defaultPermissions', newPermissions)
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="divider divider-primary mb-4 col-span-full" />
              <div className="flex justify-end col-span-3">
                <Button
                  buttonType="primary"
                  buttonSize="sm"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <ArrowDownTrayIcon className="size-4 mr-2" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
export default UserSettings;
