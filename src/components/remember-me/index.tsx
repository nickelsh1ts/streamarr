const RememberMe = ({ defaultValue, onChange }) => (
  <label className={`login-remember-me-checkbox-${defaultValue ? '' : 'un'}checked login-remember-me-checkbox`}
      onClick={() => onChange(!defaultValue)}>
      Remember Me
  </label>
);

export default RememberMe;
