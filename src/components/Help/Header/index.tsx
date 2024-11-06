import ImageFader from '@app/components/Common/ImageFader';
import Header from '@app/components/Layout/Header';

const HelpHeader = () => {
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
    <>
      <Header />
      <div id="top" className="flex shadow-sm relative">
        <div className="-z-10">
          <ImageFader
            rotationSpeed={6000}
            backgroundImages={
              ImageArray?.map(
                (backdrop) =>
                  `https://image.tmdb.org/t/p/original${backdrop.url}`
              ) ?? []
            }
            gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
          />
        </div>
        <div className="container max-w-screen-xl mx-auto h-44 content-center">
          <h2 className="text-center font-extrabold text-3xl my-4">
            Help Centre
          </h2>
        </div>
      </div>
    </>
  );
};

export default HelpHeader;
