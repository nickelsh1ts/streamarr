import SignIn from '@app/components/SignIn';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Sign In');

const SignInPage: NextPage = () => {
  return <SignIn />;
};

export default SignInPage;
