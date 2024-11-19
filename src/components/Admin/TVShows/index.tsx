import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminTVShows = () => {
  return (
    <div className="relative -m-4">
      <DynamicFrame
        title={'tvshows'}
        domainURL={'https://streamarr.nickelsh1ts.com'}
        basePath={'/admin/sonarr'}
        newBase={'/admin/tv'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminTVShows;
