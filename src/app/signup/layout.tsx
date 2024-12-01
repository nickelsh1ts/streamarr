export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section className="h-[calc(100dvh-4rem)]">{children}</section>;
}
