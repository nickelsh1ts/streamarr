import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const DownloadStreamarr = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/download-streamarr"
        homeElement={'Help Centre'}
        names="Getting Started,How to download the Streamarr app"
      />
      <div>DownloadStreamarr</div>
    </section>
  );
};

export default DownloadStreamarr;
