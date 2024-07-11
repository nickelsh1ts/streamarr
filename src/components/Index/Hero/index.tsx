import ImageFader from '@app/components/Common/ImageFader';
// import axios from 'axios';
// import { useEffect } from 'react';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: 'smooth' });
};

export default function Hero({ forRef }) {
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
      url: "/7cqKGQMnNabzOpi7qaIgZvQ7NGV.jpg",
      i: '76479',
    },
    {
      url: "/rrwt0u1rW685u9bJ9ougg5HJEHC.jpg",
      i: "280180",
    },
    {
      url: "/ybn3jCia5XBD0ZgEM07gcUPuRNh.jpg",
      i: "508883",
    },
    {
      url: "/fDmci71SMkfZM8RnCuXJVDPaSdE.jpg",
      i: '519182',
    },
    {
      url: "/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg",
      i: 762441,
    },
    {
      url: "/nxxCPRGTzxUH8SFMrIsvMmdxHti.jpg",
      i: 639720,
    },
    {
      url: "/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
      i: 85937,
    },
    {
      url: "/5Aks5cCqHG8xFLoUSLsfGdVfIC.jpg",
      i: 1086747,
    },
    {
      url: "/kwronSXO1ogMqHHFvY2eBxfFLdn.jpg",
      i: 114479,
    },
    {
      url: "/jvPMJ2zM92jfXxVEFsqP1MMrLaO.jpg",
      i: 823464,
    },
    {
      url: "/dvBCdCohwWbsP5qAaglOXagDMtk.jpg",
      i: 533535,
    },
    {
      url: "/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg",
      i: 37854,
    },
    {
      url: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
      i: 693134,
    },
    {
      url: "/5fWxvjOUvtUoSmiMEpFl77V6KZV.jpg",
      i: 196322,
    }
  ];

  // const options = {
  //   method: 'GET',
  //   url: 'https://api.themoviedb.org/3/trending/all/week?language=en-US',
  //   headers: {
  //     accept: 'application/json',
  //     Authorization: '',
  //   },
  // };

  // useEffect(() => {
  //   axios.request(options).then((res) => {
  //     console.log(res);
  //     const data = res.data.results.map((x) => ({
  //       url: x.backdrop_path,
  //       i: x.id,
  //     }));
  //     ImageArray.push(data);
  //   });
  // });

  console.log(ImageArray);
  return (
    <section id="promo" className="min-h-lvh -mt-20" ref={forRef}>
      <ImageFader
        rotationSpeed={6000}
        backgroundImages={
          ImageArray?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
          ) ?? []
        }
      />
      <div className="grid grid-flow-row min-h-lvh md:ps-12 md:text-start text-center relative">
        <div className="md:ps-4 mt-auto pt-24">
          <img
            src="/logo_full.png"
            alt="logo"
            className="mb-10 mt-5 h-auto w-82 mx-auto md:mx-0 px-5 md:px-0"
          />
          <h1 className="text-xl md:text-3xl font-extrabold mb-2">
            Unlimited movies and TV shows
          </h1>
          <p className="text-sm md:text-base tracking-wide mb-12">
            Watch anywhere, anytime for free. The future is now.
          </p>
          <form action="" className="w-fit mx-auto md:mx-0" method="post">
            <div className="label">
              <label
                htmlFor="icode"
                className="label-text mb-2 text-sm md:text-base"
              >
                Currently by invite only. Enter an invite code to join us!
              </label>
            </div>
            <div className="flex items-end mb-3">
              <div className="flex place-items-center w-full max-w-md mb-3">
                <div className="relative w-full me-0 max-w-48">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-7 md:size-9"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                      />
                    </svg>
                  </div>
                  <input
                    id="icode"
                    className="input text-xl rounded-none rounded-l-lg w-full pl-12 md:pl-14 p-2.5 uppercase border-warning focus:border-warning focus:outline-warning/30"
                    name="icode"
                    aria-label="Invite Code"
                    placeholder="Invite code"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-warning rounded-none rounded-r-lg"
                >
                  <span className="text-lg text-center rounded-lg cursor-pointe font-bold">
                    Let&apos;s Get Started!
                  </span>
                </button>
              </div>
            </div>
          </form>
          <div className="p-0 mt-3 md:mt-7 mb-3">
            <span className="font-bold">Movies: </span>613{' '}
            <span className="text-accent">&#124;</span>
          </div>
        </div>
        <div className="md:ps-3 mt-auto mb-20 mx-auto md:mx-0">
          <button className="" onClick={() => scrollToSection('requesting')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3.5}
              stroke="currentColor"
              className="size-9 fa-bounce"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
