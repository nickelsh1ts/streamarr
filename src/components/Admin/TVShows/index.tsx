import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminTVShows = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'tvshows'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN}
        basePath={'/admin/sonarr'}
        newBase={'/admin/tv'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminTVShows;
