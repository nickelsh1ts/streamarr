'use client'
import Hero from "@app/components/Index/Hero";
import Footer from "@app/components/Layout/Footer"
import Header from "@app/components/Layout/Header"
import { useInView } from "@app/hooks/useElementInView";
import { useRef } from "react";

function Index() {
  const targetRef = useRef(null)
  const isInView = useInView(targetRef, 0.1);

  return (
    <>
      <Header isInView={isInView} />
      <Hero forRef={targetRef} />
      <div className='h-lvh' id="requesting">Test</div>
      <Footer />
    </>
  )
}

export default Index
