'use client';
import type { PermissionItem } from '@app/components/Admin/PermissionOption';
import PermissionOption from '@app/components/Admin/PermissionOption';

const permissionList: PermissionItem[] = [
  {
    id: 'admin',
    name: 'Admin',
    description:
      'Full administrator access. Bypasses all other permission checks.',
  },
  {
    id: 'manageusers',
    name: 'Manage Users',
    description:
      'Grant permission to manage users. Users with this permission cannot modify users with or grant the Admin privilege.',
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
      },
      {
        id: 'viewinvites',
        name: 'View Invites',
        description: 'Grants permission to view invites from other users.',
      },
      {
        id: 'deleteinvites',
        name: 'Delete Invites',
        description:
          'Grants permission to delete active and inactive invite codes.',
      },
      {
        id: 'grantinvites',
        name: 'Grant Invites',
        description:
          'Grants permission to change the alloted invites for other users.',
      },
    ],
  },
];

const PermissionEdit = () => {
  return (
    <>
      {permissionList.map((permissionItem) => (
        <PermissionOption
          key={`permission-option-${permissionItem.id}`}
          option={permissionItem}
          onUpdate={() => {}}
        />
      ))}
    </>
  );
};
export default PermissionEdit;
