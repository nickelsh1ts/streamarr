import ProfileLayout from '@app/components/UserProfile/ProfileLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Profile - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const ProfilePageLayout = ({ children }: { children: React.ReactNode }) => {
  return <ProfileLayout>{children}</ProfileLayout>;
};
export default ProfilePageLayout;
