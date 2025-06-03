import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminTranscoding = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'transcoding'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN}
        basePath={'/admin/tdarr'}
        newBase={'/admin/transcode'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminTranscoding;
