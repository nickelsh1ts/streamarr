'use client';
import Accordion from '@app/components/Common/Accordion';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import LocalSignupForm from '@app/components/SignUp/Forms/LocalSignupForm';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import type { User } from '@server/entity/User';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { XCircleIcon } from '@heroicons/react/24/solid';
import PlexLogo from '@app/assets/services/plex.svg';
import { useRouter } from 'next/navigation';
import { useUser } from '@app/hooks/useUser';
import { FormattedMessage, useIntl } from 'react-intl';

const SignUpAuthForm = ({
  onComplete,
  inviteCode,
}: {
  onComplete: (user: User) => void;
  inviteCode: string;
}) => {
  const intl = useIntl();
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const { revalidate } = useUser();
  const { currentSettings } = useSettings(); // Handle Plex authentication
  useEffect(() => {
    const doAuth = async () => {
      if (!authToken || !inviteCode) return;
      setLoading(true);
      try {
        const response = await axios.post<{
          user: User;
          message?: string;
          alreadyHasAccess?: boolean;
        }>('/api/v1/signup/plexauth', {
          authToken,
          icode: inviteCode,
        });
        if (response.status === 200 && response.data.user) {
          await revalidate();
          onComplete(response.data.user);
        } else {
          Toast({
            title: intl.formatMessage({
              id: 'signUp.plexAuthFailed',
              defaultMessage: 'Plex authentication failed',
            }),
            message: response.data.message,
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      } catch (e) {
        Toast({
          title: intl.formatMessage({
            id: 'signUp.plexAuthFailed',
            defaultMessage: 'Plex authentication failed',
          }),
          message: e.response?.data?.message,
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
        });
      } finally {
        setLoading(false);
      }
    };
    doAuth();
  }, [authToken, inviteCode, onComplete, router, revalidate, intl]); // Handle local signup
  const handleLocalSignup = async (values: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    setLocalError(null);
    setLoading(true);
    try {
      const response = await axios.post<{
        success: boolean;
        user: User;
        message?: string;
      }>('/api/v1/signup/localauth', {
        email: values.email,
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        icode: inviteCode,
      });

      if (response.status === 200 && response.data.user) {
        await revalidate();
        onComplete(response.data.user);
      } else {
        setLocalError(response.data.message);
      }
    } catch (error) {
      setLocalError(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Accordion single atLeastOne>
      {({ openIndexes, handleClick, AccordionContent }) => (
        <div className="my-4 backdrop-blur-md text-primary-content">
          <button
            className={`collapse-title text-start mb-[1px] border border-primary bg-primary/40 rounded-t-lg w-full ${
              openIndexes.includes(0) &&
              'text-primary-content cursor-not-allowed'
            }`}
            onClick={() => handleClick(0)}
          >
            <FormattedMessage
              id="signUp.loginWithPlex"
              defaultMessage="Sign up with your {plexLogo} account"
              values={{
                plexLogo: <PlexLogo className="inline-block size-9" />,
              }}
            />
          </button>
          <AccordionContent isOpen={openIndexes.includes(0)}>
            <div
              className={`p-3 place-content-center border border-secondary bg-secondary/50 ${currentSettings.localLogin ? '' : 'rounded-b-lg'}`}
            >
              <PlexLoginButton
                onAuthToken={(token) => {
                  if (
                    !token ||
                    typeof token !== 'string' ||
                    token.length < 10
                  ) {
                    Toast({
                      title: intl.formatMessage({
                        id: 'signUp.plexLoginIncomplete',
                        defaultMessage: 'Plex login incomplete',
                      }),
                      message: intl.formatMessage({
                        id: 'signUp.plexLoginIncompleteMessage',
                        defaultMessage:
                          'Plex login was not completed. Please try again and ensure you finish signing in.',
                      }),
                      type: 'error',
                      icon: <XCircleIcon className="size-7" />,
                    });
                    return;
                  }
                  setAuthToken(token);
                }}
                onError={(msg) => {
                  Toast({
                    title: intl.formatMessage({
                      id: 'signUp.plexLoginError',
                      defaultMessage: 'Plex login failed',
                    }),
                    message: msg,
                    type: 'error',
                    icon: <XCircleIcon className="size-7" />,
                  });
                }}
                isProcessing={loading}
              />
            </div>
          </AccordionContent>
          {currentSettings.localLogin && (
            <>
              <button
                className={`collapse-title text-start border border-primary bg-primary/40 w-full ${
                  openIndexes.includes(1)
                    ? 'text-primary-content cursor-not-allowed'
                    : 'rounded-b-lg'
                }`}
                onClick={() => handleClick(1)}
              >
                <FormattedMessage
                  id="signUp.createLocalAccount"
                  defaultMessage="Create {applicationTitle} account"
                  values={{
                    applicationTitle: currentSettings.applicationTitle,
                  }}
                />
              </button>
              <AccordionContent isOpen={openIndexes.includes(1)}>
                <LocalSignupForm
                  onSubmit={handleLocalSignup}
                  isSubmitting={loading}
                  error={localError}
                />
              </AccordionContent>
            </>
          )}
        </div>
      )}
    </Accordion>
  );
};

export default SignUpAuthForm;
