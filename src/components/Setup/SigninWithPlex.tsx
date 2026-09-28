import PlexLoginButton from '@app/components/PlexLoginBtn';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface LoginWithPlexProps {
  onComplete: () => void;
}

const LoginWithPlex = ({ onComplete }: LoginWithPlexProps) => {
  const intl = useIntl();
  const [pinId, setPinId] = useState<string | undefined>(undefined);
  const loginAttempt = useRef<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const { currentSettings } = useSettings();

  useEffect(() => {
    if (!pinId || loginAttempt.current === pinId) {
      return;
    }

    loginAttempt.current = pinId;

    const login = async () => {
      try {
        const response = await axios.post('/api/v1/auth/plex', { pinId });

        if (response.data?.id) {
          await revalidate(response.data, false);
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
        loginAttempt.current = undefined;
        setPinId(undefined);
      }
    };
    login();
  }, [pinId, intl, onComplete, revalidate]);

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
        <PlexLoginButton onComplete={(pinId) => setPinId(pinId)} />
      </div>
    </form>
  );
};

export default LoginWithPlex;
