import PlexLoginButton from '@app/components/PlexLoginBtn';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface LoginWithPlexProps {
  onComplete: () => void;
}

const user = false;

const LoginWithPlex = ({ onComplete }: LoginWithPlexProps) => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.

  useEffect(() => {
    const login = async () => {
      const response = await axios.post('/api/v1/auth/plex', { authToken });

      if (response.data?.id) {
        null;
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken]);

  // Effect that is triggered whenever `useUser`'s user changes. If we get a new
  // valid user, we call onComplete which will take us to the next step in Setup.
  useEffect(() => {
    if (user) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <form>
      <div className="mb-2 flex justify-center text-xl font-bold">
        Welcome to Streamarr
      </div>
      <div className="mb-2 flex justify-center pb-6 text-sm">
        Get started by signing in with your Plex account
      </div>
      <div className="flex items-center justify-center">
        <PlexLoginButton onAuthToken={(authToken) => setAuthToken(authToken)} />
      </div>
    </form>
  );
};

export default LoginWithPlex;
