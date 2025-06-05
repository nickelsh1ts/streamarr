import UserSettings from '@app/components/UserProfile/UserSettings';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Profile – Settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const ProfileSettingsLayout = ({ children }: { children: React.ReactNode }) => {
  return <UserSettings>{children}</UserSettings>;
};
export default ProfileSettingsLayout;
