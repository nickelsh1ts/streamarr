import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminTranscoding = () => {
  return (
    <div className="relative -m-4">
      <DynamicFrame
        title={'transcoding'}
        domainURL={'https://streamarr.nickelsh1ts.com'}
        basePath={'/admin/tdarr'}
        newBase={'/admin/transcode'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminTranscoding;
