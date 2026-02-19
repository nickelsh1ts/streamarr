import OnboardingSettings from '@app/components/Admin/Settings/Onboarding';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Onboarding Settings');

const OnboardingPage = () => {
  return <OnboardingSettings />;
};

export default OnboardingPage;
