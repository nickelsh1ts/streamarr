import DynamicFrame from '@app/components/Common/DynamicFrame';

const AdminSubtitles = () => {
  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'subtitles'}
        domainURL={'https://streamarr.nickelsh1ts.com'}
        basePath={'/admin/bazarr'}
        newBase={'/admin/srt'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminSubtitles;
