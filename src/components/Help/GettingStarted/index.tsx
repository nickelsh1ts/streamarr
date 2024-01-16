import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';

const GettingStarted = () => {
  const settings = useSettings();
  const messages = {
    gettingstarted: 'Getting Started',
  };

  return (
    <>
      <PageTitle title={messages.gettingstarted} />
      <HelpPages>
        <main className="mx-md-5">
          <div className="row m-md-4 p-xl-4 rounded-3 justify-content-center bg-dark text-light m-1 mb-5 border shadow-lg">
            <div className="row flex-lg-row-reverse align-items-center justify-content-center p-2">
              <div className="col-10 col-sm-8 col-lg-6 my-lg-0 my-4">
                <div className="col planet m-auto">
                  <img
                    alt="astro-earth"
                    src="/img/astro-hug-earth.png"
                    className="d-block mx-lg-auto img-fluid"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <h1 className="display-5 fw-bold lh-1 mb-3">Getting Started</h1>
                <p className="lead">
                  Welcome to{' '}
                  <span className="text-purple">
                    {settings.currentSettings.applicationTitle}
                  </span>
                  . Please take a look below for some common questions when
                  setting up your account for the first time.
                </p>
                <div className="row text-start align-text-bottom">
                  <div
                    className="accordion accordion-flush text-white"
                    id="gettingstarted"
                  >
                    <div className="accordion-item bg-dark mb-2 text-white">
                      <h2 className="accordion-header" id="streamarrHeading">
                        <button
                          className="btn-purple accordion-button collapsed fw-bold"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#whatisstreamarr"
                          aria-expanded="false"
                          aria-controls="whatisstreamarr"
                        >
                          What is {settings.currentSettings.applicationTitle}?
                        </button>
                      </h2>
                      <div
                        id="whatisstreamarr"
                        className="accordion-collapse collapse"
                        aria-labelledby="streamarrHeading"
                        data-bs-parent="#gettingstarted"
                      >
                        <div className="accordion-body">
                          <p>
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            is a private members only streaming service and is
                            owned and operated by{' '}
                            {settings.currentSettings.companyTitle}. Powered by
                            the amazing technology behind{' '}
                            <a
                              rel="noreferrer"
                              className="link link-light"
                              target="_blank"
                              href="https://plex.tv"
                            >
                              Ple<span className="link-warning">x</span>
                            </a>
                            &trade; and managed with several Open Source
                            applications.{' '}
                          </p>
                          <p>
                            Stream almost anything from anywhere at anytime, for
                            free. If it&apos;s not already available, simply
                            request it. This is our philosophy.{' '}
                          </p>
                          <p>
                            Offering an extremely wide array of content already,
                            and backed by member initiated requests.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item bg-dark mb-2">
                      <h2
                        className="accordion-header bg-dark bg-dark text-white"
                        id="plexHeading"
                      >
                        <button
                          className="btn-purple accordion-button collapsed fw-bold flex-wrap"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#whatisPlex"
                          aria-expanded="false"
                          aria-controls="whatisPlex"
                        >
                          What is Ple<span className="link-warning">x</span>
                          &trade;?
                        </button>
                      </h2>
                      <div
                        id="whatisPlex"
                        className="accordion-collapse collapse"
                        aria-labelledby="plexHeading"
                        data-bs-parent="#gettingstarted"
                      >
                        <div className="accordion-body text-light">
                          <p>
                            Plex gives you one place to find and access all the
                            media that matters to you. From personal media on
                            your own server, to free and on-demand Movies &
                            Shows, live TV, podcasts, and web shows, to
                            streaming music, you can enjoy it all in one app, on
                            any device.
                          </p>
                          <p>
                            If you are streaming only third-party content (
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>
                            , live TV, web shows), then you are good to go as
                            soon as you have an account, just install an app on
                            your phone, Smart TV, computer, or simply open up
                            our web app on your browser!
                          </p>
                          <p>
                            Watch thousands of free, on-demand Movies & Shows
                            streaming service or over 100 channels of live TV.
                            Listen to your favorite podcasts at home or on your
                            commute. Watch your favorite web shows from talented
                            creators around the world. You can even access over
                            60 million streaming music tracks and videos,
                            provided by TIDAL!
                          </p>
                          <p>
                            Find more feature information{' '}
                            <a
                              rel="noreferrer"
                              href="https://plex.tv"
                              target="_blank"
                              className="link plex-orange-text"
                            >
                              on our website.
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item bg-dark mb-2">
                      <h2
                        className="accordion-header bg-dark text-white"
                        id="downloadPlexHeading"
                      >
                        <button
                          className="btn-purple accordion-button collapsed fw-bold d-flex flex-wrap"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#downloadPlex"
                          aria-expanded="false"
                          aria-controls="downloadPlex"
                        >
                          How to download the Ple
                          <span className="link-warning">x</span>&trade; app.
                        </button>
                      </h2>
                      <div
                        id="downloadPlex"
                        className="accordion-collapse collapse"
                        aria-labelledby="downloadPlexHeading"
                        data-bs-parent="#gettingstarted"
                      >
                        <div className="accordion-body text-light">
                          <p>
                            Head on over to{' '}
                            <a
                              rel="noreferrer"
                              className="link plex-orange-text"
                              href="https://www.plex.tv/en-ca/media-server-downloads/#plex-app"
                              target="_blank"
                            >
                              this page here
                            </a>{' '}
                            and choose your preferred device. It&apos;s that
                            easy.
                          </p>
                          <p>
                            Some smart TVs and media devices will come with the
                            Ple<span className="link-warning">x</span>&trade;
                            app already installed, or easily installable via
                            their built in app stores.
                          </p>
                          <p>
                            Although the Ple
                            <span className="link-warning">x</span>&trade; app
                            is not required to stream{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>
                            , on certain devices such as smart TVs or game
                            systems it may offer a better experience.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item bg-dark mb-2">
                      <h2
                        className="accordion-header bg-dark"
                        id="downloadstreamarrHeading"
                      >
                        <button
                          className="btn-purple accordion-button collapsed fw-bold"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#downloadstreamarr"
                          aria-expanded="false"
                          aria-controls="downloadstreamarr"
                        >
                          How to download the streamarr app.
                        </button>
                      </h2>
                      <div
                        id="downloadstreamarr"
                        className="accordion-collapse collapse"
                        aria-labelledby="downloadstreamarrHeading"
                        data-bs-parent="#gettingstarted"
                      >
                        <div className="accordion-body text-light">
                          <p>
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            currently supports the Progressive Web App (PWA)
                            feature of modern web browsers. While support varies
                            across different browsers, it is generally
                            recognized automatically when accessing{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>
                            .com. If your browser supports PWA you will see a
                            notification either in the top of the browser or in
                            a popup. Simply hit install to download.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item bg-dark mb-2">
                      <h2
                        className="accordion-header bg-dark"
                        id="quickstartHeading"
                      >
                        <button
                          className="btn-purple accordion-button collapsed fw-bold"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#quickstartGuide"
                          aria-expanded="false"
                          aria-controls="quickstartGuide"
                        >
                          Quick Start Guide
                        </button>
                      </h2>
                      <div
                        id="quickstartGuide"
                        className="accordion-collapse collapse"
                        aria-labelledby="quickstartHeading"
                        data-bs-parent="#gettingstarted"
                      >
                        <div className="accordion-body text-light">
                          <h4>First things first</h4>
                          <p>
                            Once you&apos;ve created your Ple
                            <span className="link-warning">x</span>&trade;
                            account and registered for{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            you&apos;ll recieve an invite email that requires
                            you to accept. Until you accept this invite, your
                            Ple<span className="link-warning">x</span>&trade;
                            account will not have access to{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            content.
                          </p>
                          <h4>
                            Next, we can login and start setting up your
                            account.
                          </h4>
                          <p>
                            You&apos;ll notice when signing in for the first
                            time, that the Home page currently lists a lot of
                            content available from Ple
                            <span className="link-warning">x</span>&trade; and
                            not{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>
                            . To change this, you need to log into{' '}
                            <a
                              className="link-warning"
                              rel="noreferrer"
                              href="https://app.plex.tv"
                              target="_blank"
                            >
                              app.ple<span className="link-warning">x</span>.tv
                            </a>{' '}
                            and &quote;pin&quote;{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            via the menu.
                          </p>
                          <p className="small">
                            Tip: You can also reorder the libraries so they
                            appear on the home page in your desired order.
                            <br /> Our reccomended order is: Movies, TV Shows,
                            Retro: Movies, Retro: TV Shows, Retro: Kids Shows,
                            Discover, Watchlist
                          </p>
                          <h4>
                            And if we only want to see & access{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            content, not Ple
                            <span className="link-warning">x</span>&trade;?
                          </h4>
                          <p>
                            From the Options menu in{' '}
                            <span className="text-purple">
                              {settings.currentSettings.applicationTitle}
                            </span>{' '}
                            you can select{' '}
                            <span className="font-italic">
                              Online Media Sources
                            </span>{' '}
                            and disable Live TV, Movies & TV and Music.
                          </p>
                          <p>
                            Optionally you can adjust your Discovery preferences
                            here as well. We reccomend leaving these as their
                            default though.
                          </p>
                          <h4>
                            That&apos;s it! Now we can watch and request to our
                            hearts content.
                          </h4>
                          <p>
                            Browse the library, download the apps, and make
                            requests via Overseerr.
                            <br />{' '}
                            <span className="small">
                              Reminder: You won&apos;t be able to invite friends
                              during your 5 day trial period.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default GettingStarted;
