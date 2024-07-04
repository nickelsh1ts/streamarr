import Progress from '@app/components/Layout/ProgressBar';
import PullToRefresh from '@app/components/Layout/PullToRefresh';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <PullToRefresh />
      <Progress />
      {children}
    </>
  );
};

export default Layout;
