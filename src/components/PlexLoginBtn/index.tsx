import PlexLogo from '@app/assets/services/plex.svg';
import PlexOAuth from '@app/utils/plex';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

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
            <FormattedMessage
              id="common.loading"
              defaultMessage="Loading..."
            />
          ) : isProcessing ? (
            <FormattedMessage
              id="common.signingIn"
              defaultMessage="Signing In..."
            />
          ) : (
            <>
              <FormattedMessage
                id="plex.login.button"
                defaultMessage="Sign in with"
              />
              <PlexLogo className="inline-flex size-10 ml-2" />
            </>
          )}
        </span>
      </button>
    </span>
  );
};

export default PlexLoginButton;
