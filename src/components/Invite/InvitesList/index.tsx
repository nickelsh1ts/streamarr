import moment from 'moment';

interface InvitesType {
  icode: string;
  expiry?: Date | null;
  created: Date;
  redeemed?: boolean;
  uses?: number | null;
}

const Invites: InvitesType[] = [
  {
    icode: 'strmrr',
    expiry: moment().add(7, 'hours').toDate(),
    created: moment().subtract(2, 'd').toDate(),
    redeemed: false,
    uses: 4,
  },
  {
    icode: 'scndo',
    expiry: moment().add(1, 'y').toDate(),
    created: moment().subtract(1, 'y').toDate(),
    redeemed: true,
    uses: 0,
  },
  {
    icode: 'nikflx',
    expiry: null,
    created: moment().subtract(5, 'h').toDate(),
    redeemed: true,
    uses: null,
  },
  {
    icode: 'exprd',
    expiry: moment().subtract(5, 'h').toDate(),
    created: moment().subtract(1, 'M').toDate(),
    redeemed: false,
    uses: 0,
  },
];

const InvitesList = () => {
  return (
    <div className="mt-4 px-2 w-full max-w-screen-xl m-auto">
      <ul className="" id="invitesList">
        {Invites?.sort((a, b) => b.created.valueOf() - a.created.valueOf()).map(
          (invite) => {
            return (
              <li key={invite.icode} className="mb-2">
                <div className="flex flex-row border border-primary bg-base-100 p-4 rounded overflow-hidden">
                  <div className="flex flex-grow items-center justify-start space-x-0 md:space-x-3 w-2/3">
                    <div className="aspect-square h-full rounded hidden md:flex items-center justify-center bg-primary/60">
                      {!invite.redeemed ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-6"
                        >
                          <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                          <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-6"
                        >
                          <path d="M19.5 22.5a3 3 0 0 0 3-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 1 1-.712 1.321l-5.683-3.06a1.5 1.5 0 0 0-1.422 0l-5.683 3.06a.75.75 0 0 1-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 0 0 3 3h15Z" />
                          <path d="M1.5 9.589v-.745a3 3 0 0 1 1.578-2.642l7.5-4.038a3 3 0 0 1 2.844 0l7.5 4.038A3 3 0 0 1 22.5 8.844v.745l-8.426 4.926-.652-.351a3 3 0 0 0-2.844 0l-.652.351L1.5 9.589Z" />
                        </svg>
                      )}
                    </div>
                    <div className="font-bold flex flex-col items-start justify-between w-full overflow-hidden truncate">
                      <div className="font-bold flex flex-col items-start justify-between w-full overflow-hidden truncate">
                        <button className="text-lg uppercase">
                          {invite.icode} {invite.uses ? `(${invite.uses})` : ''}
                          {invite.uses === null && `(∞)`}
                        </button>{' '}
                        <p className="text-xs truncate w-full text-warning">
                          {!invite.redeemed ||
                          invite.uses === null ||
                          invite.uses > 0
                            ? `${
                                invite.expiry != null
                                  ? `${invite.expiry > moment().toDate() ? 'Expires ' : 'Expired '} ${moment(invite.expiry).fromNow()}`
                                  : 'Never expires'
                              }`
                            : 'Invite redeemed'}
                        </p>
                        <p className="text-xs truncate text-neutral w-full">
                          Created: {moment(invite.created).fromNow()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row space-x-3 justify-end items-center w-1/2">
                    {(!invite.redeemed || invite.uses === null) && (
                      <div className="flex flex-row space-x-2 items-center">
                        {(invite.expiry >= moment().toDate() ||
                          invite.expiry === null) && (
                          <button className="btn btn-square btn-sm btn-neutral rounded-md">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                        <button className="btn btn-square btn-sm btn-neutral rounded-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-5"
                          >
                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                          </svg>
                        </button>
                        <button className="btn btn-square btn-sm btn-error rounded-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
};
export default InvitesList;
