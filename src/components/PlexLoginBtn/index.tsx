import PlexOAuth from '@app/utils/plex';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const plexOAuth = new PlexOAuth();

interface PlexLoginButtonProps {
  onAuthToken: (authToken: string) => void;
  isProcessing?: boolean;
  onError?: (message: string) => void;
}

const PlexLoginButton = ({
  onAuthToken,
  onError,
  isProcessing,
}: PlexLoginButtonProps) => {
  const [loading, setLoading] = useState(false);

  const getPlexLogin = async () => {
    setLoading(true);
    try {
      const authToken = await plexOAuth.login();
      setLoading(false);
      onAuthToken(authToken);
    } catch (e) {
      if (onError) {
        onError(e.message);
      }
      setLoading(false);
    }
  };
  return (
    <span className="block w-full rounded-md shadow-sm">
      <button
        type="button"
        onClick={() => {
          plexOAuth.preparePopup();
          setTimeout(() => getPlexLogin(), 1500);
        }}
        disabled={loading || isProcessing}
        className="btn btn-accent btn-block font-extrabold disabled:bg-accent/40 disabled:cursor-progress disabled:pointer-events-auto disabled:hover:bg-accent/40 disabled:no-animation"
      >
        <ArrowLeftEndOnRectangleIcon className="h-7 w-7" />
        <span className="font-extrabold text-lg">
          {loading ? (
            'loading'
          ) : isProcessing ? (
            'Signing In...'
          ) : (
            <>
              Sign In with{' '}
              <img
                alt="Plex"
                src="https://www.plex.tv/wp-content/themes/plex/assets/img/plex-logo.svg"
                className="inline-flex w-10 h-auto"
              />
            </>
          )}
        </span>
      </button>
    </span>
  );
};

export default PlexLoginButton;
