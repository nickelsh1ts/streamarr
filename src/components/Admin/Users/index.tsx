'use client';
import BulkEditModal from '@app/components/Admin/Users/BulkEditModal';
import PlexImportModal from '@app/components/Admin/Users/PlexImportModal';
import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import Header from '@app/components/Common/Header';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Table from '@app/components/Common/Table';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import type { User } from '@app/hooks/useUser';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import {
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BarsArrowDownIcon,
  InboxArrowDownIcon,
  UserPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import type { UserResultsResponse } from '@server/interfaces/api/userInterfaces';
import { hasPermission } from '@server/lib/permissions';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import * as Yup from 'yup';

type Sort = 'created' | 'updated' | 'invites' | 'displayname';

const AdminUsers = () => {
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSettings();
  const searchParams = useSearchParams();
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [currentSort, setCurrentSort] = useState<Sort>('displayname');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const pageIndex = page - 1;

  const updateQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      router.push(pathname + '?' + params.toString());
    },
    [pathname, router, searchParams]
  );

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserResultsResponse>(
    `/api/v1/user?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&sort=${currentSort}`
  );

  const [isDeleting, setDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user?: User;
  }>({
    isOpen: false,
  });
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  useEffect(() => {
    const filterString = window.localStorage.getItem('ul-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentSort(filterSettings.currentSort);
      setCurrentPageSize(filterSettings.currentPageSize);
    }
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) return;
    window.localStorage.setItem(
      'ul-filter-settings',
      JSON.stringify({
        currentSort,
        currentPageSize,
      })
    );
  }, [currentSort, currentPageSize, hasLoadedSettings]);

  const isUserPermsEditable = (userId: number) =>
    userId !== 1 && userId !== currentUser?.id;
  const isAllUsersSelected = () => {
    return (
      selectedUsers.length ===
      data?.results.filter((user) => user.id !== currentUser?.id).length
    );
  };
  const isUserSelected = (userId: number) => selectedUsers.includes(userId);
  const toggleAllUsers = () => {
    if (
      data &&
      selectedUsers.length >= 0 &&
      selectedUsers.length < data?.results.length - 1
    ) {
      setSelectedUsers(
        data.results
          .filter((user) => isUserPermsEditable(user.id))
          .map((u) => u.id)
      );
    } else {
      setSelectedUsers([]);
    }
  };
  const toggleUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers((users) => users.filter((u) => u !== userId));
    } else {
      setSelectedUsers((users) => [...users, userId]);
    }
  };

  const deleteUser = async () => {
    setDeleting(true);

    try {
      await axios.delete(`/api/v1/user/${deleteModal.user?.id}`);

      Toast({
        title: 'User Deleted Successfully!',
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
      setDeleteModal({ isOpen: false, user: deleteModal.user });
    } catch {
      Toast({
        title: 'Something went wrong while deleting the user.',
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setDeleting(false);
      revalidate();
    }
  };

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  const CreateUserSchema = Yup.object().shape({
    email: Yup.string()
      .required('You must provide a valid email address')
      .email('You must provide a valid email address'),
    password: Yup.lazy((value) =>
      !value
        ? Yup.string()
        : Yup.string().min(
            8,
            'Password is too short; should be a minimum of 8 characters'
          )
    ),
  });

  if (!data) {
    return <LoadingEllipsis />;
  }

  const hasNextPage = data.pageInfo.pages > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  const passwordGenerationEnabled =
    settings.currentSettings.applicationUrl &&
    settings.currentSettings.emailEnabled;

  return (
    <div className="mx-4">
      <Modal
        onOk={() => deleteUser()}
        okText={isDeleting ? 'Deleting...' : 'Delete'}
        okDisabled={isDeleting}
        okButtonType="error"
        onCancel={() =>
          setDeleteModal({ isOpen: false, user: deleteModal.user })
        }
        title={'Delete User'}
        subtitle={deleteModal.user?.displayName}
        show={deleteModal.isOpen}
      >
        Are you sure you want to delete this user? All of their data will be
        permanently removed. This cannot be undone.
      </Modal>
      <Formik
        initialValues={{
          displayName: '',
          email: '',
          password: '',
          genpassword: false,
        }}
        validationSchema={CreateUserSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/user', {
              username: values.displayName,
              email: values.email,
              password: values.genpassword ? null : values.password,
            });
            Toast({
              title: 'User created successfully!',
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
            setCreateModal({ isOpen: false });
          } catch (e) {
            Toast({
              title: e.response.data.errors?.includes('USER_EXISTS')
                ? 'The provided email address is already in use by another user.'
                : 'Something went wrong while creating the user.',
              type: 'error',
            });
          } finally {
            revalidate();
          }
        }}
      >
        {({
          errors,
          touched,
          isSubmitting,
          values,
          isValid,
          setFieldValue,
          handleSubmit,
        }) => {
          return (
            <Modal
              title={'Create Local User'}
              onOk={() => handleSubmit()}
              okText={isSubmitting ? 'Creating...' : 'Create'}
              okDisabled={isSubmitting || !isValid}
              okButtonType="primary"
              onCancel={() => setCreateModal({ isOpen: false })}
              show={createModal.isOpen}
            >
              {!settings.currentSettings.localLogin && (
                <Alert
                  title={
                    'The Enable Local Sign-In setting is currently disabled.'
                  }
                  type="warning"
                />
              )}
              {currentHasPermission(Permission.ADMIN) &&
                !passwordGenerationEnabled && (
                  <Alert
                    title={
                      'Configure an application URL and enable email notifications to allow automatic password generation.'
                    }
                    type="info"
                  />
                )}
              <Form className="mt-5 max-w-6xl space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="displayName">Display name</label>
                  <div className="sm:col-span-2">
                    <div className="flex">
                      <Field
                        id="displayName"
                        name="displayName"
                        type="text"
                        className="input input-sm input-primary rounded-md w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="email">
                    Email Address
                    <span className="ml-1 text-error">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <div className="flex">
                      <Field
                        id="email"
                        name="email"
                        type="text"
                        inputMode="email"
                        autoComplete="off"
                        data-1pignore="true"
                        data-lpignore="true"
                        data-bwignore="true"
                        className="input input-sm input-primary rounded-md w-full"
                      />
                    </div>
                    {errors.email &&
                      touched.email &&
                      typeof errors.email === 'string' && (
                        <div className="text-error">{errors.email}</div>
                      )}
                  </div>
                </div>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 ${
                    passwordGenerationEnabled ? '' : 'opacity-50'
                  }`}
                >
                  <label htmlFor="genpassword">
                    Automatically Generate Password
                    <span className="block text-sm text-neutral-500">
                      Email a server-generated password to the user
                    </span>
                  </label>
                  <div className="sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="genpassword"
                      name="genpassword"
                      className="checkbox-primary checkbox"
                      disabled={!passwordGenerationEnabled}
                      onClick={() => setFieldValue('password', '')}
                    />
                  </div>
                </div>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 ${
                    values.genpassword ? 'opacity-50' : ''
                  }`}
                >
                  <label htmlFor="password">
                    Password
                    {!values.genpassword && (
                      <span className="ml-1 text-error">*</span>
                    )}
                  </label>
                  <div className="sm:col-span-2">
                    <div className="flex">
                      <SensitiveInput
                        as="field"
                        id="password"
                        name="password"
                        buttonSize="sm"
                        className="input input-sm input-primary w-full"
                        disabled={values.genpassword}
                      />
                    </div>
                    {errors.password &&
                      touched.password &&
                      typeof errors.password === 'string' && (
                        <div className="text-error">{errors.password}</div>
                      )}
                  </div>
                </div>
              </Form>
            </Modal>
          );
        }}
      </Formik>
      <BulkEditModal
        onCancel={() => setShowBulkEditModal(false)}
        onComplete={() => {
          setShowBulkEditModal(false);
          revalidate();
        }}
        selectedUserIds={selectedUsers}
        users={data.results}
        show={showBulkEditModal}
      />
      <PlexImportModal
        show={showImportModal}
        onCancel={() => setShowImportModal(false)}
        onComplete={() => {
          setShowImportModal(false);
          revalidate();
        }}
      />
      <div className="flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>User List</Header>
        <div className="mt-2 flex flex-grow flex-col lg:flex-grow-0 lg:flex-row">
          <div className="mb-2 flex flex-grow flex-col justify-between sm:flex-row lg:mb-0 lg:flex-grow-0">
            <Button
              buttonSize="sm"
              className="mb-2 flex-grow sm:mb-0 sm:mr-2"
              buttonType="primary"
              onClick={() => setCreateModal({ isOpen: true })}
            >
              <UserPlusIcon className="size-7 mr-2" />
              <span>Create Local User</span>
            </Button>
            {currentHasPermission(Permission.ADMIN) && (
              <Button
                buttonSize="sm"
                className="flex-grow lg:mr-2"
                buttonType="primary"
                onClick={() => setShowImportModal(true)}
              >
                <InboxArrowDownIcon className="size-7 mr-2" />
                <span>Import Plex Users</span>
              </Button>
            )}
          </div>
          <div className="mb-2 flex flex-grow lg:mb-0 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 text-primary-content sm:text-sm">
              <BarsArrowDownIcon className="size-7" />
            </span>
            <select
              id="sort"
              name="sort"
              onChange={(e) => {
                setCurrentSort(e.target.value as Sort);
                router.push(pathname);
              }}
              value={currentSort as string}
              className="select select-sm select-primary rounded-md rounded-l-none w-full disabled:border disabled:border-primary"
            >
              <option value="created">Join Date</option>
              <option value="invites">Invite Count</option>
              <option value="displayname">Display Name</option>
            </select>
          </div>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Table.TH>
              {(data.results ?? []).length > 1 && (
                <input
                  className="checkbox checkbox-sm checkbox-primary rounded-md"
                  type="checkbox"
                  id="selectAll"
                  name="selectAll"
                  checked={isAllUsersSelected()}
                  onChange={() => {
                    toggleAllUsers();
                  }}
                />
              )}
            </Table.TH>
            <Table.TH>User</Table.TH>
            <Table.TH>Invites</Table.TH>
            <Table.TH>Type</Table.TH>
            <Table.TH>Role</Table.TH>
            <Table.TH>Joined</Table.TH>
            <Table.TH>Invited By</Table.TH>
            <Table.TH className="text-right">
              {(data.results ?? []).length >= 1 && (
                <Button
                  buttonSize="sm"
                  className="disabled:bg-warning/50"
                  buttonType="warning"
                  onClick={() => setShowBulkEditModal(true)}
                  disabled={selectedUsers.length === 0}
                >
                  <PencilIcon className="size-4 mr-2" />
                  <span>Bulk Edit</span>
                </Button>
              )}
            </Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {data.results?.map((user) => (
            <tr key={`user-list-${user.id}`} data-testid="user-list-row">
              <Table.TD>
                {isUserPermsEditable(user.id) && (
                  <input
                    className="checkbox checkbox-primary checkbox-sm rounded-md"
                    type="checkbox"
                    id={`user-list-select-${user.id}`}
                    name={`user-list-select-${user.id}`}
                    checked={isUserSelected(user.id)}
                    onChange={() => {
                      toggleUser(user.id);
                    }}
                  />
                )}
              </Table.TD>
              <Table.TD>
                <div className="flex items-center">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    <CachedImage
                      className="h-10 w-10 rounded-full object-cover"
                      src={user.avatar}
                      alt=""
                      width={40}
                      height={40}
                    />
                  </Link>
                  <div className="ml-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-base font-bold leading-5 transition duration-300 hover:underline"
                      data-testid="user-list-username-link"
                    >
                      {user.displayName}
                    </Link>
                    {user.displayName.toLowerCase() !== user.email && (
                      <div className="text-sm leading-5 text-gray-300">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </Table.TD>
              <Table.TD>
                {user.id === currentUser?.id ||
                currentHasPermission(
                  [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
                  { type: 'or' }
                ) ? (
                  <Link
                    href={`/admin/users/${user.id}/invites`}
                    className="text-sm leading-5 transition duration-300 hover:underline"
                  >
                    {user.inviteCount}
                  </Link>
                ) : (
                  user.inviteCount
                )}
              </Table.TD>
              <Table.TD>
                {user.userType === UserType.PLEX ? (
                  <Badge
                    className="bg-accent/70 text-accent-content"
                    badgeType="warning"
                  >
                    Plex User
                  </Badge>
                ) : (
                  <Badge badgeType="default">Local User</Badge>
                )}
              </Table.TD>
              <Table.TD>
                {user.id === 1
                  ? 'Owner'
                  : hasPermission(Permission.ADMIN, user.permissions)
                    ? 'Admin'
                    : 'User'}
              </Table.TD>
              <Table.TD>{new Date(user.createdAt).toDateString()}</Table.TD>
              <Table.TD>
                {user.redeemedInvite?.createdBy?.id &&
                user.redeemedInvite?.createdBy?.displayName ? (
                  <Link
                    className="transition duration-300 hover:underline"
                    href={`/admin/users/${user.redeemedInvite.createdBy.id}`}
                  >
                    {user.redeemedInvite.createdBy.displayName}
                  </Link>
                ) : user.redeemedInvite ? (
                  <span className="text-gray-400 italic">Unknown User</span>
                ) : null}
              </Table.TD>
              <Table.TD alignText="right" className="space-y-2">
                <Button
                  buttonSize="sm"
                  buttonType="warning"
                  disabled={user.id === 1 && currentUser?.id !== 1}
                  className="mr-2 disabled:bg-warning/50 max-md:btn-block"
                  onClick={() =>
                    router.push(`/admin/users/${user.id}/settings`)
                  }
                >
                  Edit
                </Button>
                <Button
                  buttonType="error"
                  buttonSize="sm"
                  className="disabled:bg-error/50 disabled:pointer-events-auto disabled:hover:cursor-not-allowed disabled:hover:bg-error/40 max-md:btn-block"
                  disabled={
                    user.id === 1 ||
                    (currentUser?.id !== 1 &&
                      hasPermission(Permission.ADMIN, user.permissions))
                  }
                  onClick={() => setDeleteModal({ isOpen: true, user })}
                >
                  Delete
                </Button>
              </Table.TD>
            </tr>
          ))}
          <tr className="bg-base-100">
            <Table.TD colSpan={8} noPadding>
              <nav
                className="flex w-screen flex-col items-center space-x-4 space-y-3 px-6 py-3 sm:flex-row sm:space-y-0 lg:w-full"
                aria-label="Pagination"
              >
                <div className="hidden lg:flex lg:flex-1">
                  <p className="text-sm">
                    {data.results.length > 0 && (
                      <span className="font-medium">
                        Showing {pageIndex * currentPageSize + 1} to{' '}
                        {data.results.length < currentPageSize
                          ? pageIndex * currentPageSize + data.results.length
                          : (pageIndex + 1) * currentPageSize}{' '}
                        of {data.pageInfo.results} results
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex justify-center sm:flex-1 sm:justify-start lg:justify-center">
                  <span className="-mt-3 items-center text-sm sm:-ml-4 sm:mt-0 lg:ml-0">
                    Display
                    <select
                      id="pageSize"
                      name="pageSize"
                      onChange={(e) => {
                        setCurrentPageSize(Number(e.target.value));
                        router.push(pathname);
                        window.scrollTo(0, 0);
                      }}
                      defaultValue={currentPageSize}
                      className="select select-primary select-sm mx-1 inline"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    Results per page
                  </span>
                </div>
                <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
                  <Button
                    buttonSize="sm"
                    buttonType="primary"
                    disabled={!hasPrevPage}
                    onClick={() =>
                      updateQueryParams('page', (page - 1).toString())
                    }
                  >
                    <ChevronLeftIcon className="size-4" />
                    <span>Previous</span>
                  </Button>
                  <Button
                    buttonSize="sm"
                    buttonType="primary"
                    disabled={!hasNextPage}
                    onClick={() =>
                      updateQueryParams('page', (page + 1).toString())
                    }
                  >
                    <span>Next</span>
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </nav>
            </Table.TD>
          </tr>
        </Table.TBody>
      </Table>
    </div>
  );
};
export default AdminUsers;
