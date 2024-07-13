import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const DownloadOffline = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/download-offline"
        homeElement={'Help Centre'}
        names="Watching Streamarr,How can I watch Streamarr offline?"
      />
      <div>DownloadOffline</div>
    </section>
  );
};

export default DownloadOffline;
