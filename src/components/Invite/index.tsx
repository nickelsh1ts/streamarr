'use client';
import Modal from '@app/components/Common/Modal';
import CreateInvite from '@app/components/Invite/CreateInvite';
import { useState } from 'react';

const InvitesRemaining: number = 5;

const Invite = () => {
  const [modalState, setModalState] = useState(false);

  return (
    <div className="relative max-w-screen-xl mx-auto">
      <div className="flex flex-wrap justify-between justify-items-center border-b-2 border-primary py-4 px-2 gap-2 bg-primary backdrop-blur-md bg-opacity-30">
        <div className="max-sm:mx-auto">
          <div className="font-extrabold text-xl">Invite a friend</div>
          <p className="text-xs">Manage your invitations</p>
        </div>
        <div className="content-center max-[441px]:order-3 max-sm:mx-auto">
          Invites remaining:{' '}
          <span className="text-accent font-bold">{InvitesRemaining}</span>
        </div>
        <div className="content-center max-[441px]:order-2 max-sm:mx-auto">
          <button
            onClick={() => setModalState(true)}
            className="btn btn-primary btn-sm rounded-md disabled:btn-secondary"
            disabled={InvitesRemaining !<= 0}
          >
            Create Invite
          </button>
        </div>
      </div>
      <div className="my-4 mx-2">
        {InvitesRemaining
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
    </div>
  );
};
export default Invite;
