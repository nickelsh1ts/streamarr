import ProfileLayout from '@app/components/UserProfile/ProfileLayout';

const UsersPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <ProfileLayout>{children}</ProfileLayout>
    </>
  );
};
export default UsersPageLayout;
