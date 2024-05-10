import { useState } from 'react';
import RememberMe from '@app/components/remember-me';
import UnselectableButton from '@app/components/unselectable-button';

const LoginForm = ({ login, failure }) => {
  const [rememberMe, updateRememberMe] = useState(
    !!localStorage.getItem('plex_token')
  );

  return (
    <div className="login-form">
      <div
        className="alert alert-danger"
        role="alert"
        style={{ display: failure ? 'block' : 'none' }}
      >
        Login was not successful.
        <br />
        Please verify your access and try again.
      </div>

      <UnselectableButton onClick={() => login(rememberMe)}>
        Sign in with&nbsp; PLEX
      </UnselectableButton>
      <br />
      <RememberMe defaultValue={rememberMe} onChange={updateRememberMe} />
    </div>
  );
};

export default LoginForm;
