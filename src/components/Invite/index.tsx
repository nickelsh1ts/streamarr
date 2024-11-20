'use client';
import Modal from '@app/components/Common/Modal';
import CreateInvite from '@app/components/Invite/CreateInvite';
import InvitesList from '@app/components/Invite/InvitesList';
import { useState } from 'react';

const InvitesRemaining: number = 4;

const Invite = () => {
  const [modalState, setModalState] = useState(false);

  return (
    <div className="w-full self-center">
      <div className="flex flex-wrap justify-between justify-items-center border-b-2 border-primary py-4 px-2 gap-2 bg-primary backdrop-blur-md bg-opacity-30">
        <div className="max-sm:mx-auto">
          <div className="font-extrabold text-xl">Invite a friend</div>
          <p className="text-xs align-middle">Manage your invitations</p>
        </div>
        <div className="content-center max-[441px]:order-3 max-sm:mx-auto">
          Invites remaining:{' '}
          <span className="text-accent text-lg align-middle font-bold">
            {InvitesRemaining && InvitesRemaining != null && InvitesRemaining}
            {InvitesRemaining === null && '∞'}
          </span>
        </div>
        <div className="content-center max-[441px]:order-2 max-sm:mx-auto">
          <button
            onClick={() => setModalState(true)}
            className="btn btn-primary btn-sm rounded-md disabled:btn-secondary"
            disabled={InvitesRemaining <= 0 && InvitesRemaining != null}
          >
            Create Invite
          </button>
        </div>
      </div>
      <div className="mt-4 mx-2">
        {InvitesRemaining || InvitesRemaining === null
          ? 'Send a friend an invite and let them join in on the fun!'
          : "Sorry, but you don't seem to have any invites left"}
      </div>
      {modalState && (
        <Modal
          onClose={() => setModalState(false)}
          title="Create Invite"
          show={modalState}
          content={<CreateInvite setModalState={setModalState} />}
        />
      )}
      <InvitesList />
    </div>
  );
};
export default Invite;
