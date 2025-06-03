import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminMusic = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'music'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN}
        basePath={'/admin/lidarr'}
        newBase={'/admin/music'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMusic;
