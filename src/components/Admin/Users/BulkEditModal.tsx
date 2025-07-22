'use client';
import Modal from '@app/components/Common/Modal';
import PermissionEdit from '@app/components/Admin/PermissionEdit';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Toast from '@app/components/Toast';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';

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
  const { user: currentUser } = useUser();
  const [currentPermission, setCurrentPermission] = useState(0);
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
        title: 'User permissions saved successfully!',
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch {
      Toast({
        title: 'Something went wrong while saving user permissions.',
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (users) {
      const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
      if (selectedUsers.length === 0) return;
      const { permissions: allPermissionsEqual } = selectedUsers.reduce(
        ({ permissions: aPerms }, { permissions: bPerms }) => {
          return {
            permissions: aPerms === bPerms ? aPerms : NaN,
          };
        },
        { permissions: selectedUsers[0].permissions }
      );
      if (allPermissionsEqual) {
        setCurrentPermission(allPermissionsEqual);
      }
    }
  }, [users, selectedUserIds]);

  return (
    <Modal
      title={'Edit User Permissions'}
      onOk={() => {
        updateUsers();
      }}
      okDisabled={isSaving}
      okText={'Save'}
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
