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
import { useRouter } from 'next/navigation';
import { useUser } from '@app/hooks/useUser';

const SignUpAuthForm = ({
  onComplete,
  inviteCode,
}: {
  onComplete: (user: User) => void;
  inviteCode: string;
}) => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const { revalidate } = useUser();
  const { currentSettings } = useSettings();

  // Handle Plex authentication
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
          // Revalidate user data to update authentication state
          await revalidate();
          // Always proceed to step 3 for account confirmation, regardless of Plex access
          onComplete(response.data.user);
        } else {
          Toast({
            title: 'Plex authentication failed',
            message: response.data.message || 'Plex authentication failed.',
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      } catch (error) {
        Toast({
          title: 'Plex authentication failed',
          message:
            error.response?.data?.message ||
            'Unable to authenticate with Plex. Please try again.',
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
        });
      } finally {
        setLoading(false);
      }
    };
    doAuth();
  }, [authToken, inviteCode, onComplete, router, revalidate]);

  // Handle local signup
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
        // Revalidate user data to update authentication state
        await revalidate();
        // Proceed to step 3 for account confirmation
        onComplete(response.data.user);
      } else {
        setLocalError(response.data.message || 'Account creation failed.');
      }
    } catch (error) {
      setLocalError(
        error.response?.data?.message ||
          'Unable to create account. Please try again.'
      );
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
            Sign up with your Ple<span className="text-accent">x</span>&trade;
            account
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
                      title: 'Plex login incomplete',
                      message:
                        'Plex login was not completed. Please try again and ensure you finish signing in.',
                      type: 'error',
                      icon: <XCircleIcon className="size-7" />,
                    });
                    return;
                  }
                  setAuthToken(token);
                }}
                onError={(msg) => {
                  Toast({
                    title: 'Plex login failed',
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
                Create {currentSettings.applicationTitle} account
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
