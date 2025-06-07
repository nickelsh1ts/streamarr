import Join from '@app/components/SignUp';
import type { Metadata, NextPage } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr';

const messages = { title: 'Sign Up' };

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const SignUpPage: NextPage = () => {
  return <Join />;
};

export default SignUpPage;
