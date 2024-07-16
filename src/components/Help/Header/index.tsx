import ImageFader from '@app/components/Common/ImageFader';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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
    <header id="top" className="flex shadow-sm relative">
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
      <div className="container max-w-screen-xl mx-auto my-4 md:mb-0 px-2 xl:px-0">
        <div className="navbar flex-col sm:flex-row gap-4">
          <div className="sm:navbar-start">
            <Link
              href="/"
              className={`hover:brightness-75 transition-opacity duration-500`}
            >
              <img src="/logo_full.png" alt="logo" className="w-64 h-auto" />
            </Link>
          </div>
          <div className="sm:navbar-end">
            <Link
              href="/signin"
              id="signin"
              className="btn btn-sm md:btn-md text-xs btn-primary rounded-md gap-0.5 md:tracking-widest uppercase md:text-lg hover:btn-secondary"
            >
              Sign in{' '}
              <ArrowRightEndOnRectangleIcon className="size-4 md:size-6" />
            </Link>
          </div>
        </div>
        <h2 className="text-center font-extrabold text-3xl my-4">
          Help Centre
        </h2>
      </div>
    </header>
  );
};

export default HelpHeader;
