import InvitesList from '@app/components/Invite/InvitesList';

const UsersInvitesPage = () => {
  return (
    <div className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
      <h3 className="text-2xl font-extrabold">Invites</h3>
      <span className="text-sm text-neutral-300">Nickelsh1ts</span>
      <InvitesList />
    </div>
  );
};
export default UsersInvitesPage;
