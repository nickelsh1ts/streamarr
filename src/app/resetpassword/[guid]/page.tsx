import ResetPassword from '@app/components/ResetPassword';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Reset Password');

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ guid: string }>;
}) {
  const { guid } = await params;
  return <ResetPassword guid={guid} />;
}
