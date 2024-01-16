import { faLevelUpAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

const ScrollToTopBtn = () => {
  const [topButton, setShow] = useState(false);

  function scrollFunction() {
    if (
      document.body.scrollTop > 300 ||
      document.documentElement.scrollTop > 300
    ) {
      // Show button
      setShow(true);
    } else {
      // Hide button
      setShow(false);
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', scrollFunction);

    // cleanup function
    return () => {
      window.removeEventListener('scroll', scrollFunction);
    };
  });

  const scrollToTop = () => {
    // Scroll to top logic
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <div className="container mb-5 text-center">
        <button
          id="scrollToTopBtn"
          type="button"
          className={`btn btn-outline-purple m-auto ${
            topButton ? 'd-block' : 'd-none'
          }`}
          onClick={scrollToTop}
        >
          Back up top <FontAwesomeIcon icon={faLevelUpAlt} />
        </button>
      </div>
    </>
  );
};

export default ScrollToTopBtn;
