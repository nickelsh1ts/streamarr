import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TopicsPage from '@app/components/Help/TopicsPage';

const RelatedArticles = [{
  href: 'watching-streamarr/devices',
  text: 'Supported devices for watching Streamarr'
},{
  href: 'watching-streamarr/requesting',
  text: 'Requesting new media via Overseerr'
},{
  href: 'watching-streamarr/watch-on-tv',
  text: 'Watching Streamarr on your TV'
},{
  href: 'watching-streamarr/download-offline',
  text: 'Downloading media to watch offline'
},{
  href: 'watching-streamarr/reporting-issues',
  text: 'Reporting an issue with Streamarr content'
}]

const WatchingStreamarr = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr"
        homeElement={'Help Centre'}
        names="Watching Streamarr"
      />
      <TopicsPage
        heading={'Topics related to watching Streamarr and making Requests'}
        subheading={
          'If you have questions or are unsure of how to use Streamarr or make new requests, you can read through these topics.'
        }
        links={RelatedArticles}
      />
    </section>
  );
};

export default WatchingStreamarr;
