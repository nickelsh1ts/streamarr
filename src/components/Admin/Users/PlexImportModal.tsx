'use client';
import Alert from '@app/components/Common/Alert';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useState } from 'react';
import useSWR from 'swr';
import { useUser, Permission } from '@app/hooks/useUser';
import { useIntl, FormattedMessage } from 'react-intl';

interface PlexImportProps {
  onCancel?: () => void;
  onComplete?: () => void;
  show?: boolean;
}

const PlexImportModal = ({ onCancel, onComplete, show }: PlexImportProps) => {
  const { hasPermission } = useUser();
  const intl = useIntl();
  const isAdmin = hasPermission(Permission.ADMIN);
  const settings = useSettings();
  const [isImporting, setImporting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { data, error } = useSWR<
    {
      id: string;
      title: string;
      username: string;
      email: string;
      thumb: string;
    }[]
  >(isAdmin ? '/api/v1/settings/plex/users' : null, {
    revalidateOnMount: true,
  });

  const importUsers = async () => {
    setImporting(true);

    try {
      const { data: createdUsers } = await axios.post(
        '/api/v1/user/import-from-plex',
        { plexIds: selectedUsers }
      );

      if (!createdUsers.length) {
        throw new Error(
          intl.formatMessage({
            id: 'plexImport.noUsers',
            defaultMessage: 'No users were imported from Plex.',
          })
        );
      }

      Toast({
        title: intl.formatMessage(
          {
            id: 'plexImport.success',
            defaultMessage:
              '{count, plural, one {# Plex user} other {# Plex users}} imported successfully!',
          },
          { count: createdUsers.length }
        ),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });

      if (onComplete) {
        onComplete();
      }
    } catch {
      Toast({
        title: intl.formatMessage({
          id: 'plexImport.error',
          defaultMessage: 'Something went wrong while importing Plex users.',
        }),
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const isSelectedUser = (plexId: string): boolean =>
    selectedUsers.includes(plexId);

  const isAllUsers = (): boolean => selectedUsers.length === data?.length;

  const toggleUser = (plexId: string): void => {
    if (selectedUsers.includes(plexId)) {
      setSelectedUsers((users) => users.filter((user) => user !== plexId));
    } else {
      setSelectedUsers((users) => [...users, plexId]);
    }
  };

  const toggleAllUsers = (): void => {
    if (data && selectedUsers.length >= 0 && !isAllUsers()) {
      setSelectedUsers(data.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  if (!data && !error) {
    <LoadingEllipsis />;
  }

  if (error) {
    throw new Error('Error fetching users');
  }

  return (
    <Modal
      loading={!data && !error}
      title={intl.formatMessage({
        id: 'plexImport.title',
        defaultMessage: 'Import Plex Users',
      })}
      onOk={() => {
        importUsers();
      }}
      okDisabled={isImporting || !selectedUsers.length}
      okText={
        isImporting
          ? intl.formatMessage({
              id: 'plexImport.importing',
              defaultMessage: 'Importing...',
            })
          : intl.formatMessage({
              id: 'plexImport.import',
              defaultMessage: 'Import',
            })
      }
      onCancel={onCancel}
      show={show}
    >
      {data?.length ? (
        <>
          {settings.currentSettings.newPlexLogin && (
            <Alert
              title={
                <FormattedMessage
                  id="plexImport.newSignIn.warning"
                  defaultMessage="The <strong>Enable New Plex Sign-In</strong> setting is currently enabled. Plex users with library access do not need to be imported in order to sign in."
                  values={{
                    strong: (chunks: React.ReactNode) => (
                      <strong>{chunks}</strong>
                    ),
                  }}
                />
              }
              type="info"
            />
          )}
          <div className="flex flex-col">
            <div className="-mx-4 sm:mx-0">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow sm:rounded-lg">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="w-16 bg-neutral-700 px-4 py-3">
                          <span
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={isAllUsers()}
                            onClick={() => toggleAllUsers()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Space') {
                                toggleAllUsers();
                              }
                            }}
                            className="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none"
                          >
                            <span
                              aria-hidden="true"
                              className={`${
                                isAllUsers() ? 'bg-primary' : 'bg-neutral-800'
                              } absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out`}
                            ></span>
                            <span
                              aria-hidden="true"
                              className={`${
                                isAllUsers() ? 'translate-x-5' : 'translate-x-0'
                              } absolute left-0 inline-block h-5 w-5 rounded-full border border-neutral-200 bg-white shadow transition-transform duration-200 ease-in-out group-focus:border-primary group-focus:ring`}
                            ></span>
                          </span>
                        </th>
                        <th className="bg-neutral-700 px-1 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-neutral-200 md:px-6">
                          <FormattedMessage
                            id="common.user"
                            defaultMessage="User"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700 bg-neutral-800">
                      {data?.map((user) => (
                        <tr key={`user-${user.id}`}>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium leading-5 text-neutral-100">
                            <span
                              role="checkbox"
                              tabIndex={0}
                              aria-checked={isSelectedUser(user.id)}
                              onClick={() => toggleUser(user.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Space') {
                                  toggleUser(user.id);
                                }
                              }}
                              className="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none"
                            >
                              <span
                                aria-hidden="true"
                                className={`${
                                  isSelectedUser(user.id)
                                    ? 'bg-primary'
                                    : 'bg-neutral-900'
                                } absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out`}
                              ></span>
                              <span
                                aria-hidden="true"
                                className={`${
                                  isSelectedUser(user.id)
                                    ? 'translate-x-5'
                                    : 'translate-x-0'
                                } absolute left-0 inline-block h-5 w-5 rounded-full border border-neutral-200 bg-white shadow transition-transform duration-200 ease-in-out group-focus:border-primary group-focus:ring`}
                              ></span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-1 py-4 text-sm font-medium leading-5 text-neutral-100 md:px-6">
                            <div className="flex items-center">
                              <CachedImage
                                className="h-10 w-10 flex-shrink-0 rounded-full"
                                src={user.thumb}
                                alt=""
                                width={24}
                                height={24}
                              />
                              <div className="ml-4">
                                <div className="text-base font-bold leading-5">
                                  {user.username}
                                </div>
                                {user.username &&
                                  user.username.toLowerCase() !==
                                    user.email && (
                                    <div className="text-sm leading-5 text-neutral-300">
                                      {user.email}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Alert
          title={
            <FormattedMessage
              id="plexImport.noUsersToImport"
              defaultMessage="There are no Plex users to import."
            />
          }
          type="info"
        />
      )}
    </Modal>
  );
};

export default PlexImportModal;
