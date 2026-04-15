import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Terms of Use');

export default function TermsOfUseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
