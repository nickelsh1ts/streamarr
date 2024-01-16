import useSettings from '@app/hooks/useSettings';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CookiesBanner = () => {
  const settings = useSettings();
  const messages = {
    AppTitle: `${settings.currentSettings.applicationTitle}`,
  };

  return (
    <>
      <div
        style={{ fontSize: '0.8rem' }}
        className="alert alert-dark alert-dismissible pe-auto cookies"
        id="cookies"
        role="alert"
      >
        <FontAwesomeIcon
          className="fa-lg me-2"
          icon={faInfoCircle}
          aria-hidden="true"
        />
        <span className="text-purple">{messages.AppTitle}</span> uses cookies
        for personalization, ease of access, and for other purposes.{' '}
        <a className="alert-link" target="_blank" href="/help/privacy">
          Learn more.
        </a>{' '}
        <span className="text-purple">{messages.AppTitle}</span> supports the
        Digital Advertising Alliance principles. By interacting with this site,
        you agree to our use of cookies.
        <button
          type="button"
          id="cookiesClose"
          className="btn-close"
          data-bs-dismiss="alert"
          aria-label="Close"
        ></button>
      </div>
    </>
  );
};

export default CookiesBanner;
