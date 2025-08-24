'use client';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

interface ScrollProps {
  full?: boolean;
}

const ScrollToTopBtn = ({ full = false }: ScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // if the user scrolls down, show the button
      window.scrollY > 300 ? setIsVisible(true) : setIsVisible(false);
    };
    // listen for scroll events
    window.addEventListener('scroll', toggleVisibility);

    // clear the listener on component unmount
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // handles the animation when scrolling to the top
  const scrollToTop = () => {
    isVisible &&
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
  };

  return (
    <button
      id="scrollToTopBtn"
      type="button"
      className={`btn btn-outline btn-primary m-auto ${full ? 'h-auto min-h-min p-2 rounded-md' : 'btn-circle'}${isVisible ? '' : ' hidden'}`}
      onClick={scrollToTop}
    >
      {full && (
        <FormattedMessage
          id="backToTop.backUpTop"
          defaultMessage="Back up top"
        />
      )}{' '}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="size-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 18.75 7.5-7.5 7.5 7.5"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 12.75 7.5-7.5 7.5 7.5"
        />
      </svg>
    </button>
  );
};

export default ScrollToTopBtn;
