import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Help Centre',
};

const HelpContent = () => {
  return (
    <>
      <div className="">
        <p className="mb-4">
          <span className="text-primary font-bold">Streamarr</span> is a free
          private members only streaming service build on top of an ecosystem of
          free and open source applications such as Sonarr, Radarr, Overserr,
          and Plex!
        </p>
        <p className="mb-4">
          Stream almost anything from anywhere at anytime, for free. If
          it&apos;s not already available, simply request it. Offering an
          extremely wide array of content already, and backed by member
          initiated requests.
        </p>
        <p className="mb-4">
          Built in NextJS and running on Node,{' '}
          <span className="text-primary font-bold">Streamarr</span> is an open
          sourced application designed to work in tandem and on top of other
          famously open sourced applications.
        </p>
        <p className="mmm-4">
          It&apos;s purpose is to supplement and compliment those applications
          that allows users to seamlessly interact and use each one in a manner
          that requires no technical skill and make for an enjoyable experience.
        </p>
      </div>
    </>
  );
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const WhatIsStreamarr = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/what-is-streamarr"
        homeElement={'Help Centre'}
        names="Getting Started,What is Streamarr?"
      />
      <HelpCard
        heading="What is Streamarr?"
        subheading='Been wondering to yourself, "what the heck is Streamarr"? Look no further...'
        content={<HelpContent />}
      />
    </section>
  );
};

export default WhatIsStreamarr;
