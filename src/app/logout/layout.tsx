import type { Metadata } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME;

const messages = {
  title: 'Logging out...',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

export default function logoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}
