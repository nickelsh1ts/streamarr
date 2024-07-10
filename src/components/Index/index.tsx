'use client'
import Devices from "@app/components/Index/Devices";
import FAQs from "@app/components/Index/FAQs";
import Favourites from "@app/components/Index/Favourites";
import Hero from "@app/components/Index/Hero";
import Requesting from "@app/components/Index/Requesting";
import Watching from "@app/components/Index/Watching";
import Footer from "@app/components/Layout/Footer"
import Header from "@app/components/Layout/Header"
import { useInView } from "@app/hooks/useElementInView";
import { useRef } from "react";

function Index() {
  const targetRef = useRef(null)
  const isInView = useInView(targetRef, 0.1);

  return (
    <main className="bg-gradient-to-b from-brand-dark from-20% via-brand-light via-50% to-brand-dark to-80%">
      <Header isInView={isInView} />
      <Hero forRef={targetRef} />
      <Requesting />
      <Watching />
      <Favourites />
      <Devices />
      <FAQs />
      <Footer />
    </main>
  )
}

export default Index
