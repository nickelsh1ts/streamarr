import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminIndexers = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'indexers'}
        domainURL={'https://streamarr.nickelsh1ts.com'}
        basePath={'/admin/prowlarr'}
        newBase={'/admin/indexers'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminIndexers;
