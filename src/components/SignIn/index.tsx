'use client';
import PlexLogo from '@app/assets/services/plex.svg';
import Accordion from '@app/components/Common/Accordion';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import LocalLogin from '@app/components/SignIn/LocalSignIn';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

const SignIn = () => {
  const [error, setError] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [pinId, setPinId] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const router = useRouter();
  const { currentSettings } = useSettings();

  // Effect that is triggered when the pin session id comes back from the Plex
  // OAuth popup. The server exchanges the pin for the Plex token internally.
  // If we get a success message, we will ask swr to revalidate the user which
  // _should_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const response = await axios.post('/api/v1/auth/plex', { pinId });

        if (response.data?.id) {
          const { data: authenticatedUser } =
            await axios.get('/api/v1/auth/me');
          revalidate(authenticatedUser, false).then(() =>
            router.push('/watch')
          );
        }
      } catch (e) {
        setError(
          e.response?.data?.message ?? 'Something went wrong. Please try again.'
        );
        setPinId(undefined);
        setProcessing(false);
      }
    };
    if (pinId) {
      login();
    }
  }, [pinId, revalidate, router]);

  // Effect that is triggered whenever `useUser`'s user changes. If we get a new
  // valid user, we redirect the user to the home page as the login was successful.
  useEffect(() => {
    if (user) {
      router.push('/watch');
    }
  }, [user, router]);

  return (
    <>
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="container mx-auto max-w-lg px-4 py-14">
        <div className="relative mb-4 px-2 text-start">
          <p className="mb-2 text-2xl font-extrabold">
            <FormattedMessage
              id="signIn.title"
              defaultMessage="Sign in to continue"
            />
          </p>
          <p className="text-sm">
            <FormattedMessage
              id="signIn.description"
              defaultMessage="You will use this account to log into {applicationTitle} to watch your favourite movies and TV Shows."
              values={{
                applicationTitle: (
                  <span className="text-primary font-semibold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </p>
        </div>
        <Accordion single atLeastOne>
          {({ openIndexes, handleClick, AccordionContent }) => (
            <div className="text-primary-content my-4 backdrop-blur-md">
              <button
                className={`collapse-title border-primary bg-primary/40 mb-px w-full rounded-t-lg border text-start ${
                  openIndexes.includes(0) &&
                  'text-primary-content cursor-not-allowed'
                }`}
                data-testid="signin-plex-accordion-toggle"
                onClick={() => handleClick(0)}
              >
                <FormattedMessage
                  id="signIn.plexAccount"
                  defaultMessage="Use your {plex} account"
                  values={{
                    plex: <PlexLogo className="inline-block size-9" />,
                  }}
                />
              </button>
              <AccordionContent isOpen={openIndexes.includes(0)}>
                <div
                  className={`border-secondary bg-secondary/50 place-content-center border p-3 ${currentSettings.localLogin ? '' : 'rounded-b-lg'}`}
                >
                  <div
                    className={`text-error my-2 text-center ${error ? 'block' : 'hidden'}`}
                  >
                    <FormattedMessage
                      id="signIn.loginFailed"
                      defaultMessage="Login failed! Something went wrong, let's try again!"
                    />
                  </div>
                  <PlexLoginButton
                    isProcessing={isProcessing}
                    onComplete={(pinId) => setPinId(pinId)}
                  />
                </div>
              </AccordionContent>
              {currentSettings.localLogin && (
                <>
                  <button
                    className={`collapse-title border-primary bg-primary/40 w-full border text-start ${
                      openIndexes.includes(1)
                        ? 'text-primary-content cursor-not-allowed'
                        : 'rounded-b-lg'
                    }`}
                    data-testid="signin-local-accordion-toggle"
                    onClick={() => handleClick(1)}
                  >
                    <FormattedMessage
                      id="signIn.localAccount"
                      defaultMessage="Sign in with {applicationTitle}"
                      values={{
                        applicationTitle: currentSettings.applicationTitle,
                      }}
                    />
                  </button>
                  <AccordionContent isOpen={openIndexes.includes(1)}>
                    <LocalLogin revalidate={revalidate} />
                  </AccordionContent>
                </>
              )}
            </div>
          )}
        </Accordion>
        {currentSettings.enableSignUp && (
          <p className="relative mt-4 px-2 text-start text-sm">
            <FormattedMessage
              id="signIn.newUser"
              defaultMessage="New to {applicationTitle}? {signUpLink}"
              values={{
                applicationTitle: (
                  <span className="text-primary font-semibold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
                signUpLink: (
                  <Link
                    href="/signup"
                    className="ms-1 font-bold hover:brightness-75"
                  >
                    <FormattedMessage
                      id="signIn.signUp"
                      defaultMessage="Sign up"
                    />
                  </Link>
                ),
              }}
            />
          </p>
        )}
      </div>
    </>
  );
};

export default SignIn;
