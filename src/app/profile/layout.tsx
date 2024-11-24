import ProfileLayout from '@app/components/UserProfile/ProfileLayout';

const ProfilePageLayout = ({ children }: { children: React.ReactNode }) => {
  return <ProfileLayout>{children}</ProfileLayout>;
};
export default ProfilePageLayout;
