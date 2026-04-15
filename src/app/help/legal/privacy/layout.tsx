import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Privacy Statement');

export default function PrivacyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
