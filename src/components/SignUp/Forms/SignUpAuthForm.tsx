'use client';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import Toast from '@app/components/Toast';
import type { User } from '@server/entity/User';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useUser } from '@app/hooks/useUser';

//TODO: Add local user creation support

const SignUpAuthForm = ({
  onComplete,
  inviteCode,
}: {
  onComplete: (user: User) => void;
  inviteCode: string;
}) => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { revalidate } = useUser();

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
  return (
    <form>
      <PlexLoginButton
        onAuthToken={(token) => {
          if (!token || typeof token !== 'string' || token.length < 10) {
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
    </form>
  );
};

export default SignUpAuthForm;
