import CachedImage from '@app/components/Common/CachedImage';
import PlexOAuth from '@app/utils/plex';
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
        <span className="font-extrabold text-lg">
          {loading ? (
            'loading...'
          ) : isProcessing ? (
            'Signing In...'
          ) : (
            <>
              Sign In with{' '}
              <CachedImage
                alt="Plex"
                src="https://www.plex.tv/wp-content/themes/plex/assets/img/plex-logo.svg"
                className="inline-flex w-10 h-auto"
                width={40}
                height={40}
              />
            </>
          )}
        </span>
      </button>
    </span>
  );
};

export default PlexLoginButton;
