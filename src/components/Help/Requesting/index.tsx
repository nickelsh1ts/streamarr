import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';
import { faBell, faClock, faStar } from '@fortawesome/free-regular-svg-icons';
import { faMobile } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Requesting = () => {
  const settings = useSettings();
  const messages = {
    requesting: 'Request new media with Overseerr',
  };

  return (
    <>
      <PageTitle title={messages.requesting} />
      <HelpPages>
        <main className="mx-md-5 mt-3">
          <div className="row mx-md-4 px-md-4 rounded-3 border-md bg-dark text-light mx-1 mb-5 overflow-hidden px-2 shadow-lg">
            <div className="container px-4 pt-5" id="overseerr">
              <h2 className="border-bottom pb-2 align-middle">
                Request new media with{' '}
                <img
                  className="img-fluid pb-2"
                  src="/img/os-logo_full.svg"
                  style={{ width: '11rem' }}
                  alt="overseerr"
                />
              </h2>
              <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-4 pt-5">
                <div className="col d-flex align-items-start">
                  <span
                    className="me-3 position-relative rounded p-4"
                    style={{ backgroundColor: '#974ede' }}
                  >
                    <FontAwesomeIcon
                      icon={faStar}
                      className="me-3 fs-4 position-absolute top-50 start-50 translate-middle rounded"
                    />
                  </span>
                  <div>
                    <h4 className="fw-bold mb-0">
                      The best way to discover media
                    </h4>
                    <p>
                      Overseerr helps you find media you want to watch. With
                      inline recommendations and suggestions, you will find
                      yourself deeper and deeper in a rabbit hole of content you
                      never knew you just had to have.
                    </p>
                  </div>
                </div>
                <div className="col d-flex align-items-start">
                  <span
                    className="me-3 position-relative rounded p-4"
                    style={{ backgroundColor: '#974ede' }}
                  >
                    <FontAwesomeIcon
                      icon={faClock}
                      className="me-3 fs-4 position-absolute top-50 start-50 translate-middle rounded"
                    />
                  </span>
                  <div>
                    <h4 className="fw-bold mb-0">
                      Requesting has never been so easy
                    </h4>
                    <p>
                      Overseerr presents you with a request interface that is
                      incredibly easy to understand and use. You can select the
                      exact seasons you want to watch.
                    </p>
                  </div>
                </div>
                <div className="col d-flex align-items-start">
                  <span
                    className="me-3 position-relative rounded p-4"
                    style={{ backgroundColor: '#974ede' }}
                  >
                    <FontAwesomeIcon
                      icon={faBell}
                      className="me-3 fs-4 position-absolute top-50 start-50 translate-middle rounded"
                    />
                  </span>
                  <div>
                    <h4 className="fw-bold mb-0">Notifications</h4>
                    <p>
                      Several notification agents are directly supported,
                      including email, Discord and web push.
                    </p>
                  </div>
                </div>
                <div className="col d-flex align-items-start">
                  <span
                    className="me-3 position-relative rounded p-4"
                    style={{ backgroundColor: '#974ede' }}
                  >
                    <FontAwesomeIcon
                      icon={faMobile}
                      className="fs-4 position-absolute top-50 start-50 translate-middle rounded"
                    />
                  </span>
                  <div>
                    <h4 className="fw-bold mb-0">Mobile-Friendly Experience</h4>
                    <p>
                      Use Overseerr as a near-native mobile app by adding it to
                      your home screen. Overseerr is designed for use on any
                      screen size.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 align-items-stretch g-2 mx-auto pb-4">
              <div className="col">
                <div
                  className="card card-cover h-100 text-light rounded-5 overflow-hidden border shadow-lg"
                  style={{ backgroundColor: '#974ede' }}
                >
                  <div className="d-flex flex-column h-100 text-light text-shadow-1 p-5 pb-3">
                    <h2 className="display-6 lh-1 fw-bold">
                      Login to {settings.currentSettings.applicationTitle}
                    </h2>
                    <p>
                      and click{' '}
                      <img
                        style={{ width: '5rem' }}
                        className="img-fluid"
                        src="/img/os-logo_full.svg"
                        alt="overseerr"
                      />{' '}
                      to make a request.
                    </p>
                    <h2 className=" display-6 lh-1 fw-bold">
                      Or download the app{' '}
                    </h2>
                    <p>and request while you watch or on the go.</p>
                    <ul className="d-flex list-unstyled mt-auto">
                      <li className="d-flex align-items-center me-auto">
                        <small></small>
                      </li>
                      <li className="d-flex align-items-center">
                        <small>1</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col">
                <div
                  className="card card-cover h-100 rounded-5 overflow-hidden border text-white shadow-lg"
                  style={{ backgroundColor: '#974ede' }}
                >
                  <div className="d-flex flex-column h-100 text-shadow-1 p-0 pb-3 text-white">
                    <h2 className="display-6 lh-1 fw-bold px-5 pt-5">
                      Discover new media
                    </h2>
                    <p className="px-5">or search for your favourites.</p>
                    <div
                      className="border-bottom mb-4 overflow-hidden border-2 text-center"
                      style={{ maxHeight: '15rem' }}
                    >
                      <div className="container p-0"></div>
                    </div>
                    <ul className="d-flex list-unstyled mt-auto">
                      <li className="me-auto"></li>
                      <li className="d-flex align-items-center me-3"></li>
                      <li className="d-flex align-items-center px-5">
                        <small>2</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col">
                <div
                  className="card card-cover h-100 rounded-5 overflow-hidden border text-white shadow-lg"
                  style={{ backgroundColor: '#974ede' }}
                >
                  <div className="d-flex flex-column h-100 text-shadow-1 pb-3">
                    <h2 className="display-6 lh-1 fw-bold px-5 pt-5">
                      Request a movie or TV show
                    </h2>
                    <p className="px-5">
                      individually or by collection/season.
                    </p>
                    <div
                      className="border-bottom mb-4 overflow-hidden border-2 text-center"
                      style={{ maxHeight: '15rem' }}
                    >
                      <div className="container p-0"></div>
                    </div>
                    <ul className="d-flex list-unstyled mt-auto">
                      <li className="me-auto"></li>
                      <li className="d-flex align-items-center me-3"></li>
                      <li className="d-flex align-items-center px-5">
                        <small>3</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="row row-cols-1 g-2 row-cols-md-2 row-cols-lg-3 border-top mx-auto mb-4 pt-4 text-center">
              <div className="">
                <div className="card border-1 rounded-3 border p-2 shadow-sm">
                  <a
                    className="card-header py-3 text-white"
                    style={{ backgroundColor: '#974ede' }}
                    data-bs-toggle="collapse"
                    href="#howlong"
                    role="button"
                    aria-expanded="false"
                    aria-controls="howlong"
                  >
                    <h4 className="fw-normal">
                      How long does each request take?
                    </h4>
                  </a>
                  <div
                    className="card-body bg-dark text-light collapse mt-3 px-2 text-start"
                    id="howlong"
                  >
                    <p>
                      Each individual request is processed the moment it&apos;s
                      approved, or in the event it&apos;s auto-approved,
                      immediately. The time in which it takes to become
                      available on{' '}
                      <code className="text-purple">
                        {settings.currentSettings.applicationTitle}
                      </code>{' '}
                      can depend on many factors such as the release date (older
                      media can be more difficult to find), the popluarity, and
                      the quality.
                    </p>
                    <p>
                      Keep an eye on{' '}
                      <code className="text-purple">Overseerr</code>, or watch
                      for the Media Available notification.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card border-1 rounded-3 border p-2 shadow-sm">
                  <a
                    className="card-header py-3 text-white"
                    style={{ backgroundColor: '#974ede' }}
                    data-bs-toggle="collapse"
                    href="#avail"
                    role="button"
                    aria-expanded="false"
                    aria-controls="avail"
                  >
                    <h4 className="fw-normal my-0">
                      How will I know once my request has been approved or made
                      available?
                    </h4>
                  </a>
                  <div
                    className="card-body bg-dark text-light collapse mt-3 px-2 text-start"
                    id="avail"
                  >
                    <p>
                      <code className="text-purple">
                        {settings.currentSettings.applicationTitle}
                      </code>{' '}
                      currently supports 3 types of notifications, all of which
                      can be enabled or disabled via your{' '}
                      <code className="text-purple">Overseerr</code> Profile
                      Settings.{' '}
                      <i>(Push Notifications, Email, and/or Discord)</i>
                    </p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card border-1 rounded-3 border p-2 shadow-sm">
                  <a
                    className="card-header py-3 text-white"
                    style={{ backgroundColor: '#974ede' }}
                    data-bs-toggle="collapse"
                    href="#howmany"
                    role="button"
                    aria-expanded="false"
                    aria-controls="howmany"
                  >
                    <h4 className="fw-normal my-0">
                      How many Requests can I make?
                    </h4>
                  </a>
                  <div
                    className="card-body bg-dark text-light collapse mt-3 px-2 text-start"
                    id="howmany"
                  >
                    <p>
                      <code className="text-purple">
                        {settings.currentSettings.applicationTitle}
                      </code>{' '}
                      currently allows for a maximum of{' '}
                      <code
                        className="text-info fw-bold text-decoration-underline"
                        style={{ fontSize: '1em' }}
                      >
                        5
                      </code>{' '}
                      Movie requests per day and a maximum of{' '}
                      <code
                        className="text-info fw-bold text-decoration-underline"
                        style={{ fontSize: '1em' }}
                      >
                        2
                      </code>{' '}
                      Season requests every 2 days, per member. This can be
                      either two seasons of one show, or one season from two
                      different shows{' '}
                      <i>
                        (Requesting two seasons in one day will leave you with{' '}
                      </i>
                      <code className="text-info fw-bold text-decoration-underline">
                        0
                      </code>
                      <i> requests for two days).</i>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid text-dark my-5 text-center">
            Access to overseerr is automatically granted with a{' '}
            {settings.currentSettings.applicationTitle} membership.
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default Requesting;
