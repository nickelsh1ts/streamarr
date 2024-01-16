import useSettings from '@app/hooks/useSettings';

const WatchingSection = () => {
  const settings = useSettings();
  const messages = {
    AppTitle: `${settings.currentSettings.applicationTitle}`,
  };

  return (
    <>
      <section id="watching" className="min-vh-100">
        <div className="container-fluid col-xxl-11 min-vh-100 px-4 pt-4">
          <div className="row flex-lg-row align-items-center min-vh-100 pt-5">
            <div className="col-12 col-lg mx-auto p-1">
              <img
                src="/img/devices-to-watch.png"
                className="d-block img-fluid mx-auto"
                alt="Bootstrap Themes"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col-12 col-lg text-light text-lg-start mx-auto">
              <h1 className="fw-bold lh-1 text-lg-start mb-3 mt-2 text-center">
                Watch the way you want
              </h1>
              <div className="col">
                <ul>
                  <li>
                    <p>
                      Host virtual movie nights with Watch Together. Pause,
                      rewind and react with your friends. To invite or be
                      invited to join Watch Together, membership is required.
                    </p>
                  </li>
                  <li>
                    <p>Download any movie or series and watch on-the-go.</p>
                  </li>
                  <li>
                    <p>
                      Limit your experience to{' '}
                      <span className="text-purple">{messages.AppTitle}</span>{' '}
                      or leverage all Plex has to offer.
                    </p>
                  </li>
                  <li>
                    <p>
                      An ever-growing range of titles in 720p/1080p and Dolby
                      Atmos sound on compatible devices.
                    </p>
                  </li>
                  <li>
                    <p>Stream on up to two devices at the same time.</p>
                  </li>
                  <li>
                    <p>
                      Request anything new, anywhere on the go with the
                      Overseerr app.
                    </p>
                  </li>
                  <li>
                    <p>
                      Invite up to 5 of your closest friends to join the fun.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WatchingSection;
