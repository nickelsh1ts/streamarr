import useSettings from '@app/hooks/useSettings';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import {
  faBookOpen,
  faEnvelopeOpenText,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const MoreHelp = () => {
  const settings = useSettings();

  return (
    <>
      <div className="d-print-none text-dark mt-5">
        <div className="px-md-5 py-3" style={{ background: '#E8EAED' }}>
          <div className="container py-5">
            <h1 className="text-secondary text-center">Need more help?</h1>
            <p className="col-lg-8 lead mx-auto text-center">
              Check out the help section on Plex or reach out below! We&apos;re
              available during EST hours.
            </p>
            <div className="row row-cols-1 row-cols-lg-2 g-3 mb-5 pt-3">
              <div className="col">
                <div className="card h-100 bg-white shadow">
                  <div className="card-body p-sm-5 p-4">
                    <div className="d-flex">
                      <FontAwesomeIcon
                        icon={faHeadset}
                        className="fa-4x my-auto"
                      />
                      <div className="ms-4 my-auto">
                        <h5 className="card-text">Contact Us</h5>
                        <p className="">
                          Need to chat with us? We&apos;re available on Discord!
                        </p>
                        <div className="d-flex flex-wrap">
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={settings.currentSettings.discord}
                            type="button"
                            className="btn btn-purple fw-bold me-1 mb-2"
                          >
                            Discord <FontAwesomeIcon icon={faDiscord} />
                          </a>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`mailto:${settings.currentSettings.supportEmail}`}
                            type="button"
                            className="btn btn-outline-purple fw-bold mx-1 mb-2"
                          >
                            Email <FontAwesomeIcon icon={faEnvelopeOpenText} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100 bg-white shadow">
                  <div className="card-body p-sm-5 p-4">
                    <div className="d-flex">
                      <FontAwesomeIcon
                        icon={faBookOpen}
                        className="fa-4x my-auto"
                      />
                      <div className="ms-4 my-auto">
                        <h5 className="card-text">Visit Plex</h5>
                        <p className="">
                          Take a look at the Plex Help section or browse their
                          forums for even more assistance.
                        </p>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://support.plex.tv/"
                          type="button"
                          className="btn btn-warning fw-bold"
                        >
                          Plex Support
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MoreHelp;
