import Badge from '@app/components/Common/Badge';
import moment from 'moment';
import Link from 'next/link';
import Image from 'next/image';

interface InvitesType {
  icode: string;
  expiry?: Date | null;
  created: Date;
  redeemed?: boolean;
  uses?: number | null;
  status: 'active' | 'expired' | 'redeemed' | 'inactive';
  downloads?: boolean;
}

const Invites: InvitesType[] = [
  {
    icode: 'strmrr',
    expiry: moment().add(7, 'hours').toDate(),
    created: moment().subtract(2, 'd').toDate(),
    redeemed: false,
    uses: 4,
    status: 'active',
  },
  {
    icode: 'scndo',
    expiry: moment().add(1, 'y').toDate(),
    created: moment().subtract(1, 'y').toDate(),
    redeemed: true,
    uses: 0,
    status: 'redeemed',
  },
  {
    icode: 'nikflx',
    expiry: null,
    created: moment().subtract(5, 'h').toDate(),
    redeemed: true,
    uses: null,
    status: 'active',
  },
  {
    icode: 'exprd',
    expiry: moment().subtract(5, 'h').toDate(),
    created: moment().subtract(1, 'M').toDate(),
    redeemed: false,
    uses: 0,
    status: 'expired',
  },
];

const InviteCard = ({ invite }: { invite: InvitesType }) => {
  return (
    <li key={invite.icode} className="mb-2">
      <div className="flex w-full flex-col justify-between xl:flex-row border border-primary bg-base-100 p-4 rounded-xl overflow-hidden">
        <div className="flex flex-col justify-between items-center space-x-0 md:space-x-3 sm:flex-row w-full">
          <div className="flex w-full items-center overflow-hidden">
            <div className="aspect-square p-4 h-full rounded flex items-center justify-center bg-primary/60">
              {!invite.redeemed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-7"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                  <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-7"
                >
                  <path d="M19.5 22.5a3 3 0 0 0 3-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 1 1-.712 1.321l-5.683-3.06a1.5 1.5 0 0 0-1.422 0l-5.683 3.06a.75.75 0 0 1-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 0 0 3 3h15Z" />
                  <path d="M1.5 9.589v-.745a3 3 0 0 1 1.578-2.642l7.5-4.038a3 3 0 0 1 2.844 0l7.5 4.038A3 3 0 0 1 22.5 8.844v.745l-8.426 4.926-.652-.351a3 3 0 0 0-2.844 0l-.652.351L1.5 9.589Z" />
                </svg>
              )}
            </div>
            <div className="flex flex-col justify-center overflow-hidden pl-2 lg:pl-4">
              <div className="flex flex-col items-start justify-between w-full overflow-hidden truncate">
                <button className="font-bold text-lg uppercase">
                  {invite.icode} {invite.uses ? `(${invite.uses})` : ''}
                  {invite.uses === null && `(∞)`}
                </button>{' '}
                <p className="text-xs truncate w-full text-warning">
                  {!invite.redeemed || invite.uses === null || invite.uses > 0
                    ? `${
                        invite.expiry != null
                          ? `${invite.expiry > moment().toDate() ? 'Expires ' : 'Expired '} ${moment(invite.expiry).fromNow()}`
                          : 'Never expires'
                      }`
                    : 'Invite redeemed'}
                </p>
                <p className="text-xs truncate w-full ">Downloads allowed</p>
              </div>
            </div>
          </div>
          <div className="mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:pr-0">
            <div className="py-1 flex items-center truncate leading-5">
              <span className="font-extrabold mr-2">Status</span>
              <Badge
                className="capitalize"
                badgeType={
                  invite.status === 'active'
                    ? 'success'
                    : invite.status === 'expired'
                      ? 'error'
                      : invite.status === 'redeemed'
                        ? 'primary'
                        : 'warning'
                }
              >
                {invite.status}
              </Badge>
            </div>
            <div className="flex overflow-hidden items-center py-1 truncate whitespace-nowrap leading-5">
              <span className="font-extrabold mr-2">Created</span>
              {moment(invite.created).fromNow()} by{' '}
              <Link
                className="link-hover font-extrabold flex items-center truncate"
                href={'/admin/users/1'}
              >
                <Image
                  src={'/android-chrome-192x192.png'}
                  alt=""
                  className="size-5 mr-1 ml-1.5 object-cover"
                  width={20}
                  height={20}
                />
                <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                  Nickelsh1ts
                </span>
              </Link>
            </div>
            <div className="flex items-center py-1 truncate whitespace-nowrap leading-5">
              <span className="font-extrabold mr-2">Modified</span>
              {moment(invite.created).fromNow()} by{' '}
              <Link
                className="link-hover font-extrabold flex items-center truncate"
                href={'/admin/users/1'}
              >
                <Image
                  src={'/android-chrome-192x192.png'}
                  alt=""
                  className="size-5 mr-1 ml-1.5 object-cover"
                  width={20}
                  height={20}
                />
                <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                  Nickelsh1ts
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-4 xl:mt-0 xl:w-1/3 xl:max-w-xs">
          {(!invite.redeemed || invite.uses === null) && (
            <div className="w-full flex flex-col gap-2">
              {(invite.expiry >= moment().toDate() ||
                invite.expiry === null) && (
                <button className="btn btn-sm btn-block btn-neutral rounded-md flex-1">
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
                  </svg>{' '}
                  Share Invite
                </button>
              )}
              <button className="btn btn-sm btn-block btn-neutral rounded-md flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                  <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                </svg>{' '}
                Edit Invite
              </button>
              <button className="btn btn-sm btn-block btn-error rounded-md flex-1">
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
                </svg>{' '}
                Delete Invite
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

const InvitesList = () => {
  return (
    <div className="mt-4 w-full">
      <ul id="invitesList">
        {Invites?.sort((a, b) => b.created.valueOf() - a.created.valueOf()).map(
          (invite, i) => {
            return <InviteCard key={`invite-list-item-${i}`} invite={invite} />;
          }
        )}
      </ul>
    </div>
  );
};
export default InvitesList;
