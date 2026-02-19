import Join from '@app/components/SignUp';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Sign Up');
const SignUpPage: NextPage = () => {
  return <Join />;
};

export default SignUpPage;
