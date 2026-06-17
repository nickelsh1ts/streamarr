'use client';
import PermissionEdit from '@app/components/Admin/PermissionEdit';
import Modal from '@app/components/Common/Modal';
import Toggle from '@app/components/Common/Toggle';
import LibrarySelector from '@app/components/LibrarySelector';
import Toast from '@app/components/Toast';
import type { User } from '@app/hooks/useUser';
import { Permission, useUser } from '@app/hooks/useUser';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { UserBulkUpdatePlexSyncSummary } from '@server/interfaces/api/userInterfaces';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

type BulkEditTab = 'permissions' | 'libraries';

interface BulkEditProps {
  selectedUserIds: number[];
  users?: User[];
  show?: boolean;
  onCancel?: () => void;
  onComplete?: (updatedUsers: User[]) => void;
  onSaving?: (isSaving: boolean) => void;
}

const BulkEditModal = ({
  selectedUserIds,
  users,
  show = false,
  onCancel,
  onComplete,
  onSaving,
}: BulkEditProps) => {
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<BulkEditTab>('permissions');
  const [currentPermission, setCurrentPermission] = useState(0);
  const [currentSharedLibraries, setCurrentSharedLibraries] =
    useState('unchanged');
  const [currentAllowDownloads, setCurrentAllowDownloads] = useState<
    boolean | null
  >(null);
  const [currentAllowLiveTv, setCurrentAllowLiveTv] = useState<boolean | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const { data: mainSettings } = useSWR<MainSettings>(
    show && currentHasPermission(Permission.ADMIN)
      ? '/api/v1/settings/main'
      : null
  );

  useEffect(() => {
    if (onSaving) {
      onSaving(isSaving);
    }
  }, [isSaving, onSaving]);

  const plexAccessPayload = {
    ...(currentSharedLibraries !== 'unchanged' && {
      sharedLibraries:
        currentSharedLibraries === '' ? 'server' : currentSharedLibraries,
    }),
    ...(currentAllowDownloads !== null && {
      allowDownloads: currentAllowDownloads,
    }),
    ...(currentAllowLiveTv !== null && {
      allowLiveTv: currentAllowLiveTv,
    }),
  };
  const hasPlexAccessChanges = Object.keys(plexAccessPayload).length > 0;

  const updateUsers = async () => {
    try {
      setIsSaving(true);
      const { data } = await axios.put<{
        users: User[];
        plexSync?: UserBulkUpdatePlexSyncSummary;
      }>(
        `/api/v1/user`,
        activeTab === 'permissions'
          ? {
              ids: selectedUserIds,
              permissions: currentPermission,
            }
          : {
              ids: selectedUserIds,
              ...plexAccessPayload,
            }
      );
      if (onComplete) {
        onComplete(data.users);
      }
      if (activeTab === 'permissions') {
        Toast({
          title: intl.formatMessage({
            id: 'userPermissions.success',
            defaultMessage: 'User permissions saved successfully!',
          }),
          type: 'success',
          icon: <CheckBadgeIcon className="size-7" />,
        });
      } else if (data.plexSync?.removed) {
        Toast({
          title: intl.formatMessage({
            id: 'userLibraries.savedUsersRemovedFromPlex',
            defaultMessage:
              'Settings saved, but some users were not found in Plex.',
          }),
          message: intl.formatMessage(
            {
              id: 'userLibraries.savedUsersRemovedFromPlexMessage',
              defaultMessage:
                '{count, plural, one {# user was} other {# users were}} removed from the Plex server and {count, plural, one {has} other {have}} been deactivated.',
            },
            { count: data.plexSync.removed }
          ),
          type: 'warning',
          icon: <ExclamationTriangleIcon className="size-7" />,
        });
      } else if (data.plexSync?.failed) {
        Toast({
          title: intl.formatMessage({
            id: 'userLibraries.savedPlexSyncFailed',
            defaultMessage: 'Settings saved, but Plex sync failed.',
          }),
          message: intl.formatMessage(
            {
              id: 'userLibraries.savedPlexSyncFailedMessage',
              defaultMessage:
                'Changes were saved, but {count, plural, one {# user} other {# users}} could not be synced with Plex.',
            },
            { count: data.plexSync.failed }
          ),
          type: 'warning',
          icon: <ExclamationTriangleIcon className="size-7" />,
        });
      } else {
        Toast({
          title: intl.formatMessage({
            id: 'userLibraries.success',
            defaultMessage: 'Plex access settings saved successfully!',
          }),
          message: data.plexSync?.synced
            ? intl.formatMessage({
                id: 'userLibraries.syncedWithPlex',
                defaultMessage: 'Changes have been synced with Plex.',
              })
            : undefined,
          type: 'success',
          icon: <CheckBadgeIcon className="size-7" />,
        });
      }
    } catch {
      Toast({
        title:
          activeTab === 'permissions'
            ? intl.formatMessage({
                id: 'userPermissions.error',
                defaultMessage:
                  'Something went wrong while saving user permissions.',
              })
            : intl.formatMessage({
                id: 'userLibraries.error',
                defaultMessage:
                  'Something went wrong while saving Plex access settings.',
              }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Seed the editable values when the selection changes or the modal opens
  const [prevUsers, setPrevUsers] = useState(users);
  const [prevSelectedUserIds, setPrevSelectedUserIds] =
    useState(selectedUserIds);
  const [prevShow, setPrevShow] = useState(show);
  if (
    prevUsers !== users ||
    prevSelectedUserIds !== selectedUserIds ||
    (show && !prevShow)
  ) {
    setPrevUsers(users);
    setPrevSelectedUserIds(selectedUserIds);
    setPrevShow(show);
    if (users) {
      const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
      if (selectedUsers.length > 0) {
        const { permissions: seededPermissions } = selectedUsers.reduce(
          ({ permissions: aPerms }, { permissions: bPerms }) => {
            return {
              permissions: aPerms === bPerms ? aPerms : NaN,
            };
          },
          { permissions: selectedUsers[0].permissions }
        );
        // Seed only when all selected users share the same permissions
        // (including 0); otherwise reset to avoid applying stale values
        setCurrentPermission(
          Number.isNaN(seededPermissions) ? 0 : seededPermissions
        );
        setActiveTab('permissions');
        setCurrentSharedLibraries('unchanged');
        setCurrentAllowDownloads(null);
        setCurrentAllowLiveTv(null);
      }
    }
  }
  if (prevShow !== show) {
    setPrevShow(show);
  }

  const tabs: { id: BulkEditTab; title: React.ReactNode }[] = [
    {
      id: 'permissions',
      title: (
        <FormattedMessage
          id="settings.permissions"
          defaultMessage="Permissions"
        />
      ),
    },
    {
      id: 'libraries',
      title: (
        <FormattedMessage
          id="settings.plexAccess"
          defaultMessage="Plex Access"
        />
      ),
    },
  ];

  return (
    <Modal
      title={intl.formatMessage({
        id: 'users.bulkEditTitle',
        defaultMessage: 'Bulk Edit Users',
      })}
      onOk={() => {
        updateUsers();
      }}
      okDisabled={
        isSaving || (activeTab === 'libraries' && !hasPlexAccessChanges)
      }
      okText={intl.formatMessage({
        id: 'common.saveChanges',
        defaultMessage: 'Save Changes',
      })}
      onCancel={onCancel}
      show={show}
    >
      <div
        role="tablist"
        className="tabs-border border-neutral border-b"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
            return;
          }
          e.preventDefault();
          const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
          const nextIndex =
            (currentIndex + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
            tabs.length;
          setActiveTab(tabs[nextIndex].id);
          document
            .getElementById(`bulk-edit-tab-${tabs[nextIndex].id}`)
            ?.focus();
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab.id);
            }}
            id={`bulk-edit-tab-${tab.id}`}
            data-testid={`bulk-edit-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="bulk-edit-tabpanel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`tab h-fit w-fit py-2 font-bold [--tab-color:black] ${activeTab === tab.id ? 'tab-active border-primary! text-primary' : ''}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div
        id="bulk-edit-tabpanel"
        className="my-6 flex flex-col gap-4"
        role="tabpanel"
        aria-labelledby={`bulk-edit-tab-${activeTab}`}
      >
        {activeTab === 'permissions' ? (
          <PermissionEdit
            actingUser={currentUser}
            currentPermission={currentPermission}
            onUpdate={(newPermission) => setCurrentPermission(newPermission)}
          />
        ) : (
          <>
            <p className="mb-2 text-sm">
              <FormattedMessage
                id="users.bulkEditLibrariesDescription"
                defaultMessage="Changes will be applied to all selected users and synced with Plex automatically on save. Fields left unchanged are not modified. Local users will be updated but not synced."
              />
            </p>
            <LibrarySelector
              value={currentSharedLibraries}
              serverValue={mainSettings?.sharedLibraries}
              isUserSettings
              allowUnchanged
              setFieldValue={(_property, value) =>
                setCurrentSharedLibraries(value)
              }
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Toggle
                triState
                id="bulkAllowDownloads"
                valueOf={currentAllowDownloads}
                onChange={setCurrentAllowDownloads}
                title={
                  <FormattedMessage
                    id="invite.allowDownloads"
                    defaultMessage="Allow Downloads"
                  />
                }
              />
              <Toggle
                triState
                id="bulkAllowLiveTv"
                valueOf={currentAllowLiveTv}
                onChange={setCurrentAllowLiveTv}
                title={
                  <FormattedMessage
                    id="settings.allowLiveTv"
                    defaultMessage="Allow Live TV Access"
                  />
                }
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default BulkEditModal;
