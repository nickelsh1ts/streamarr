import { faFileAlt } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PopularTopics = () => {
  return (
    <>
      <div className="border-bottom text-dark">
        <h4 className="fw-bold">Popular topics</h4>
        <div className="mb-4">
          <a
            href="/help/become-a-member"
            className="link-dark text-decoration-none fw-bold"
          >
            <button
              type="button"
              className="btn btn-light rounded-0 col-12 col-md-3 text-lg-center mx-md-1 mx-auto my-1 border-0 p-3 text-start shadow-lg"
            >
              <FontAwesomeIcon icon={faFileAlt} /> How to become a member
            </button>
          </a>
          <a
            href="/help/devices"
            className="link-dark text-decoration-none fw-bold"
          >
            <button
              type="button"
              className="btn btn-light rounded-0 col-12 col-md-3 text-lg-center mx-md-1 mx-auto my-1 border-0 p-3 text-start shadow-lg"
            >
              <FontAwesomeIcon icon={faFileAlt} /> Supported devices
            </button>
          </a>
          <a
            href="/help/requesting"
            className="link-dark text-decoration-none fw-bold"
          >
            <button
              type="button"
              className="btn btn-light rounded-0 col-12 col-md-3 text-lg-center mx-md-1 mx-auto my-1 border-0 p-3 text-start shadow-lg"
            >
              <FontAwesomeIcon icon={faFileAlt} /> Requesting new media
            </button>
          </a>
        </div>
        <p className="text-dark mb-3">
          Having issues connecting? Check out our{' '}
          <a
            href="//status.nickflixtv.com"
            className="link-purple text-decoration-none fw-bold mb-4"
          >
            Status Page
          </a>
        </p>
      </div>
    </>
  );
};

export default PopularTopics;
