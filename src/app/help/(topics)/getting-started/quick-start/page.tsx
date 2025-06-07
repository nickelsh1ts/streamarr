import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';

const anchors = [
  { href: '#first', title: 'First step' },
  { href: '#second', title: 'Second Step' },
  { href: '#third', title: 'Third Step' },
  { href: '#last', title: 'Last step' },
];

const HelpContent = () => {
  return (
    <>
      <div className="mt-5 font-extrabold" id="first">
        First things first
      </div>
      <p className="my-4">
        Once you&apos;ve created your Ple<span className="text-accent">x</span>
        &trade; account and registered for{' '}
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </span>{' '}
        you&apos;ll receive an invite email that requires you to accept.
      </p>
      <p className="italic text-sm my-4">
        <span className="text-error font-bold">Important Information</span>:
        Until you accept this invite, your Ple
        <span className="text-accent">x</span>&trade; account will not have
        access to{' '}
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </span>{' '}
        content.
      </p>
      <div className="mt-5 font-extrabold" id="second">
        Next, we can login and start setting up your account
      </div>
      <p className="my-4">
        You&apos;ll notice when signing in for the first time, that the Home
        page currently lists a lot of content available from Ple
        <span className="text-accent">x</span>&trade; and not{' '}
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </span>
        . To change this, you need to log into app.ple
        <span className="text-accent">x</span>
        .tv and &quot;pin&quot;{' '}
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </span>{' '}
        via the menu.
      </p>
      <p className="italic text-sm mt-4">
        <span className="text-info font-bold">Tip</span>: You can also reorder
        the libraries so they appear on the home page in your desired order.
      </p>
      <p className="italic text-sm mb-4">
        Our recommended order is: Movies, TV Shows, Retro: Movies, Retro: TV
        Shows, Retro: Kids Shows, Discover, Watchlist
      </p>
      <div className="mt-5 font-extrabold" id="third">
        And if we only want to see & access{' '}
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </span>{' '}
        content, not Ple<span className="text-accent">x</span>&trade;
      </div>
      <p className="my-4">
        From the Options menu in{' '}
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </span>{' '}
        you can select Online Media Sources and disable Live TV, Movies & TV and
        Music.
      </p>
      <p className="italic text-sm my-4">
        Optionally: you can adjust your Discovery preferences here as well. We
        recommend leaving these as their default though.
      </p>
      <div className="mt-5 font-extrabold" id="last">
        That&apos;s it! Now we can watch and request to our hearts content.
      </div>
      <p className="my-4">
        Browse the library, download the apps, and make requests via Overseerr.
      </p>
      <p className="italic text-sm my-4">
        <span className="text-error font-bold">Remember</span>: You won&apos;t
        be able to invite friends during your 5 day trial period.
      </p>
    </>
  );
};

const QuickStart = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/quick-start"
        homeElement={'Help Centre'}
        names="Getting Started,Quick Start Guide"
      />
      <HelpCard
        heading={'Quick Start Guide'}
        subheading={
          'We know there can be quite a few steps to sign up and it can get quite confusing, so below is a comprehensive guide to get you going asap.'
        }
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default QuickStart;
