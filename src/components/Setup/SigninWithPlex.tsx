import PlexLoginButton from '@app/components/PlexLoginBtn';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface LoginWithPlexProps {
  onComplete: () => void;
}

const LoginWithPlex = ({ onComplete }: LoginWithPlexProps) => {
  const intl = useIntl();
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const { currentSettings } = useSettings();

  useEffect(() => {
    const login = async () => {
      try {
        const response = await axios.post('/api/v1/auth/plex', { authToken });

        if (response.data?.id) {
          await revalidate();
          onComplete();
        }
      } catch (error) {
        Toast({
          title: intl.formatMessage({
            id: 'setup.loginError',
            defaultMessage: 'Login error',
          }),
          message: error.message,
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
        });
        setAuthToken(undefined);
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken, intl, onComplete, revalidate]);

  useEffect(() => {
    if (user) {
      onComplete();
    }
  }, [user, onComplete]);

  return (
    <form>
      <div className="mb-2 flex justify-center text-xl font-bold">
        <FormattedMessage
          id="setup.welcomeTo"
          defaultMessage="Welcome to {appName}"
          values={{ appName: currentSettings.applicationTitle }}
        />
      </div>
      <div className="mb-2 flex justify-center pb-6 text-sm">
        <FormattedMessage
          id="setup.getStartedPlex"
          defaultMessage="Get started by signing in with your Plex account"
        />
      </div>
      <div className="flex items-center justify-center">
        <PlexLoginButton onAuthToken={(authToken) => setAuthToken(authToken)} />
      </div>
    </form>
  );
};

export default LoginWithPlex;
