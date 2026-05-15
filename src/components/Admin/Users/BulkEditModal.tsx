'use client';
import Modal from '@app/components/Common/Modal';
import PermissionEdit from '@app/components/Admin/PermissionEdit';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Toast from '@app/components/Toast';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useIntl } from 'react-intl';

interface BulkEditProps {
  selectedUserIds: number[];
  users?: User[];
  show?: boolean;
  onCancel?: () => void;
  onComplete?: (updatedUsers: User[]) => void;
  onSaving?: (isSaving: boolean) => void;
}

const getSharedPermission = (
  users: User[] | undefined,
  selectedUserIds: number[]
): number => {
  if (!users) {
    return 0;
  }

  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id)
  );
  if (selectedUsers.length === 0) {
    return 0;
  }

  const { permissions: sharedPermission } = selectedUsers.reduce(
    (
      { permissions: currentPermissions },
      { permissions: nextPermissions }
    ) => ({
      permissions:
        currentPermissions === nextPermissions ? currentPermissions : NaN,
    }),
    { permissions: selectedUsers[0].permissions }
  );

  return Number.isNaN(sharedPermission) ? 0 : sharedPermission;
};

const BulkEditModal = ({
  selectedUserIds,
  users,
  show = false,
  onCancel,
  onComplete,
  onSaving,
}: BulkEditProps) => {
  const { user: currentUser } = useUser();
  const intl = useIntl();
  const [currentPermission, setCurrentPermission] = useState(() =>
    getSharedPermission(users, selectedUserIds)
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (onSaving) {
      onSaving(isSaving);
    }
  }, [isSaving, onSaving]);

  const updateUsers = async () => {
    try {
      setIsSaving(true);
      const { data: updated } = await axios.put<User[]>(`/api/v1/user`, {
        ids: selectedUserIds,
        permissions: currentPermission,
      });
      if (onComplete) {
        onComplete(updated);
      }
      Toast({
        title: intl.formatMessage({
          id: 'userPermissions.success',
          defaultMessage: 'User permissions saved successfully!',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch {
      Toast({
        title: intl.formatMessage({
          id: 'userPermissions.error',
          defaultMessage: 'Something went wrong while saving user permissions.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'userPermissions.title',
        defaultMessage: 'Edit User Permissions',
      })}
      onOk={() => {
        updateUsers();
      }}
      okDisabled={isSaving}
      okText={intl.formatMessage({
        id: 'common.saveChanges',
        defaultMessage: 'Save Changes',
      })}
      onCancel={onCancel}
      show={show}
    >
      <div className="mb-6">
        <PermissionEdit
          actingUser={currentUser}
          currentPermission={currentPermission}
          onUpdate={(newPermission) => setCurrentPermission(newPermission)}
        />
      </div>
    </Modal>
  );
};

export default BulkEditModal;
