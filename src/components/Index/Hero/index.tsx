'use client';
import ImageFader from '@app/components/Common/ImageFader';
import useSWR from 'swr';
import Image from 'next/image';
import { type Library } from '@server/lib/settings';
import useSettings from '@app/hooks/useSettings';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useRef, useState } from 'react';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: 'smooth' });
};

export default function Hero() {
  const settings = useSettings();
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  const { data: mediaLibraries } = useSWR<Library[]>('/api/v1/libraries', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section id="promo" className="min-h-lvh -mt-20">
      <ImageFader
        rotationSpeed={6000}
        backgroundImages={
          backdrops?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
          ) ?? ['/img/people-cinema-watching.jpg']
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
          {settings.currentSettings.enableSignUp && (
            <form
              action=""
              className="w-fit mx-auto md:mx-0"
              method="post"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="label">
                <label
                  htmlFor="icode"
                  className="label-text mb-2 text-sm md:text-base"
                >
                  Get started by entering your invite code below.
                </label>
              </div>
              {error && (
                <div className="mb-2 text-error font-semibold text-sm md:text-base">
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-end mb-6 w-full max-w-md">
                <div className="relative w-full sm:max-w-48">
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
                    ref={inputRef}
                    className="input text-xl rounded-none rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none w-full pl-12 sm:pl-14 p-2.5 uppercase border-warning focus:border-warning focus:outline-warning/30"
                    name="icode"
                    aria-label="Invite Code"
                    placeholder="Invite code"
                    required
                    onChange={() => setError(null)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-warning rounded-none rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none w-full sm:w-auto sm:mt-0 sm:ml-0"
                  onClick={() => {
                    const code = inputRef.current?.value.trim();
                    if (code) {
                      setError(null);
                      window.location.href = `/signup?icode=${encodeURIComponent(code)}`;
                    } else {
                      setError('A valid invite code is required.');
                    }
                  }}
                >
                  <span className="text-lg text-center rounded-lg cursor-pointe font-bold">
                    Let&apos;s Get Started!
                  </span>
                </button>
              </div>
            </form>
          )}
          <div className="flex flex-wrap space-x-4 items-center max-md:place-content-center mx-4 md:mx-0 mt-3 md:mt-7 mb-3 divide-x-2 divide-accent">
            {mediaLibraries ? (
              mediaLibraries.length > 0 &&
              (() => {
                // Separate and sort movies and shows by id
                const movies = mediaLibraries
                  .filter((lib) => lib.type === 'movie')
                  .sort((a, b) => a.id.localeCompare(b.id));
                const shows = mediaLibraries
                  .filter((lib) => lib.type === 'show')
                  .sort((a, b) => a.id.localeCompare(b.id));
                // Alternate them
                const alternated: typeof mediaLibraries = [];
                let i = 0,
                  j = 0;
                while (
                  alternated.length < 4 &&
                  (i < movies.length || j < shows.length)
                ) {
                  if (i < movies.length) alternated.push(movies[i++]);
                  if (alternated.length < 4 && j < shows.length)
                    alternated.push(shows[j++]);
                }
                return (
                  <>
                    {alternated.map((lib) => (
                      <p className="first:pl-0 pl-4" key={`library-${lib.id}`}>
                        <span className="font-bold">{lib.name} </span>{' '}
                        {lib.mediaCount}
                      </p>
                    ))}
                    {mediaLibraries.length > 4 && (
                      <p className="first:pl-0 pl-4 font-bold">+ more</p>
                    )}
                  </>
                );
              })()
            ) : (
              <LoadingEllipsis />
            )}
          </div>
        </div>
        <div className="md:ps-3 mt-auto mb-20 mx-auto md:mx-0">
          {settings.currentSettings.extendedHome && (
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
          )}
        </div>
      </div>
    </section>
  );
}
