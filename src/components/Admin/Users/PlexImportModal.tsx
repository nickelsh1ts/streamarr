'use client';
import Alert from '@app/components/Common/Alert';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import {
  CheckBadgeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

interface PlexImportProps {
  onCancel?: () => void;
  onComplete?: () => void;
  show?: boolean;
}

interface PlexImportResponse {
  createdUsers: { id: number }[];
  refreshedUsers: number;
  unchangedUsers: number;
}

type PlexImportResult = PlexImportResponse | { id: number }[];

const PlexImportModal = ({ onCancel, onComplete, show }: PlexImportProps) => {
  const { hasPermission } = useUser();
  const intl = useIntl();
  const isAdmin = hasPermission(Permission.ADMIN);
  const settings = useSettings();
  const [activeAction, setActiveAction] = useState<'import' | 'sync' | null>(
    null
  );
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

  const importUsers = async (syncExisting = false) => {
    setActiveAction(syncExisting ? 'sync' : 'import');

    try {
      const { data: result } = await axios.post<PlexImportResult>(
        '/api/v1/user/import-from-plex',
        syncExisting ? { syncExisting: true } : { plexIds: selectedUsers }
      );
      const summary = Array.isArray(result)
        ? { createdUsers: result, refreshedUsers: 0, unchangedUsers: 0 }
        : result;

      const hasChanges =
        summary.createdUsers.length > 0 || summary.refreshedUsers > 0;
      const resultMessages = [
        summary.createdUsers.length > 0
          ? intl.formatMessage(
              {
                id: 'plexImport.resultCreated',
                defaultMessage:
                  'Created {count, plural, one {# Plex user} other {# Plex users}}',
              },
              { count: summary.createdUsers.length }
            )
          : null,
        summary.refreshedUsers > 0
          ? intl.formatMessage(
              {
                id: 'plexImport.resultRefreshed',
                defaultMessage:
                  'Updated {count, plural, one {# existing user} other {# existing users}}',
              },
              { count: summary.refreshedUsers }
            )
          : null,
        summary.unchangedUsers > 0
          ? intl.formatMessage(
              {
                id: 'plexImport.resultUnchanged',
                defaultMessage:
                  '{count, plural, one {# existing Plex user is} other {# existing Plex users are}} already up to date.',
              },
              { count: summary.unchangedUsers }
            )
          : null,
      ].filter((message): message is string => message !== null);
      if (resultMessages.length === 0) {
        resultMessages.push(
          syncExisting
            ? intl.formatMessage({
                id: 'plexImport.syncNoUsers',
                defaultMessage: 'No existing Plex users were found to sync.',
              })
            : intl.formatMessage({
                id: 'plexImport.noUsers',
                defaultMessage: 'No users were imported from Plex.',
              })
        );
      }

      Toast({
        title: syncExisting
          ? intl.formatMessage({
              id: 'plexImport.syncComplete',
              defaultMessage: 'Plex sync complete',
            })
          : intl.formatMessage({
              id: 'plexImport.importComplete',
              defaultMessage: 'Plex import complete',
            }),
        message: resultMessages.join('; '),
        type: hasChanges ? 'success' : 'info',
        icon: hasChanges ? (
          <CheckBadgeIcon className="size-7" />
        ) : (
          <InformationCircleIcon className="size-7" />
        ),
      });

      onComplete?.();
    } catch {
      Toast({
        title: intl.formatMessage({
          id: 'plexImport.error',
          defaultMessage: 'Something went wrong while importing Plex users.',
        }),
        type: 'error',
      });
    } finally {
      setActiveAction(null);
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
      okDisabled={activeAction !== null || !selectedUsers.length}
      okText={
        activeAction === 'import'
          ? intl.formatMessage({
              id: 'plexImport.importing',
              defaultMessage: 'Importing…',
            })
          : intl.formatMessage({
              id: 'plexImport.import',
              defaultMessage: 'Import',
            })
      }
      onSecondary={() => importUsers(true)}
      secondaryDisabled={activeAction !== null}
      secondaryText={
        activeAction === 'sync'
          ? intl.formatMessage({
              id: 'plexImport.syncing',
              defaultMessage: 'Syncing…',
            })
          : intl.formatMessage({
              id: 'plexImport.syncExisting',
              defaultMessage: 'Sync Existing',
            })
      }
      secondaryButtonType="accent"
      onCancel={onCancel}
      show={show}
    >
      {data?.length ? (
        <>
          {settings.currentSettings.newPlexLogin && (
            <Alert type="info">
              <p className="text-info-content flex-1 text-sm font-medium">
                <FormattedMessage
                  id="plexImport.newSignIn.warning"
                  defaultMessage="The <strong>Enable New Plex Sign-In</strong> setting is currently enabled. Plex users with library access do not need to be imported in order to sign in."
                  values={{
                    strong: (chunks: React.ReactNode) => (
                      <strong>{chunks}</strong>
                    ),
                  }}
                />
              </p>
            </Alert>
          )}
          <div className="flex flex-col">
            <div className="-mx-4 sm:mx-0">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow sm:rounded-lg">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="bg-neutral w-16 px-4 py-3">
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
                            className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none"
                          >
                            <span
                              aria-hidden="true"
                              className={`${
                                isAllUsers() ? 'bg-primary' : 'bg-base-300'
                              } absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out`}
                            ></span>
                            <span
                              aria-hidden="true"
                              className={`${
                                isAllUsers() ? 'translate-x-5' : 'translate-x-0'
                              } border-neutral group-focus:border-primary absolute left-0 inline-block h-5 w-5 rounded-full border bg-white shadow transition-transform duration-200 ease-in-out group-focus:ring`}
                            ></span>
                          </span>
                        </th>
                        <th className="bg-neutral text-neutral-content px-1 py-3 text-left text-xs leading-4 font-medium tracking-wider uppercase md:px-6">
                          <FormattedMessage
                            id="common.user"
                            defaultMessage="User"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-neutral bg-base-300 divide-y">
                      {data?.map((user) => (
                        <tr key={`user-${user.id}`}>
                          <td className="text-neutral-content px-4 py-4 text-sm leading-5 font-medium whitespace-nowrap">
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
                              className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none"
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
                                } border-neutral group-focus:border-primary absolute left-0 inline-block h-5 w-5 rounded-full border bg-white shadow transition-transform duration-200 ease-in-out group-focus:ring`}
                              ></span>
                            </span>
                          </td>
                          <td className="text-neutral-content px-1 py-4 text-sm leading-5 font-medium whitespace-nowrap md:px-6">
                            <div className="flex items-center">
                              <CachedImage
                                className="h-10 w-10 shrink-0 rounded-full"
                                src={user.thumb}
                                alt=""
                                width={24}
                                height={24}
                              />
                              <div className="ml-4">
                                <div className="text-base-content leading-5 font-bold">
                                  {user.username}
                                </div>
                                {user.username &&
                                  user.username.toLowerCase() !==
                                    user.email && (
                                    <div className="text-neutral text-sm leading-5">
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
        >
          <FormattedMessage
            id="plexImport.syncHint"
            defaultMessage="Use Sync Existing to refresh linked Plex users."
          />
        </Alert>
      )}
    </Modal>
  );
};

export default PlexImportModal;
