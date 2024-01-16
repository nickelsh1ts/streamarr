import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const LoginButton = () => {
  return (
    <>
      <a href="/login" id="login" className="align-self-center">
        <button
          type="button"
          className="btn btn-purple me-md-2 vartext d-print-none"
        >
          Sign in <FontAwesomeIcon icon={faSignInAlt} />
        </button>
      </a>
    </>
  );
};

export default LoginButton;
