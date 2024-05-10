const RememberMe = ({ defaultValue, onChange }) => (
  <>
    <label
      htmlFor="indeterminate-checkbox"
      className={`login-remember-me-checkbox-${defaultValue ? '' : 'un'}checked login-remember-me-checkbox`}
    >
      Remember Me
    </label>
    <input
      className="form-check-input"
      type="checkbox"
      id="indeterminate-checkbox"
      name="rememberme"
      value="true"
      checked={true}
      onClick={() => onChange(!defaultValue)}
    />
  </>
);

export default RememberMe;
