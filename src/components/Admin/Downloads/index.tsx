import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminDownloads = () => {
  return (
    <div className="relative -m-4">
      <DynamicFrame
        title={'downloads'}
        domainURL={'https://streamarr.nickelsh1ts.com'}
        basePath={'/admin/flood/overview'}
        newBase={'/admin/downloads/overview'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminDownloads;
