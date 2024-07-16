import ImageFader from '@app/components/Common/ImageFader';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import DeviceTabs from '@app/components/Help/Devices';

const Devices = () => {
  const ImageArray = [
    {
      url: '/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg',
      i: '1223',
    },
    {
      url: '/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg',
      i: '94997',
    },
    {
      url: '/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
      i: '32445',
    },
    {
      url: '/7cqKGQMnNabzOpi7qaIgZvQ7NGV.jpg',
      i: '76479',
    },
    {
      url: '/rrwt0u1rW685u9bJ9ougg5HJEHC.jpg',
      i: '280180',
    },
    {
      url: '/ybn3jCia5XBD0ZgEM07gcUPuRNh.jpg',
      i: '508883',
    },
    {
      url: '/fDmci71SMkfZM8RnCuXJVDPaSdE.jpg',
      i: '519182',
    },
    {
      url: '/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg',
      i: 762441,
    },
    {
      url: '/nxxCPRGTzxUH8SFMrIsvMmdxHti.jpg',
      i: 639720,
    },
    {
      url: '/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
      i: 85937,
    },
    {
      url: '/5Aks5cCqHG8xFLoUSLsfGdVfIC.jpg',
      i: 1086747,
    },
    {
      url: '/kwronSXO1ogMqHHFvY2eBxfFLdn.jpg',
      i: 114479,
    },
    {
      url: '/jvPMJ2zM92jfXxVEFsqP1MMrLaO.jpg',
      i: 823464,
    },
    {
      url: '/dvBCdCohwWbsP5qAaglOXagDMtk.jpg',
      i: 533535,
    },
    {
      url: '/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg',
      i: 37854,
    },
    {
      url: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
      i: 693134,
    },
    {
      url: '/5fWxvjOUvtUoSmiMEpFl77V6KZV.jpg',
      i: 196322,
    },
  ];

  return (
    <section className="text-neutral bg-zinc-100 pt-5">
      <Breadcrumbs
        paths="/watching-streamarr/devices"
        homeElement={'Help Centre'}
        names="Watching Streamarr,Connect to Streamarr using your favourite devices"
        print={false}
      />
      <div className='relative mt-4'>
        <div className="-z-10">
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            ImageArray?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
            ) ?? []
          }
          gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
        />
        </div>
        <div className="container max-w-screen-lg mx-auto py-14 relative">
						<p className="text-3xl mx-7 md:text-5xl  md:mx-14 font-extrabold text-center text-white">Connect to <span className="text-primary">Streamarr</span> using your favourite devices.</p>
					</div>
      </div>
      <DeviceTabs />
    </section>
  );
};

export default Devices;
