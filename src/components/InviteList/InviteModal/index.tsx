'use client';
import Error from '@app/app/error';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import LibrarySelector from '@app/components/LibrarySelector';
import type { User } from '@app/hooks/useUser';
import { Permission, useUser } from '@app/hooks/useUser';
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Portal,
} from '@headlessui/react';
import {
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { UserResultsResponse } from '@server/interfaces/api/userInterfaces';
import { hasPermission } from '@server/lib/permissions';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { Field, Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import { useState, useEffect, Fragment, useRef } from 'react';
import useSWR from 'swr';
import CachedImage from '@app/components/Common/CachedImage';
import axios from 'axios';
import Toast from '@app/components/Toast';
import type Invite from '@server/entity/Invite';
import { InviteStatus } from '@server/constants/invite';

interface InviteModalProps {
  invite: Invite | null;
  show: boolean;
  onComplete: (newInvite?: Invite) => void;
  onCancel: () => void;
}

const InviteModal = ({
  show,
  onComplete,
  onCancel,
  invite,
}: InviteModalProps) => {
  const searchParams = useParams<{ userid: string }>();
  const { user } = useUser({
    id: Number(searchParams.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  const [selectedUser, setSelectedUser] = useState<User | null>(
    invite?.createdBy ?? user ?? null
  );

  const { data: userData } = useSWR<UserResultsResponse>(
    currentHasPermission([Permission.MANAGE_INVITES, Permission.MANAGE_USERS])
      ? '/api/v1/user?take=1000&sort=displayname'
      : null
  );
  const filteredUserData = userData?.results.filter((user) =>
    hasPermission(
      [Permission.CREATE_INVITES, Permission.STREAMARR],
      user.permissions,
      { type: 'or' }
    )
  );

  useEffect(() => {
    if (filteredUserData && !user) {
      setSelectedUser(
        filteredUserData?.find((u) => u.id === currentUser?.id) ?? null
      );
    }
  }, [currentUser?.id, filteredUserData, user]);

  const buttonRef = useRef(null);
  const optionsRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });
  const [listboxOpen, setListboxOpen] = useState(false);
  const [dropdownMeasured, setDropdownMeasured] = useState(false);

  useEffect(() => {
    if (listboxOpen) {
      setDropdownMeasured(false);
    }
  }, [listboxOpen]);

  useEffect(() => {
    function updateDropdownPosition() {
      if (listboxOpen && optionsRef.current && buttonRef.current) {
        const dropdownRect = optionsRef.current.getBoundingClientRect();
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const margin = 8; // 0.5rem = 8px
        if (dropdownRect.height > spaceBelow && spaceAbove > spaceBelow) {
          setDropdownPos((prev) => ({
            ...prev,
            top: buttonRect.top + window.scrollY - dropdownRect.height - margin,
            left: buttonRect.left + window.scrollX,
            width: buttonRect.width,
            openUp: true,
          }));
        } else {
          setDropdownPos((prev) => ({
            ...prev,
            top: buttonRect.bottom + window.scrollY + margin,
            left: buttonRect.left + window.scrollX,
            width: buttonRect.width,
            openUp: false,
          }));
        }
        setDropdownMeasured(true);
      }
    }

    if (listboxOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [listboxOpen, dropdownPos.width]);

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data && (!selectedUser || (filteredUserData ?? []).length < 2)) {
    return null;
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
    <Formik
      initialValues={{
        icode: invite?.icode ?? '',
        inviteExpiryLimit: invite
          ? invite.expiryLimit
          : (data?.globalInvitesExpiryLimit ?? 2),
        inviteExpiryTime: invite
          ? invite.expiryTime
          : (data?.globalInvitesExpiryTime ?? 'days'),
        inviteUsageLimit: invite
          ? invite.usageLimit
          : (data?.globalInviteUsageLimit ?? 1),
        downloads: invite
          ? invite.downloads
          : (data?.globalAllowDownloads ?? true),
        liveTv: invite ? invite.liveTv : (data?.globalLiveTv ?? false),
        plexHome: invite ? invite.plexHome : (data?.globalPlexHome ?? false),
        sharedLibraries: invite
          ? invite.sharedLibraries
          : data?.sharedLibraries && data?.sharedLibraries !== ''
            ? data.sharedLibraries
            : 'server',
      }}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          const submission = {
            icode: values.icode,
            expiryLimit: values.inviteExpiryLimit,
            expiryTime: values.inviteExpiryTime,
            usageLimit: values.inviteUsageLimit ?? null,
            downloads: values.downloads,
            liveTv: values.liveTv,
            plexHome: values.plexHome,
            sharedLibraries: values.sharedLibraries,
            inviteAs: invite ? null : (selectedUser ?? currentUser),
            updatedBy: currentUser,
          };
          if (invite) {
            await axios.put(`/api/v1/invite/${invite.id}`, submission);
            Toast({
              title: `Invite Updated Successfully!`,
              icon: <CheckBadgeIcon className="size-7" />,
              type: 'success',
            });
            onComplete();
          } else {
            const response = await axios.post('/api/v1/invite', submission);
            Toast({
              title: `Invite Created Successfully!`,
              icon: <CheckBadgeIcon className="size-7" />,
              type: 'success',
            });
            onComplete(response.data);
          }
        } catch (e) {
          Toast({
            title: `Something went wrong while ${invite ? 'updating' : 'creating'} the invite.`,
            message: e.message,
            icon: <XCircleIcon className="size-7" />,
            type: 'error',
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ isSubmitting, isValid, values, setFieldValue, handleSubmit }) => {
        return (
          <Modal
            okText={
              currentHasPermission(
                [Permission.ADVANCED_INVITES, Permission.MANAGE_INVITES],
                { type: 'or' }
              ) || !invite
                ? isSubmitting
                  ? 'Saving...'
                  : invite
                    ? 'Save Changes'
                    : 'Create Invite'
                : null
            }
            okButtonType={
              currentHasPermission(
                [Permission.ADVANCED_INVITES, Permission.MANAGE_INVITES],
                { type: 'or' }
              ) || !invite
                ? 'primary'
                : null
            }
            okDisabled={isSubmitting || !isValid}
            cancelText="Cancel"
            cancelButtonType="default"
            show={show}
            onOk={() => handleSubmit()}
            onCancel={onCancel}
            title="Create an Invite"
            secondaryText={
              invite && invite.status === InviteStatus.ACTIVE
                ? 'Disable Invite'
                : invite && invite.status === InviteStatus.INACTIVE
                  ? 'Enable Invite'
                  : null
            }
            secondaryButtonType={
              invite
                ? invite.status === InviteStatus.ACTIVE
                  ? 'warning'
                  : 'success'
                : null
            }
            onSecondary={
              invite
                ? async () => {
                    if (!invite) return;
                    console.log(invite.status);
                    const newStatus =
                      invite.status === InviteStatus.ACTIVE
                        ? 'inactive'
                        : 'active';
                    try {
                      await axios.post(
                        `/api/v1/invite/${invite.id}/${newStatus}`
                      );
                      Toast({
                        title: `Invite ${invite.status === InviteStatus.ACTIVE ? 'Disabled' : 'Enabled'} Successfully!`,
                        icon: <CheckBadgeIcon className="size-7" />,
                        type: 'success',
                      });
                      onComplete();
                    } catch (e) {
                      Toast({
                        title:
                          'Something went wrong while disabling the invite.',
                        message: e.message,
                        icon: <XCircleIcon className="size-7" />,
                        type: 'error',
                      });
                    } finally {
                      revalidate();
                    }
                  }
                : null
            }
          >
            <div className="max-w-lg mx-auto">
              <Form className="space-y-4">
                <div className="border-t border-primary pt-4">
                  <label
                    htmlFor="icode"
                    className="block text-sm font-medium leading-6 text-left"
                  >
                    Invite Code{' '}
                    {invite ? null : (
                      <span className="text-neutral-500">(optional)</span>
                    )}
                  </label>
                  <div className="">
                    <Field
                      id="icode"
                      name="icode"
                      type="text"
                      placeholder="STRMRR"
                      disabled={invite}
                      className="input input-primary w-full py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset ring-primary uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="inviteExpiryLimit"
                    className="block text-sm font-medium leading-6 text-left"
                  >
                    Expiration
                  </label>
                  <div className="space-x-2">
                    <span>
                      Expires {values.inviteExpiryLimit > 0 && 'after'}
                    </span>
                    <Field
                      as="select"
                      name="inviteExpiryLimit"
                      id="inviteExpiryLimit"
                      disabled={
                        !currentHasPermission(
                          [
                            Permission.ADVANCED_INVITES,
                            Permission.MANAGE_INVITES,
                          ],
                          { type: 'or' }
                        ) || !!invite
                      }
                      className="select select-sm select-primary rounded-md"
                      onChange={(e) =>
                        setFieldValue(
                          'inviteExpiryLimit',
                          Number(e.target.value)
                        )
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
                        disabled={
                          !currentHasPermission(
                            [
                              Permission.ADVANCED_INVITES,
                              Permission.MANAGE_INVITES,
                            ],
                            { type: 'or' }
                          ) || !!invite
                        }
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
                </div>
                {currentHasPermission(
                  [Permission.ADVANCED_INVITES, Permission.MANAGE_INVITES],
                  { type: 'or' }
                ) && (
                  <>
                    <div className="text-sm font-medium leading-6">
                      Advanced Settings
                      <div className="divider divider-primary my-0 col-span-full" />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="inviteUsageLimit"
                        className="block text-sm font-medium leading-6 text-left"
                      >
                        Invite Usage Limit
                      </label>
                      <Field
                        as="select"
                        name="inviteUsageLimit"
                        id="inviteUsageLimit"
                        className="select select-sm select-primary rounded-md"
                        onChange={(e) =>
                          setFieldValue(
                            'inviteUsageLimit',
                            Number(e.target.value)
                          )
                        }
                      >
                        <option value={0}>Unlimited</option>
                        {[...Array(100)].map((_item, i) => {
                          const value = i + 1;
                          if (invite && value < (invite.uses ?? 0)) return null;
                          return (
                            <option
                              value={value}
                              key={`$invite-limit-${value}`}
                            >
                              {value}
                            </option>
                          );
                        })}
                      </Field>
                      <span className="ml-4">
                        use
                        {(values.inviteUsageLimit > 1 ||
                          values.inviteUsageLimit < 1) &&
                          's'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 col-span-2 gap-2">
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
                              values.downloads
                                ? 'translate-x-5'
                                : 'translate-x-0'
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
                          onClick={() =>
                            setFieldValue('liveTv', !values.liveTv)
                          }
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
                      {currentHasPermission(Permission.ADMIN) && (
                        <div className="inline-flex items-center space-x-2">
                          <span
                            id="plexHome"
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={values.plexHome}
                            onClick={() =>
                              currentHasPermission(Permission.ADMIN)
                                ? setFieldValue('plexHome', !values.plexHome)
                                : undefined
                            }
                            onKeyDown={(e) => {
                              if (
                                (e.key === 'Enter' || e.key === 'Space') &&
                                currentHasPermission(Permission.ADMIN)
                              ) {
                                e.preventDefault();
                                setFieldValue('plexHome', !values.plexHome);
                              }
                            }}
                            className={`${
                              values.plexHome ? 'bg-primary' : 'bg-neutral-700'
                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring ${!currentHasPermission(Permission.ADMIN) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            aria-disabled={
                              !currentHasPermission(Permission.ADMIN)
                            }
                          >
                            <span
                              aria-hidden="true"
                              className={`${
                                values.plexHome
                                  ? 'translate-x-5'
                                  : 'translate-x-0'
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
                          <label htmlFor="plexHome" className="ml-2">
                            Invite to Plex Home
                          </label>
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="sharedLibraries"
                        className="block text-sm my-0 font-medium leading-6 text-left"
                      >
                        Shared Libraries
                      </label>
                      <div className="col-span-2">
                        <LibrarySelector
                          isUserSettings
                          serverValue={data?.globalSharedLibraries}
                          value={values.sharedLibraries}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </div>
                    {currentHasPermission([
                      Permission.MANAGE_INVITES,
                      Permission.MANAGE_USERS,
                    ]) &&
                      selectedUser &&
                      !invite &&
                      (filteredUserData ?? []).length > 1 && (
                        <Listbox
                          as="div"
                          value={selectedUser}
                          onChange={(value) => setSelectedUser(value)}
                          className="space-y-1"
                        >
                          {({ open }) => {
                            if (open !== listboxOpen) {
                              setTimeout(() => setListboxOpen(open), 0);
                            }
                            return (
                              <>
                                <Label className="block text-sm font-medium leading-6 text-left">
                                  Invite As
                                </Label>
                                <div className="relative">
                                  <span className="inline-block w-full relative rounded-md shadow-sm">
                                    <ListboxButton
                                      ref={buttonRef}
                                      className="focus:shadow-outline-primary relative w-full cursor-default rounded-md border border-primary bg-base-100 py-2 pl-3 pr-10 text-left text-white transition duration-150 ease-in-out focus:border-primary-content focus:outline-none sm:text-sm sm:leading-5"
                                    >
                                      <span className="flex items-center">
                                        <CachedImage
                                          src={selectedUser.avatar}
                                          alt=""
                                          className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                                          width={24}
                                          height={24}
                                        />
                                        <span className="ml-3 block">
                                          {selectedUser.displayName}
                                        </span>
                                        {selectedUser.displayName.toLowerCase() !==
                                          selectedUser.email && (
                                          <span className="ml-1 truncate text-gray-400">
                                            ({selectedUser.email})
                                          </span>
                                        )}
                                      </span>
                                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
                                        <ChevronDownIcon className="h-5 w-5" />
                                      </span>
                                    </ListboxButton>
                                  </span>
                                  <Portal>
                                    {listboxOpen && (
                                      <ListboxOptions
                                        ref={optionsRef}
                                        className="z-[9999] px-1 max-h-60 overflow-auto rounded-md bg-base-100 border border-primary py-2 text-base leading-6 shadow-lg focus:outline-none sm:text-sm sm:leading-5"
                                        style={{
                                          position: 'absolute',
                                          top: dropdownMeasured
                                            ? dropdownPos.top
                                            : 0,
                                          left: dropdownMeasured
                                            ? dropdownPos.left
                                            : 0,
                                          width: dropdownMeasured
                                            ? dropdownPos.width
                                            : undefined,
                                          visibility: dropdownMeasured
                                            ? 'visible'
                                            : 'hidden',
                                          pointerEvents: dropdownMeasured
                                            ? 'auto'
                                            : 'none',
                                        }}
                                      >
                                        {filteredUserData?.map((user) => (
                                          <ListboxOption
                                            key={user?.id}
                                            value={user}
                                            as={Fragment}
                                          >
                                            {({ selected, focus }) => (
                                              <div
                                                className={`${
                                                  focus
                                                    ? 'bg-primary text-white'
                                                    : 'text-gray-300'
                                                } relative cursor-default select-none py-2 pl-8 pr-4 rounded-md`}
                                              >
                                                <span
                                                  className={`${
                                                    selected
                                                      ? 'font-semibold'
                                                      : 'font-normal'
                                                  } flex items-center`}
                                                >
                                                  <CachedImage
                                                    src={user.avatar}
                                                    alt=""
                                                    className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                                                    width={24}
                                                    height={24}
                                                  />
                                                  <span className="ml-3 block flex-shrink-0">
                                                    {user.displayName}
                                                  </span>
                                                  {user.displayName.toLowerCase() !==
                                                    user.email && (
                                                    <span className="ml-1 truncate text-gray-400">
                                                      ({user.email})
                                                    </span>
                                                  )}
                                                </span>
                                                {selected && (
                                                  <span
                                                    className={`${
                                                      focus
                                                        ? 'text-white'
                                                        : 'text-primary'
                                                    } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                                                  >
                                                    <CheckIcon className="h-5 w-5" />
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </ListboxOption>
                                        ))}
                                      </ListboxOptions>
                                    )}
                                  </Portal>
                                </div>
                              </>
                            );
                          }}
                        </Listbox>
                      )}
                  </>
                )}
              </Form>
            </div>
          </Modal>
        );
      }}
    </Formik>
  );
};
export default InviteModal;
