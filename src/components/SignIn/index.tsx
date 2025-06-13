'use client';
import Accordion from '@app/components/Common/Accordion';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SignIn = () => {
  const [error, setError] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const router = useRouter();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to sign in. If we get a success message, we will
  // ask swr to revalidate the user which _should_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const response = await axios.post('/api/v1/auth/plex', { authToken });

        if (response.data?.id) {
          revalidate();
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
  }, [authToken, revalidate]);

  // Effect that is triggered whenever `useUser`'s user changes. If we get a new
  // valid user, we redirect the user to the home page as the login was successful.
  useEffect(() => {
    if (user) {
      router.push('/watch');
    }
  }, [user, router]);

  function openPopup({
    title,
    w,
    h,
  }: {
    title: string;
    w: number;
    h: number;
  }): Window | void {
    if (!window) {
      throw new Error(
        'Window is undefined. Are you running this in the browser?'
      );
    }
    // Fixes dual-screen position
    const dualScreenLeft =
      window.screenLeft != undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop != undefined ? window.screenTop : window.screenY;
    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;
    const left = width / 2 - w / 2 + dualScreenLeft;
    const top = height / 2 - h / 2 + dualScreenTop;

    const newWindow = window.open(
      'https://app.plex.tv/auth#?resetPassword',
      title,
      'scrollbars=yes, width=' +
        w +
        ', height=' +
        h +
        ', top=' +
        top +
        ', left=' +
        left
    );

    if (newWindow) {
      newWindow.focus();
      return this;
    }
  }

  return (
    <>
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="container max-w-lg mx-auto py-14 px-4">
        <div className="text-start px-2 mb-4 relative">
          <p className="text-2xl font-extrabold mb-2">Sign in to continue</p>
          <p className="text-sm">
            You will use this account to log into{' '}
            <span className="text-primary font-semibold">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
            </span>{' '}
            to watch your favourite movies and TV Shows.
          </p>
        </div>
        <Accordion single atLeastOne>
          {({ openIndexes, handleClick, AccordionContent }) => (
            <div className="max-w-md my-4 mx-auto w-full backdrop-blur-md text-primary-content">
              <button
                className={`collapse-title text-start mb-[1px] border border-primary bg-primary/40 rounded-t-lg w-full ${
                  openIndexes.includes(0) &&
                  'text-primary-content cursor-not-allowed'
                }`}
                onClick={() => handleClick(0)}
              >
                Use your Ple<span className="text-accent">x</span>&trade;
                account
              </button>
              <div
                className={`text-center text-error my-2 ${error ? 'block' : 'hidden'}`}
              >
                Login failed! Something went wrong, let&apos;s try again!
              </div>
              <AccordionContent isOpen={openIndexes.includes(0)}>
                <div className="p-3 place-content-center border border-secondary bg-secondary/50">
                  <PlexLoginButton
                    isProcessing={isProcessing}
                    onAuthToken={(authToken) => setAuthToken(authToken)}
                  />
                </div>
              </AccordionContent>
              <button
                className={`collapse-title text-start border border-primary bg-primary/40 w-full ${
                  openIndexes.includes(1)
                    ? 'text-primary-content cursor-not-allowed'
                    : 'rounded-b-lg'
                }`}
                onClick={() => handleClick(1)}
              >
                Sign in with {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
              </button>
              <AccordionContent isOpen={openIndexes.includes(1)}>
                <div className="p-4 place-content-center bg-secondary/50 border border-secondary rounded-b-lg">
                  <form method="post" className="mt-4">
                    <div
                      className={`text-center text-error my-2 ${error ? 'block' : 'hidden'}`}
                    >
                      Login failed! Invalid email or password!
                    </div>
                    <div className="input input-bordered input-primary flex items-center mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 opacity-70 me-2"
                      >
                        <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                      </svg>
                      <input
                        type="text"
                        className="grow"
                        placeholder="Email address"
                        disabled
                        required
                      />
                    </div>
                    <div className="input input-bordered input-primary flex items-center gap-2 active:ring-red-50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 opacity-70"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <input
                        type="password"
                        className="grow"
                        placeholder="Password"
                        disabled
                        required
                      />
                    </div>
                    <div className="form-control my-4">
                      <label className="flex cursor-pointer place-items-center">
                        <input
                          type="checkbox"
                          disabled
                          defaultChecked
                          className="checkbox checkbox-primary checkbox-xs me-2 rounded-md"
                        />
                        <span className="label-text">Remember me</span>
                      </label>
                    </div>
                    <p className="text-sm text-center mb-2 text-error">
                      Local sign in is currently disabled
                    </p>
                    <button
                      className="btn btn-block btn-primary hover:btn-secondary text-lg"
                      disabled
                      type="submit"
                      name="signin"
                    >
                      Sign In
                    </button>
                    <p className="mt-1 text-center">
                      <button
                        type="button"
                        disabled
                        onClick={() => {
                          openPopup({
                            title: 'Plex Password Reset',
                            w: 600,
                            h: 700,
                          });
                        }}
                        className="text-warning text-sm hover:cursor-not-allowed"
                      >
                        Wait, I forgot my password
                      </button>
                    </p>
                  </form>
                </div>
              </AccordionContent>
            </div>
          )}
        </Accordion>
        <p className="mt-4 text-start text-sm px-2 relative">
          New to{' '}
          <span className="text-primary font-semibold">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
          </span>
          ?
          <Link href="/signup" className="font-bold hover:brightness-75 ms-1">
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
};

export default SignIn;
