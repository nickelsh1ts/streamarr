'use client';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import Toast from '@app/components/Toast';
import type { User } from '@server/entity/User';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

const SignUpAuthForm = ({
  onComplete,
}: {
  onComplete: (user: User) => void;
}) => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const doAuth = async () => {
      if (!authToken) return;
      setLoading(true);
      try {
        const response = await axios.get<{
          user: User;
          message?: string;
          alreadyHasAccess?: boolean;
        }>(`/api/v1/signup/plexauth/${authToken}`);
        if (response.status === 200 && response.data.alreadyHasAccess) {
          // User already has access, redirect to /watch
          router.replace('/watch');
          return;
        }
        if (response.status === 200 && response.data.user) {
          onComplete(response.data.user);
        } else {
          Toast({
            title: 'Plex authentication failed',
            message: response.data.message || 'Plex authentication failed.',
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    doAuth();
  }, [authToken, onComplete, router]);
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
