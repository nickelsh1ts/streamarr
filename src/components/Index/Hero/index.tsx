'use client';
import ImageFader from '@app/components/Common/ImageFader';
import useSWR from 'swr';
import Image from 'next/image';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: 'smooth' });
};

//TODO integrate tautulli stats into hero section for live data

//TODO add invite code functionality to hero section

export default function Hero() {
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <section id="promo" className="min-h-lvh -mt-20">
      <ImageFader
        rotationSpeed={6000}
        backgroundImages={
          backdrops?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
          ) ?? []
        }
      />
      <div className="grid grid-flow-row min-h-lvh md:ps-12 md:text-start text-center relative">
        <div className="md:ps-4 mt-auto pt-24">
          <Image
            src={`${process.env.NEXT_PUBLIC_LOGO ? process.env.NEXT_PUBLIC_LOGO : '/logo_full.png'}`}
            alt="logo"
            width={448}
            height={100}
            className="mb-10 mt-5 h-auto w-[448px] mx-auto md:mx-0 px-5 md:px-0"
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
                Invites are currently disabled. Please try again later.
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
                    disabled
                  />
                </div>
                <button
                  type="submit"
                  disabled
                  className="btn btn-warning rounded-none rounded-r-lg"
                >
                  <span className="text-lg text-center rounded-lg cursor-pointe font-bold">
                    Let&apos;s Get Started!
                  </span>
                </button>
              </div>
            </div>
          </form>
          <div className="flex flex-wrap space-x-4 items-center max-md:place-content-center mx-4 md:mx-0 mt-3 md:mt-7 mb-3 divide-x-2 divide-accent">
            <p className="first:pl-0 pl-4">
              <span className="font-bold">Movies: </span> 805
            </p>
            <p className="first:pl-0 pl-4">
              <span className="font-bold">TV Shows: </span> 213
            </p>
            <p className="first:pl-0 pl-4">
              <span className="font-bold">Retro Movies: </span> 184
            </p>
            <p className="first:pl-0 pl-4">
              <span className="font-bold">Retro TV Shows: </span> 130
            </p>
            <p className="first:pl-0 pl-4 font-bold">+ more</p>
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
