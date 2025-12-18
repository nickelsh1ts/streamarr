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

//TODO: Update extended homepage and complete translations

function Index() {
  const targetRef = useRef(null);
  const isInView = useInView(targetRef, 0.17);
  const settings = useSettings();

  return (
    <main className="bg-gradient-to-b from-secondary from-20% via-primary/75 via-50% to-secondary to-80%">
      <Header isInView={isInView} />
      <Hero />
      {settings.currentSettings.extendedHome && (
        <div ref={targetRef}>
          <Requesting />
          <Watching />
          <Favourites />
          <Devices />
          <FAQs />
          <Footer />
        </div>
      )}
    </main>
  );
}

export default Index;
