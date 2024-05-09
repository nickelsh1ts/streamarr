import PullToRefresh from '@app/components/Layout/PullToRefresh';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <PullToRefresh />
      {children}
    </>
  );
};

export default Layout;