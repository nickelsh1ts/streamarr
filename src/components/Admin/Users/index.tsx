'use client';
import { isAuthed } from '@app/app/layout';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import Table from '@app/components/Common/Table';
import {
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const data = [
  {
    id: 1,
    displayName: 'Nickelsh1ts',
    email: 'ni.wege@nickelsh1ts.com',
    avatar: '/android-chrome-192x192.png',
    requestCount: 0,
    userType: 'local',
    createdAt: 'January 01, 2024',
  },
  {
    id: 2,
    displayName: 'Santiacevedo',
    email: 'santiacevedom@hotmail.com',
    avatar: '/android-chrome-192x192.png',
    requestCount: 0,
    userType: 'plex',
    createdAt: 'May 15, 2024',
  },
];

const AdminUsers = () => {
  const router = useRouter();
  const isUserPermsEditable = (userId: number) => userId !== 1;

  return (
    <div className="mt-6 mx-4">
      <Header>User list</Header>
      <Table>
        <thead>
          <tr>
            <Table.TH>
              {(data ?? []).length > 1 && (
                <input
                  className="checkbox checkbox-sm checkbox-primary rounded-md"
                  type="checkbox"
                  id="selectAll"
                  name="selectAll"
                  onChange={() => ({})}
                />
              )}
            </Table.TH>
            <Table.TH>User</Table.TH>
            <Table.TH>Requests</Table.TH>
            <Table.TH>Type</Table.TH>
            <Table.TH>Role</Table.TH>
            <Table.TH>Joined</Table.TH>
            <Table.TH className="text-right">
              {(data ?? []).length >= 1 && (
                <Button
                  buttonSize="sm"
                  className="disabled:bg-warning/50"
                  buttonType="warning"
                  onClick={() => {}}
                  disabled={true}
                >
                  <PencilIcon className="size-4 mr-2" />
                  <span>Bulk Edit</span>
                </Button>
              )}
            </Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {data?.map((user) => (
            <tr key={`user-list-${user.id}`} data-testid="user-list-row">
              <Table.TD>
                {isUserPermsEditable(user.id) && (
                  <input
                    className="checkbox checkbox-primary checkbox-sm rounded-md"
                    type="checkbox"
                    id={`user-list-select-${user.id}`}
                    name={`user-list-select-${user.id}`}
                  />
                )}
              </Table.TD>
              <Table.TD>
                <div className="flex items-center">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={user.avatar}
                      alt=""
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
                <Link
                  href={`/admin/users/${user.id}/requests`}
                  className="text-sm leading-5 transition duration-300 hover:underline"
                >
                  {user.requestCount}
                </Link>
              </Table.TD>
              <Table.TD>
                {user.userType === 'plex' ? (
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
              <Table.TD>{user.id === 1 ? 'Owner' : 'User'}</Table.TD>
              <Table.TD>{user.createdAt}</Table.TD>
              <Table.TD alignText="right">
                <Button
                  buttonSize="sm"
                  buttonType="warning"
                  disabled={user.id === 1 && !isAuthed}
                  className="mr-2 disabled:bg-warning/50"
                  onClick={() =>
                    router.push(`/admin/users/${user.id}/settings`)
                  }
                >
                  Edit
                </Button>
                <Button
                  buttonType="error"
                  buttonSize="sm"
                  className="disabled:bg-error/50 disabled:pointer-events-auto disabled:hover:cursor-not-allowed disabled:hover:bg-error/40"
                  disabled={user.id === 1 || !isAuthed}
                  onClick={() => {}}
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
                    {data.length > 0 && (
                      <span className="font-medium">
                        Showing 1 to 2 of 2 results
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
                      onChange={() => {}}
                      defaultValue={10}
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
                  <Button buttonSize="sm" disabled={true} onClick={() => {}}>
                    <ChevronLeftIcon className="size-4" />
                    <span>Previous</span>
                  </Button>
                  <Button buttonSize="sm" disabled={false} onClick={() => {}}>
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
