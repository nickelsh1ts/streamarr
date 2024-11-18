import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminMovies = () => {
  return (
    <div className="relative -m-4">
      <DynamicFrame
        title={'movies'}
        domainURL={'https://streamarr.nickelsh1ts.com'}
        basePath={'/admin/radarr'}
        newBase={'/admin/movies'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMovies;
