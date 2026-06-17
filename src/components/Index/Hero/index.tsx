'use client';
import ImageFader from '@app/components/Common/ImageFader';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import useSettings from '@app/hooks/useSettings';
import { type Library } from '@server/lib/settings';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: 'smooth' });
};

export default function Hero() {
  const intl = useIntl();
  const { currentSettings } = useSettings();
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

  const logoSrc = currentSettings.customLogo || '/logo_full.png';
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section id="promo" className="-mt-20 min-h-lvh">
      <ImageFader
        rotationSpeed={6000}
        backgroundImages={
          backdrops?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
          ) ?? ['/img/people-cinema-watching.jpg']
        }
      />
      <div className="relative grid min-h-lvh grid-flow-row text-center md:ps-12 md:text-start">
        <div className="absolute top-20 right-4">
          <LanguagePicker />
        </div>
        <div className="mt-auto pt-24 md:ps-4">
          <Image
            src={logoSrc}
            alt="logo"
            width={448}
            height={100}
            unoptimized={true}
            className="mx-auto mt-5 mb-10 h-auto w-[448px] px-5 md:mx-0 md:px-0"
          />
          <h1 className="mb-2 text-xl font-extrabold md:text-3xl">
            <FormattedMessage
              id="hero.title"
              defaultMessage="Unlimited movies and TV shows"
            />
          </h1>
          <p className="mb-12 text-sm tracking-wide md:text-base">
            <FormattedMessage
              id="hero.subtitle"
              defaultMessage="Watch anywhere, anytime for free. The future is now."
            />
          </p>
          {currentSettings.enableSignUp && (
            <form
              action=""
              className="mx-auto w-fit md:mx-0"
              method="post"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="label">
                <label
                  htmlFor="icode"
                  className="mb-2 text-center text-sm md:text-start md:text-base"
                >
                  <FormattedMessage
                    id="hero.inviteCode"
                    defaultMessage="Enter your invite code to get started"
                  />
                </label>
              </div>
              {error && (
                <div className="text-error mb-2 text-sm font-semibold md:text-base">
                  {error}
                </div>
              )}
              <div className="mb-6 flex w-full max-w-md flex-col items-end sm:flex-row">
                <label className="input border-warning focus-within:border-warning focus-within:outline-warning/30 w-full rounded-none rounded-t-lg text-xl uppercase sm:max-w-48 sm:rounded-l-lg sm:rounded-tr-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-7 shrink-0 md:size-9"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                    />
                  </svg>
                  <input
                    id="icode"
                    ref={inputRef}
                    name="icode"
                    aria-label="Invite Code"
                    placeholder={intl.formatMessage({
                      id: 'invite.code',
                      defaultMessage: 'Invite Code',
                    })}
                    required
                    onChange={() => setError(null)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-warning w-full rounded-none rounded-b-lg sm:mt-0 sm:ml-0 sm:w-auto sm:rounded-r-lg sm:rounded-bl-none"
                  onClick={() => {
                    const code = inputRef.current?.value.trim();
                    if (code) {
                      setError(null);
                      window.location.href = `/signup?icode=${encodeURIComponent(code)}`;
                    } else {
                      setError(
                        intl.formatMessage({
                          id: 'hero.error.emptyCode',
                          defaultMessage: 'Please enter a valid invite code.',
                        })
                      );
                    }
                  }}
                >
                  <span className="cursor-pointe rounded-lg text-center text-lg font-bold">
                    <FormattedMessage
                      id="hero.getStarted"
                      defaultMessage="Let's Get Started!"
                    />
                  </span>
                </button>
              </div>
            </form>
          )}
          {currentSettings.libraryCounts && (
            <div className="divide-accent mx-4 mt-3 mb-3 flex flex-wrap items-center divide-x-2 max-md:place-content-center md:mx-0 md:mt-7">
              {mediaLibraries ? (
                mediaLibraries.length > 0 && (
                  <>
                    {mediaLibraries.slice(0, 4).map((lib) => (
                      <p
                        className="px-4 first:ps-0 last:pe-0"
                        key={`library-${lib.id}`}
                      >
                        <span className="font-bold">{lib.name} </span>{' '}
                        {lib.mediaCount}
                      </p>
                    ))}
                    {mediaLibraries.length > 4 && (
                      <p className="px-4 font-bold first:ps-0 last:pe-0">
                        <FormattedMessage
                          id="hero.more"
                          defaultMessage="+ more"
                        />
                      </p>
                    )}
                  </>
                )
              ) : (
                <LoadingEllipsis />
              )}
            </div>
          )}
        </div>
        <div className="mx-auto mt-auto mb-20 md:mx-0 md:ps-3">
          {currentSettings.extendedHome && (
            <button className="" onClick={() => scrollToSection('requesting')}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3.5}
                stroke="currentColor"
                className="fa-bounce size-9"
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
