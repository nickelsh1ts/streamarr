'use client';
import type React from 'react';
import { useState } from 'react';
import ImageFader from '@app/components/Common/ImageFader';
import { ComputerDesktopIcon, TvIcon } from '@heroicons/react/24/outline';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import useSWR from 'swr';
import useSettings from '@app/hooks/useSettings';

interface imageArrayProps {
  src: string;
  alt: string;
}

interface TabProps {
  link: string;
  icon: React.ReactNode;
  heading: React.ReactNode;
  paragraph: React.ReactNode;
  imageArray?: imageArrayProps[];
}

const DeviceTabs = () => {
  const [activeTab, setActive] = useState('tab-0');
  const { currentSettings } = useSettings();

  const tabs: TabProps[] = [
    {
      link: 'Streaming Media Players',
      icon: (
        <svg
          className="w-7 h-7 text-primary group-hover:text-secondary"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 14.4856 19.9937 16.7342 18.364 18.364C17.9734 18.7545 17.9734 19.3876 18.364 19.7782C18.7545 20.1687 19.3876 20.1687 19.7782 19.7782C21.7677 17.7887 23 15.0373 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 15.0373 2.23231 17.7887 4.22183 19.7782C4.61235 20.1687 5.24551 20.1687 5.63604 19.7782C6.02656 19.3876 6.02656 18.7545 5.63604 18.364C4.00626 16.7342 3 14.4856 3 12ZM7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 13.381 16.4415 14.6296 15.5355 15.5355C15.145 15.9261 15.145 16.5592 15.5355 16.9497C15.9261 17.3403 16.5592 17.3403 16.9497 16.9497C18.2154 15.6841 19 13.9327 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 13.9327 5.7846 15.6841 7.05025 16.9497C7.44078 17.3403 8.07394 17.3403 8.46447 16.9497C8.85499 16.5592 8.85499 15.9261 8.46447 15.5355C7.55855 14.6296 7 13.381 7 12ZM14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5C13.3807 9.5 14.5 10.6193 14.5 12ZM9.67319 17.494C9.57955 16.1455 10.6482 15 12 15C13.3518 15 14.4205 16.1455 14.3268 17.494L14.0049 22.1295C13.9317 23.1829 13.0559 24 12 24C10.9441 24 10.0683 23.1829 9.9951 22.1295L9.67319 17.494Z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      heading: 'PLUG AND PLAY',
      paragraph: (
        <>
          The newest generation of media players and streaming sticks offer a
          fast, easy, and affordable way to watch
          <span className="text-primary">
            {' '}
            {currentSettings.applicationTitle}
          </span>{' '}
          on your TV with the Ple<span className="link-accent">x</span>&trade;
          app.
        </>
      ),
      imageArray: [
        { src: '/img/Apple_TV_Logo.png', alt: 'Apple TV' },
        { src: '/img/Chromecast_Logo.png', alt: 'Chromecast' },
        { src: '/img/Amazon_Fire_TV_Logo.png', alt: 'FireTV' },
        { src: '/img/Roku_TV_Logo.png', alt: 'Roku TV' },
        { src: '/img/Android_TV_Logo.png', alt: 'Android' },
      ],
    },
    {
      link: 'Smart TVs',
      icon: (
        <TvIcon className="w-7 h-7 text-primary group-hover:text-secondary" />
      ),
      heading: 'BUILT-IN APP CONNECTION',
      paragraph: (
        <>
          Enjoy Ple<span className="text-accent">x</span>&apos;s&trade; gorgeous
          interface on your big screen with the Ple
          <span className="text-accent">x</span> Smart TV app, available in most
          smart TV app stores, and access
          <span className="tet-primary">
            {' '}
            {currentSettings.applicationTitle}
          </span>{' '}
          directly on-screen.
        </>
      ),
      imageArray: [
        { src: '/img/LG-Logo.png', alt: 'LG' },
        { src: '/img/Samsung-Logo.png', alt: 'Samsung' },
        { src: '/img/vidaa-logo.jpg', alt: 'Vidaa' },
        { src: '/img/Vizio-logo.png', alt: 'Vizio' },
        { src: '/img/Toshiba-logo.png', alt: 'Toshiba' },
      ],
    },
    {
      link: 'Game Consoles',
      icon: (
        <svg
          className="w-7 h-7 text-primary group-hover:text-secondary"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 245.037 245.037"
        >
          <path
            fill="currentColor"
            d="M185.037,62.519H60c-33.137,0-60,26.862-60,60s26.863,60,60,60h125.037c33.137,0,60-26.862,60-60 S218.174,62.519,185.037,62.519z M60.519,128.669H47.67v12.85H35.367v-12.85H22.518v-12.301h12.849v-12.85H47.67v12.85h12.849 V128.669z M174.944,166.519H70.093v-88h104.852V166.519z M222.519,128.669H209.67v12.85h-12.303v-12.85h-12.849v-12.301h12.849 v-12.85h12.303v12.85h12.849V128.669z"
          ></path>
        </svg>
      ),
      heading: (
        <>
          Play games <br />
          Watch Movies
        </>
      ),
      paragraph: (
        <>
          You can also watch{' '}
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          on a variety of game consoles with the Ple
          <span className="link-warning">x</span>&trade; app.
        </>
      ),
      imageArray: [
        { src: '/img/xbox-one_logo.png', alt: 'Xbox One' },
        { src: '/img/xbox-series_logo.png', alt: 'Xbox Series x|s' },
        { src: '/img/ps3_logo.png', alt: 'PS3' },
        { src: '/img/ps4_logo.png', alt: 'PS4' },
        { src: '/img/ps5_logo.png', alt: 'PS5' },
        { src: '/img/nvidia-shield_logo.png', alt: 'Nvidia Shield' },
      ],
    },
    {
      link: 'Smart Phones & Tablets',
      icon: (
        <DevicePhoneMobileIcon className="w-7 h-7 text-primary group-hover:text-secondary" />
      ),
      heading: (
        <>
          Take{' '}
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          with you
        </>
      ),
      paragraph: (
        <>
          It’s easy to watch <span className="text-purple">Nickflix</span>TV
          from anywhere. If Ple<span className="link-warning">x</span>&trade;
          isn’t already on your phone or tablet, you can download the free app
          from the Apple App Store, Google Play, or the Windows Phone Store.
          <br />
          <br />
          <span className="text-xs text-neutral">
            *The Ple<span className="link-warning">x</span>&trade; app currently
            only offers free playback via the casting feature. To watch on the
            app directly on your phone a small one-time fee is required. If you
            wish not to pay the fee, you may use the newly mobile optimized{' '}
            <span className="text-primary">
              {process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}
            </span>
            .com app.
          </span>
        </>
      ),
      imageArray: [
        { src: '/img/Android_logo.png', alt: 'Android' },
        { src: '/img/iOS_Logo.png', alt: 'iOS' },
      ],
    },
    {
      link: 'PCs & Laptops',
      icon: (
        <ComputerDesktopIcon className="w-7 h-7 text-primary group-hover:text-secondary" />
      ),
      heading: 'Watch on what you have',
      paragraph: (
        <>
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          is optimized for today&apos;s most popular browsers so you can watch
          on your PC or laptop.
        </>
      ),
    },
  ];

  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <div className="grid">
      <div className="tabs tabs-boxed flex flex-wrap place-content-evenly rounded-none bg-zinc-200 p-0">
        {tabs?.map((tab, i) => {
          return (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                setActive(`tab-${i}`);
              }}
              id={`tab-${i}`}
              role="tab"
              className={`tab group flex flex-col flex-nowrap flex-grow h-fit py-5 text-black !rounded-none ${activeTab === `tab-${i}` ? 'bg-zinc-100 border-x border-zinc-300' : ''} `}
            >
              {tab.icon}
              {tab.link}
            </button>
          );
        })}
      </div>
      <div className="bg-zinc-200 relative min-h-[47.5vh]">
        {backdrops ? (
          <ImageFader
            rotationSpeed={6000}
            gradient="backdrop-blur-xl bg-black/70"
            backgroundImages={
              backdrops?.map(
                (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
              ) ?? []
            }
          />
        ) : (
          <div>
            <div
              className={`absolute-top-shift absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in`}
            >
              <Image
                unoptimized
                className="absolute inset-0 h-full w-full"
                style={{ objectFit: 'cover' }}
                alt=""
                src={'/img/people-cinema-watching.jpg'}
                fill
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-brand-dark via-brand-dark/75 via-65% lg:via-40% to-80% to-brand-dark/0`}
              />
            </div>
          </div>
        )}
        {tabs?.map((tab, i) => {
          return (
            <div
              key={i}
              className={`flex flex-wrap relative max-w-screen-xl mx-auto px-5 text-white ${activeTab === `tab-${i}` ? 'block' : 'hidden'}`}
            >
              <div className="container mx-auto max-w-screen-sm md:max-lg:w-1/2 mt-6 px-4 md:flex-grow">
                <p className="text-2xl leading-6 text-white uppercase border-s-2 border-primary ps-6 py-2">
                  {tab.heading}
                </p>
                <p className="mt-6">{tab.paragraph}</p>
              </div>
              <div className="container max-w-80 mx-auto flex-none max-md:my-5">
                <div className="grid grid-cols-2 w-full gap-0">
                  {tab.imageArray?.map((image, i) => {
                    return (
                      <div
                        key={i}
                        className="border border-neutral bg-zinc-200 w-full h-36 p-4 place-content-center"
                      >
                        <Image
                          className="w-auto h-auto"
                          src={image.src}
                          alt={image.alt}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="container mx-auto text-center py-10 px-5 text-black">
        <span className="text-primary font-extrabold">
          {currentSettings.applicationTitle}
        </span>{' '}
        membership and internet connection required.
      </div>
    </div>
  );
};

export default DeviceTabs;
