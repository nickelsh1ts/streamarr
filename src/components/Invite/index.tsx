'use client';
// import ComingSoon from '@app/components/Common/ComingSoon';
import Header from '@app/components/Common/Header';
import Modal from '@app/components/Common/Modal';
import CreateInvite from '@app/components/Invite/CreateInvite';
import InvitesList from '@app/components/Invite/InvitesList';
import { FunnelIcon, BarsArrowDownIcon } from '@heroicons/react/24/solid';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const Invite = () => {
  const [modalState, setModalState] = useState(false);
  const userQuery = useParams<{ userid: string }>();
  let user;

  const currentUser = {
    id: 1,
    displayName: 'Nickelsh1ts',
    invitesRemaining: 'Unlimited' as number | 'Unlimited',
    invitesSent: 15,
  };

  if (!userQuery.userid || userQuery.userid === currentUser.id.toString()) {
    user = {
      id: currentUser.id,
      displayName: currentUser.displayName,
      avatar: '/android-chrome-192x192.png',
      email: `nickelsh1ts@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.dev`,
      createdAt: moment().toDate(),
      InvitesRemaining: currentUser.invitesRemaining,
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'DemoUser',
      avatar: '/android-chrome-192x192.png',
      email: `demo@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.dev`,
      createdAt: moment().toDate(),
      InvitesRemaining: 4,
    };
  }

  const subtextItems: React.ReactNode[] =
    user.id != currentUser.id
      ? [
          user.displayName,
          <>
            {user.InvitesRemaining} invites{' '}
            {user.invitesRemaining != 'Unlimited' && 'remaining'}
          </>,
        ]
      : [
          <>
            {currentUser.invitesRemaining} invites{' '}
            {currentUser.invitesRemaining != 'Unlimited' && 'remaining'}
          </>,
        ];

  return (
    <div className="w-full self-center mb-4">
      <div className="flex flex-col justify-between lg:flex-row lg:items-end">
        <Header
          subtext={subtextItems?.reduce((prev, curr) => (
            <>
              {prev} | {curr}
            </>
          ))}
        >
          Invite a Friend
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm text-primary-content">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              onChange={() => {}}
              className="select select-sm select-primary rounded-l-none w-full flex-1"
            >
              <option value="all">All</option>
              <option value="pending">Active</option>
              <option value="approved">Inactive</option>
              <option value="processing">Expired</option>
              <option value="failed">Redeemed</option>
            </select>
          </div>
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0 sm:mr-2">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-primary-content sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sort"
              name="sort"
              onChange={() => {}}
              className="select select-sm select-primary rounded-l-none block w-full flex-1"
            >
              <option value="created">Created</option>
              <option value="modified">Modified</option>
            </select>
          </div>
          <button
            onClick={() => setModalState(true)}
            className="btn btn-primary btn-sm rounded-md disabled:btn-secondary"
            disabled={
              user.InvitesRemaining <= 0 && user.InvitesRemaining != null
            }
          >
            Create Invite
          </button>
        </div>
      </div>
      <Modal
        onClose={() => setModalState(false)}
        title="Create Invite"
        show={modalState}
        content={<CreateInvite setModalState={setModalState} />}
      />
      <InvitesList />
      {/* <ComingSoon /> */}
    </div>
  );
};
export default Invite;
