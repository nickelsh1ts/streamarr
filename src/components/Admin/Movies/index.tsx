import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminMovies = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'movies'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN}
        basePath={'/admin/radarr'}
        newBase={'/admin/movies'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMovies;
