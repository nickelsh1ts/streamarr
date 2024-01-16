import JoinButton from '@app/components/JoinButton';
import LoginButton from '@app/components/LoginButton';
import { useEffect, useState } from 'react';

const HomeNavbar = () => {
  const [navTop, setShow] = useState(false);

  const scrollNav = () => {
    if (window.scrollY > 800) {
      // if scroll down hide the navbar
      setShow(true);
    } else {
      // if scroll up show the navbar
      setShow(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', scrollNav);

    // cleanup function
    return () => {
      window.removeEventListener('scroll', scrollNav);
    };
  });

  return (
    <>
      <nav
        id="pre-sticky"
        className={`navbar navbar-dark fixed-top pre-sticky bg-transparent ${
          navTop && 'show-top-nav'
        }`}
      >
        <div className="container-fluid mx-md-4 align-items-center">
          <div className="d-flex w-100">
            <a className="text-dark me-auto text-decoration-none navbar-brand align-self-center">
              <img
                src="/img/sm-logo_full.png"
                alt="logo"
                style={{ width: '7em', height: 'auto', opacity: '0' }}
                className="img-fluid"
              ></img>
            </a>
            <LoginButton />
          </div>
        </div>
      </nav>
      <nav
        id="post-sticky"
        className={`navbar navbar-dark fixed-top post-sticky ${
          navTop && 'show-top-nav'
        }`}
        style={{ background: 'rgba(8,0,17,1)' }}
      >
        <div className="container-fluid mx-md-4 align-items-center">
          <div className="d-flex w-100">
            <a
              href="#"
              className="text-dark me-auto text-decoration-none navbar-brand align-self-center"
            >
              <img
                src="/img/sm-logo_full.png"
                alt="logo"
                style={{ width: '7em', height: 'auto' }}
                className="img-fluid"
              ></img>
            </a>
            <JoinButton />
            <LoginButton />
          </div>
        </div>
      </nav>
    </>
  );
};

export default HomeNavbar;
