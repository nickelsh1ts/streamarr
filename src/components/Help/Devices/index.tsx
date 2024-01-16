import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';
import {
  faGamepad,
  faLaptop,
  faMobile,
  faPodcast,
  faTv,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Devices = () => {
  const settings = useSettings();
  const messages = {
    devices: `Connect to ${settings.currentSettings.applicationTitle} using your favourite devices.`,
  };

  return (
    <>
      <PageTitle title={messages.devices} />
      <HelpPages>
        <main className="mt-2">
          <div className="bg-dark">
            <div
              className="text-light p-0 text-center"
              style={{ background: "url('/img/promo-card.png')" }}
            >
              <div
                className="m-0 p-0"
                style={{
                  background:
                    'linear-gradient(0deg, rgba(8,0,17,0.9) 0%, rgba(43,11,83,0.7) 100%)',
                }}
              >
                <div className="col-lg-6 container py-5">
                  <h1 className="display-5 fw-bold">
                    Connect to{' '}
                    <span className="text-purple">
                      {settings.currentSettings.applicationTitle}
                    </span>{' '}
                    using your favourite devices.
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-5" style={{ minHeight: '40vh' }}>
            <nav>
              <div
                className="nav nav-tabs justify-content-center justify-content-lg-between"
                id="nav-tab"
                role="tablist"
              >
                <button
                  className="nav-link link-secondary p-md-4 active align-items-center d-flex flex-column"
                  id="nav-smp-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#nav-smp"
                  type="button"
                  role="tab"
                  aria-controls="nav-smp"
                  aria-selected="true"
                >
                  <FontAwesomeIcon
                    icon={faPodcast}
                    className="fa-2x link-purple"
                  />{' '}
                  Streaming Media Players
                </button>
                <button
                  className="nav-link link-secondary p-md-4 align-items-center d-flex flex-column"
                  id="nav-smart-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#nav-smart"
                  type="button"
                  role="tab"
                  aria-controls="nav-smart"
                  aria-selected="false"
                >
                  <FontAwesomeIcon icon={faTv} className="fa-2x link-purple" />
                  Smart TVs
                </button>
                <button
                  className="nav-link link-secondary p-md-4 align-items-center d-flex flex-column"
                  id="nav-console-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#nav-console"
                  type="button"
                  role="tab"
                  aria-controls="nav-console"
                  aria-selected="false"
                >
                  <FontAwesomeIcon
                    icon={faGamepad}
                    className="fa-2x link-purple"
                  />
                  Game Consoles
                </button>
                <button
                  className="nav-link link-secondary p-md-4 align-items-center d-flex flex-column"
                  id="nav-phone-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#nav-phone"
                  type="button"
                  role="tab"
                  aria-controls="nav-phone"
                  aria-selected="false"
                >
                  <FontAwesomeIcon
                    icon={faMobile}
                    className="fa-2x link-purple"
                  />
                  Smart Phones & Tablets
                </button>
                <button
                  className="nav-link link-secondary p-md-4 align-items-center d-flex flex-column"
                  id="nav-laptop-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#nav-laptop"
                  type="button"
                  role="tab"
                  aria-controls="nav-laptop"
                  aria-selected="false"
                >
                  <FontAwesomeIcon
                    icon={faLaptop}
                    className="fa-2x link-purple"
                  />
                  PCs & Laptops
                </button>
              </div>
            </nav>
            <div
              className="tab-content text-light"
              id="nav-tabContent"
              style={{
                backgroundImage: "url('/img/bg-panel.jpg')",
                minHeight: '40vh',
                backgroundSize: 'cover',
              }}
            >
              <div
                className="tab-pane fade active show"
                id="nav-smp"
                role="tabpanel"
                aria-labelledby="nav-smp-tab"
              >
                <div className="container-fluid col-md-8">
                  <div className="row">
                    <div className="col-md-6 mt-4">
                      <p className="fa-2x text-uppercase border-start border-purple ps-3 border-2">
                        Plug and Play
                      </p>
                      <p>
                        The newest generation of media players and streaming
                        sticks offer a fast, easy, and affordable way to watch{' '}
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>{' '}
                        on your TV with the Ple
                        <span className="link-warning">x</span>&trade; app.
                      </p>
                    </div>
                    <div className="col-md-6 align-content-center mb-md-0 mb-4 text-center">
                      <div className="col-xl-8 col-lg-9 col-9 col-sm-6 col-md-12 float-md-end container">
                        <div
                          className="row row-cols-2"
                          style={{ minHeight: '25rem' }}
                        >
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/media_players/appletv_rev.png"
                              width="100"
                              alt="appletv"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/uploads/g-chromecast.png"
                              width="130"
                              alt="chromecast"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/uploads/firetv.png"
                              width="100"
                              alt="firetv"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/uploads/roku-logo-white.png"
                              width="100"
                              alt="roku"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.png"
                              width="150"
                              alt="androidtv"
                            />
                          </div>
                          <div
                            className="col bg-dark border-1 border-secondary border p-4"
                            style={{ opacity: '0.6' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="nav-smart"
                role="tabpanel"
                aria-labelledby="nav-smart-tab"
              >
                <div className="container-fluid col-md-8">
                  <div className="row">
                    <div className="col-md-6 mt-4">
                      <p className="fa-2x text-uppercase border-start border-purple ps-3 border-2">
                        Built-in App connection
                      </p>
                      <p>
                        Enjoy Ple<span className="link-warning">x</span>
                        &apos;s&trade; gorgeous interface on your big screen
                        with the Ple<span className="link-warning">x</span>
                        &trade; Smart TV app, available in most smart TV app
                        stores, and access{' '}
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>{' '}
                        directly on-screen.
                      </p>
                    </div>
                    <div className="col-md-6 align-content-center mb-md-0 mb-4 text-center">
                      <div className="col-xl-8 col-lg-9 col-9 col-sm-6 col-md-12 float-md-end container">
                        <div
                          className="row row-cols-2"
                          style={{ minHeight: '25rem' }}
                        >
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/hdtvs/lg-logo-3d-tagline-white.png"
                              width="100"
                              alt="lg"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4 text-center">
                            <img
                              className="position-absolute top-50 start-50 translate-middle img-fluid"
                              width="100"
                              src="https://devices.netflix.com/images/hdtvs/samsung_lettermark_white_rgb.png"
                              alt="samsung"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://www.digitaltveurope.com/files/2020/01/vidaa-500x154.jpg"
                              width="100"
                              alt="firetv"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://www.vizio.com/content/dam/vizio/2021/about-vizio/VIZIO_HEADER_LOCKUP.svg"
                              width="150"
                              alt="panasonic"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              width="100"
                              alt="toshiba"
                              src="https://devices.netflix.com/images/hdtvs/hisenselogo.png"
                            />
                          </div>
                          <div
                            className="col bg-dark border-1 border-secondary border p-4"
                            style={{ opacity: '0.6' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="nav-console"
                role="tabpanel"
                aria-labelledby="nav-console-tab"
              >
                <div className="container-fluid col-md-8">
                  <div className="row">
                    <div className="col-md-6 mt-4">
                      <p className="fa-2x text-uppercase border-start border-purple ps-3 lh-1 border-2">
                        Play Games
                        <br />
                        Watch Movies
                      </p>
                      <p>
                        You can also watch{' '}
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>{' '}
                        on a variety of game consoles with the Ple
                        <span className="link-warning">x</span>&trade; app.
                      </p>
                    </div>
                    <div className="col-md-6 align-content-center mb-md-0 mb-4 text-center">
                      <div className="col-xl-8 col-lg-9 col-9 col-sm-6 col-md-12 float-md-end container">
                        <div
                          className="row row-cols-2"
                          style={{ minHeight: '25rem' }}
                        >
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/game-consoles/xboxone_stacked_wht_rgb.png"
                              width="100"
                              alt="xboxone"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4 text-center">
                            <img
                              className="position-absolute top-50 start-50 translate-middle img-fluid"
                              width="100"
                              src="https://devices.netflix.com/uploads/xboxseriesxs-2020-stack-wht-rgb-1-copy-xboxallaccess-2020-stacked-dkgray-rgb.png"
                              alt="xboxseries"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/game-consoles/ps3.png"
                              width="100"
                              alt="playstation3"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/game-consoles/ps4.png"
                              width="150"
                              alt="playstation4"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              width="100"
                              src="https://devices.netflix.com/uploads/ps5-logo.png"
                              alt="Playstation5"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              width="100"
                              alt="nvidia"
                              src="https://devices.netflix.com/images/media_players/nvidia_shield_v.png"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="nav-phone"
                role="tabpanel"
                aria-labelledby="nav-phone-tab"
              >
                <div className="container-fluid col-md-8">
                  <div className="row">
                    <div className="col-md-6 mt-4">
                      <p className="fa-2x text-uppercase border-start border-purple ps-3 lh-1 border-2">
                        Take{' '}
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>{' '}
                        with you
                      </p>
                      <p>
                        It&apos;s easy to watch{' '}
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>{' '}
                        from anywhere. If Ple
                        <span className="link-warning">x</span>&trade; isn’t
                        already on your phone or tablet, you can download the
                        free app from the Apple App Store, Google Play, or the
                        Windows Phone Store.
                      </p>
                      <p className="small text-muted">
                        *The Ple<span className="link-warning">x</span>&trade;
                        app currently only offers free playback via the casting
                        feature. To watch on the app directly on your phone a
                        small one-time fee is required. If you wish not to pay
                        the fee, you may use the newly mobile optomized{' '}
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>
                        .com app.
                      </p>
                    </div>
                    <div className="col-md-6 align-content-center mb-md-0 mb-4 text-center">
                      <div className="col-xl-8 col-lg-9 col-9 col-sm-6 col-md-12 float-md-end container">
                        <div
                          className="row row-cols-2"
                          style={{ minHeight: '25rem' }}
                        >
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/phones-and-tablets/android.png"
                              width="100"
                              alt="android"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4 text-center">
                            <img
                              className="position-absolute top-50 start-50 translate-middle img-fluid"
                              width="100"
                              src="https://devices.netflix.com/images/phones-and-tablets/apple_logo_360.png"
                              alt="apple"
                            />
                          </div>
                          <div className="col bg-dark border-1 border-secondary position-relative border p-4">
                            <img
                              className="img-fluid position-absolute top-50 start-50 translate-middle"
                              src="https://devices.netflix.com/images/phones-and-tablets/windows-phone.png"
                              width="100"
                              alt="windows"
                            />
                          </div>
                          <div
                            className="col bg-dark border-1 border-secondary position-relative border p-4"
                            style={{ opacity: '0.6' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="nav-laptop"
                role="tabpanel"
                aria-labelledby="nav-laptop-tab"
              >
                <div className="container-fluid col-sm-8">
                  <div className="row">
                    <div className="col-md-6 mt-4">
                      <p className="fa-2x text-uppercase border-start border-purple ps-3 lh-1 border-2">
                        Watch on what you have
                      </p>
                      <p>
                        <span className="text-purple">
                          {settings.currentSettings.applicationTitle}
                        </span>{' '}
                        is optimized for today&apos;s most popular browsers so
                        you can watch on your PC or laptop.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid text-dark my-5 text-center">
            <span className="text-purple">
              {settings.currentSettings.applicationTitle}
            </span>{' '}
            membership and internet connection required.
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default Devices;
