'use client';
import type { PermissionItem } from '@app/components/Admin/PermissionOption';
import PermissionOption from '@app/components/Admin/PermissionOption';
import { Permission, type User } from '@app/hooks/useUser';
import { useIntl } from 'react-intl';

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
  const intl = useIntl();

  const permissionList: PermissionItem[] = [
    {
      id: 'admin',
      name: intl.formatMessage({ id: 'common.admin', defaultMessage: 'Admin' }),
      description: intl.formatMessage({
        id: 'userPermissions.admin.description',
        defaultMessage:
          'Full administrator access. Bypasses all other permission checks.',
      }),
      permission: Permission.ADMIN,
    },
    {
      id: 'manageusers',
      name: intl.formatMessage({
        id: 'common.manageUsers',
        defaultMessage: 'Manage Users',
      }),
      description: intl.formatMessage({
        id: 'userPermissions.manageUsers.description',
        defaultMessage:
          'Grant permission to manage users. Users with this permission cannot modify users with or grant the Admin privilege.',
      }),
      permission: Permission.MANAGE_USERS,
    },
    {
      id: 'createevents',
      name: intl.formatMessage({
        id: 'userPermissions.createEvents.name',
        defaultMessage: 'Create Events',
      }),
      description: intl.formatMessage({
        id: 'userPermissions.createEvents.description',
        defaultMessage: 'Grant permission to create custom events',
      }),
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
      name: intl.formatMessage({
        id: 'userPermissions.streamarr.name',
        defaultMessage: 'Streamarr',
      }),
      description: intl.formatMessage({
        id: 'userPermissions.streamarr.description',
        defaultMessage:
          'Grant permission to watch, request, invite and view the schedule.',
      }),
      children: [
        {
          id: 'request',
          name: intl.formatMessage({
            id: 'common.request',
            defaultMessage: 'Request',
          }),
          description: intl.formatMessage({
            id: 'userPermissions.request.description',
            defaultMessage:
              'Grant permission to access requests (note: access in overseerr must be granted as well)',
          }),
          permission: Permission.REQUEST,
        },
        {
          id: 'viewschedule',
          name: intl.formatMessage({
            id: 'userPermissions.viewSchedule.name',
            defaultMessage: 'View Schedule',
          }),
          description: intl.formatMessage({
            id: 'userPermissions.viewSchedule.description',
            defaultMessage: 'Grant permission to view the release schedule.',
          }),
          permission: Permission.VIEW_SCHEDULE,
        },
        {
          id: 'createinvites',
          name: intl.formatMessage({
            id: 'userPermissions.createInvites.name',
            defaultMessage: 'Create Invites',
          }),
          description: intl.formatMessage({
            id: 'userPermissions.createInvites.description',
            defaultMessage:
              'Grant permission to create invites (in accordance to their quotas).',
          }),
          permission: Permission.CREATE_INVITES,
        },
      ],
      permission: Permission.STREAMARR,
    },
    {
      id: 'manageinvite',
      name: intl.formatMessage({
        id: 'userPermissions.manageInvites.name',
        defaultMessage: 'Manage Invites',
      }),
      description: intl.formatMessage({
        id: 'userPermissions.manageInvites.description',
        defaultMessage:
          'Grant permission to manage invites. All invites made by a user with this permission can be modified.',
      }),
      children: [
        {
          id: 'advancedinvite',
          name: intl.formatMessage({
            id: 'userPermissions.advancedInvites.name',
            defaultMessage: 'Advanced Invite',
          }),
          description: intl.formatMessage({
            id: 'userPermissions.advancedInvites.description',
            defaultMessage:
              'Grant permission to make invites with unlimited uses and never expire. Users with this permission can also modify the invites Plex downloads permission and code.',
          }),
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
          name: intl.formatMessage({
            id: 'userPermissions.viewInvites.name',
            defaultMessage: 'View Invites',
          }),
          description: intl.formatMessage({
            id: 'userPermissions.viewInvites.description',
            defaultMessage:
              'Grants permission to view invites from other users.',
          }),
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
