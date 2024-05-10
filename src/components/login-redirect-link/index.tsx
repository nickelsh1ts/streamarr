const LoginRedirectLink = ({ redirectTo }) => (
  <a href={redirectTo}
      className="login-redirect-link">
      Click here if you are not automatically redirected.
      <br />
      <br />
  </a>
);

export default LoginRedirectLink;
