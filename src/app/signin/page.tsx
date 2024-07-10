import SignIn from '@app/components/SignIn';
import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Sign In',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const SignInPage: NextPage = () => {
  return (<SignIn />)
};

export default SignInPage;
