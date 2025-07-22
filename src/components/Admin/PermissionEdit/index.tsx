'use client';
import type { PermissionItem } from '@app/components/Admin/PermissionOption';
import PermissionOption from '@app/components/Admin/PermissionOption';
import { Permission, type User } from '@app/hooks/useUser';

interface PermissionEditProps {
  actingUser?: User;
  currentUser?: User;
  currentPermission: number;
  onUpdate: (newPermissions: number) => void;
}

const PermissionEdit = ({
  actingUser,
  currentUser,
  currentPermission,
  onUpdate,
}: PermissionEditProps) => {
  const permissionList: PermissionItem[] = [
    {
      id: 'admin',
      name: 'Admin',
      description:
        'Full administrator access. Bypasses all other permission checks.',
      permission: Permission.ADMIN,
    },
    {
      id: 'manageusers',
      name: 'Manage Users',
      description:
        'Grant permission to manage users. Users with this permission cannot modify users with or grant the Admin privilege.',
      permission: Permission.MANAGE_USERS,
    },
    {
      id: 'createevents',
      name: 'Create Events',
      description: 'Grant permission to create custom events',
      permission: Permission.CREATE_EVENTS,
      requires: [
        {
          permissions: [Permission.VIEW_SCHEDULE, Permission.STREAMARR],
          type: 'or',
        },
      ],
    },
    {
      id: 'streamarr',
      name: 'Streamarr',
      description:
        'Grant permission to watch, request, invite and view the schedule.',
      children: [
        {
          id: 'request',
          name: 'Request',
          description:
            'Grant permission to access requests (note: access in overseerr must be granted as well)',
          permission: Permission.REQUEST,
        },
        {
          id: 'viewschedule',
          name: 'View Schedule',
          description: 'Grant permission to view the release schedule.',
          permission: Permission.VIEW_SCHEDULE,
        },
        {
          id: 'createinvites',
          name: 'Create Invites',
          description:
            'Grant permission to create invites (in accordance to their quotas).',
          permission: Permission.CREATE_INVITES,
        },
      ],
      permission: Permission.STREAMARR,
    },
    {
      id: 'manageinvite',
      name: 'Manage Invites',
      description:
        'Grant permission to manage invites. All invites made by a user with this permission can be modified.',
      children: [
        {
          id: 'advancedinvite',
          name: 'Advanced Invite',
          description:
            'Grant permission to make invites with unlimited uses and never expire. Users with this permission can also modify the invites Plex downloads permission and code.',
          permission: Permission.ADVANCED_INVITES,
          requires: [
            {
              permissions: [Permission.CREATE_INVITES, Permission.STREAMARR],
              type: 'or',
            },
          ],
        },
        {
          id: 'viewinvites',
          name: 'View Invites',
          description: 'Grants permission to view invites from other users.',
          permission: Permission.VIEW_INVITES,
          requires: [
            {
              permissions: [Permission.CREATE_INVITES, Permission.STREAMARR],
              type: 'or',
            },
          ],
        },
      ],
      permission: Permission.MANAGE_INVITES,
      requires: [
        {
          permissions: [Permission.CREATE_INVITES, Permission.STREAMARR],
          type: 'or',
        },
      ],
    },
  ];

  return (
    <>
      {permissionList.map((permissionItem) => (
        <PermissionOption
          key={`permission-option-${permissionItem.id}`}
          option={permissionItem}
          actingUser={actingUser}
          currentUser={currentUser}
          currentPermission={currentPermission}
          onUpdate={(newPermission) => onUpdate(newPermission)}
        />
      ))}
    </>
  );
};
export default PermissionEdit;
