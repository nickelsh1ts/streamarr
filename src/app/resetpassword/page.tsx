import RequestResetLink from '@app/components/ResetPassword/RequestResetLink';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Reset Password');

const RequestResetLinkPage: NextPage = () => {
  return <RequestResetLink />;
};

export default RequestResetLinkPage;
