'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import {
  StarIcon,
  ClockIcon,
  BellIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="font-extrabold" id="requesting">
        Requesting new media
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li className="">
          Sign in to {currentSettings.applicationTitle} and select
        </li>
        <li>Search for any movie or show or locate via discovery</li>
        <li>Open the media discovery page by selecting it</li>
        <li>
          Select the &quot;Request&quot; option and if relevant select which
          season(s)
        </li>
        <li>
          Once your request has been approved by a moderator, it will begin
          downloading
        </li>
      </ul>
      <p className="italic text-sm my-4" id="importantinfo">
        Important Information
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          Each individual request is processed the moment it&apos;s approved, or
          in the event it&apos;s auto-approved, immediately.
        </li>
        <li>
          The time in which it takes to become available on{' '}
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          can depend on many factors such as the release date (older media can
          be more difficult to find), the popularity, and the quality.
        </li>
        <li>
          Keep an eye on <span className="text-primary">Overseerr</span>, or
          watch for the Media Available notification.
        </li>
        <li>
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          currently supports 3 types of notifications, all of which can be
          enabled or disabled via your{' '}
          <span className="text-primary">Overseerr</span> Profile Settings.{' '}
          <i>(Push Notifications, Email, and/or Discord)</i>
        </li>
        <li>
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          currently allows for a maximum of{' '}
          <span className="text-info font-extrabold underline">5</span> Movie
          requests per day and a maximum of{' '}
          <span className="text-info font-extrabold underline">2</span> Season
          requests every 2 days, per member. This can be either two seasons of
          one show, or one season from two different shows{' '}
          <i>(Requesting two seasons in one day will leave you with </i>
          <span className="text-info font-extrabold underline">0</span>
          <i> requests for two days).</i>
        </li>
      </ul>
    </>
  );
};

const anchors = [
  { href: '#requesting', title: 'Requesting' },
  { href: '#importantinfo', title: 'Important Info' },
];

const Heading = () => {
  return (
    <span className="flex flex-wrap place-items-center border-b-2 gap-x-2 border-zinc-500 pb-4">
      Request new media with
      <Image
        className="h-auto w-44"
        src="/external/os-logo_full_dark.svg"
        alt="overseerr"
      />
    </span>
  );
};

const Benefits = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black bg-primary h-fit">
          <StarIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">
            The best way to discover media
          </p>
          <p>
            Overseerr helps you find media you want to watch. With inline
            recommendations and suggestions, you will find yourself deeper and
            deeper in a rabbit hole of content you never knew you just had to
            have.
          </p>
        </div>
      </div>
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black  bg-primary h-fit">
          <ClockIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">
            Requesting has never been so easy
          </p>
          <p>
            Overseerr presents you with a request interface that is incredibly
            easy to understand and use. You can select the exact seasons you
            want to watch.
          </p>
        </div>
      </div>
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black  bg-primary h-fit">
          <BellIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">Notifications</p>
          <p>
            Several notification agents are directly supported, including email,
            Discord and web push.
          </p>
        </div>
      </div>
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black  bg-primary h-fit">
          <DevicePhoneMobileIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">Mobile-Friendly Experience</p>
          <p>
            Use Overseerr as a near-native mobile app by adding it to your home
            screen. Overseerr is designed for use on any screen size.
          </p>
        </div>
      </div>
    </div>
  );
};

const Requesting = () => {
  const { currentSettings } = useSettings();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/requesting"
        homeElement={'Help Centre'}
        names={`Watching ${currentSettings.applicationTitle},Request new media with Overseerr`}
      />
      <HelpCard
        heading={<Heading />}
        subheading={<Benefits />}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default Requesting;
