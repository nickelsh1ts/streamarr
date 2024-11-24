import ProfileLayout from '@app/components/UserProfile/ProfileLayout';

const ProfilePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-sm:mb-14">
      <ProfileLayout>{children}</ProfileLayout>
    </div>
  );
};
export default ProfilePageLayout;
