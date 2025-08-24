'use client';
import Accordion from '@app/components/Common/Accordion';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import LocalLogin from '@app/components/SignIn/LocalSignIn';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex.svg';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

const SignIn = () => {
  const [error, setError] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const router = useRouter();
  const { currentSettings } = useSettings();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to sign in. If we get a success message, we will
  // ask swr to revalidate the user which _should_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const response = await axios.post('/api/v1/auth/plex', { authToken });

        if (response.data?.id) {
          revalidate().then(() => router.push('/watch'));
        }
      } catch (e) {
        setError(e.response.data.message);
        setAuthToken(undefined);
        setProcessing(false);
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken, revalidate, router]);

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
      <div className="container max-w-lg mx-auto py-14 px-4">
        <div className="text-start px-2 mb-4 relative">
          <p className="text-2xl font-extrabold mb-2">
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
            <div className="my-4 backdrop-blur-md text-primary-content">
              <button
                className={`collapse-title text-start mb-[1px] border border-primary bg-primary/40 rounded-t-lg w-full ${
                  openIndexes.includes(0) &&
                  'text-primary-content cursor-not-allowed'
                }`}
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
                  className={`p-3 place-content-center border border-secondary bg-secondary/50 ${currentSettings.localLogin ? '' : 'rounded-b-lg'}`}
                >
                  <div
                    className={`text-center text-error my-2 ${error ? 'block' : 'hidden'}`}
                  >
                    <FormattedMessage
                      id="signIn.loginFailed"
                      defaultMessage="Login failed! Something went wrong, let's try again!"
                    />
                  </div>
                  <PlexLoginButton
                    isProcessing={isProcessing}
                    onAuthToken={(authToken) => setAuthToken(authToken)}
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
          <p className="mt-4 text-start text-sm px-2 relative">
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
                    className="font-bold hover:brightness-75 ms-1"
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
