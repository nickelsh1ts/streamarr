import { faDiscord, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const FooterSocials = () => {
  return (
    <>
      <div className="text-white-50 container">
        <h3>
          <a
            className="link-secondary align-middle"
            rel="noreferrer"
            target="_blank"
            href="https://discord.gg/ZSTrRJMcDS"
          >
            <FontAwesomeIcon icon={faDiscord} className="me-2 mb-1" />
          </a>
          <a
            rel="noreferrer"
            className="link-secondary"
            target="_blank"
            href="https://www.youtube.com/channel/UCV6I_2eeiaq1R6aiwRvHWKA"
          >
            <FontAwesomeIcon icon={faYoutube} className="mx-2" />
          </a>
        </h3>
      </div>
    </>
  );
};

export default FooterSocials;
