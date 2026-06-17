'use client';
import Devices from '@app/components/Index/Devices';
import FAQs from '@app/components/Index/FAQs';
import Favourites from '@app/components/Index/Favourites';
import Hero from '@app/components/Index/Hero';
import Requesting from '@app/components/Index/Requesting';
import Watching from '@app/components/Index/Watching';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import { useInView } from '@app/hooks/useElementInView';
import useSettings from '@app/hooks/useSettings';
import { useRef } from 'react';

function Index() {
  const targetRef = useRef(null);
  const isInView = useInView(targetRef, 0.17, true);
  const { currentSettings } = useSettings();

  return (
    <main className="from-secondary via-primary/75 to-secondary bg-linear-to-b from-20% via-50% to-80%">
      <Header isInView={!isInView} />
      <div ref={targetRef}>
        <Hero />
      </div>
      {currentSettings.extendedHome && (
        <>
          {currentSettings.seerrEnabled && <Requesting />}
          <Watching />
          <Favourites />
          <Devices />
          <FAQs />
          <Footer />
        </>
      )}
    </main>
  );
}

export default Index;
