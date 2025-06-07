import SignIn from '@app/components/SignIn';
import type { Metadata, NextPage } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr';

const messages = { title: 'Sign In' };

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const SignInPage: NextPage = () => {
  return <SignIn />;
};

export default SignInPage;
