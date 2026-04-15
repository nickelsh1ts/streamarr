import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Cookie Policy');

export default function CookieLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
