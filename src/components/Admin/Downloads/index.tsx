import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminDownloads = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'downloads'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN}
        basePath={'/admin/qbt'}
        newBase={'/admin/downloads'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminDownloads;
