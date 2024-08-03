'use client';
import ImageFader from '@app/components/Common/ImageFader';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import PlexLoginButton from '@app/components/PlexLoginBtn';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const SignIn = () => {
  const [error, setError] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to sign in. If we get a success message, we will
  // ask swr to revalidate the user which _should_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const response = await axios.post('/api/v1/auth/plex', { authToken });

        if (response.data?.id) {
          // revalidate();
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
  }, [authToken]);

  const ImageArray = [
    {
      url: '/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg',
      i: '1223',
    },
    {
      url: '/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg',
      i: '94997',
    },
    {
      url: '/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
      i: '32445',
    },
    {
      url: '/7cqKGQMnNabzOpi7qaIgZvQ7NGV.jpg',
      i: '76479',
    },
    {
      url: '/rrwt0u1rW685u9bJ9ougg5HJEHC.jpg',
      i: '280180',
    },
    {
      url: '/ybn3jCia5XBD0ZgEM07gcUPuRNh.jpg',
      i: '508883',
    },
    {
      url: '/fDmci71SMkfZM8RnCuXJVDPaSdE.jpg',
      i: '519182',
    },
    {
      url: '/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg',
      i: 762441,
    },
    {
      url: '/nxxCPRGTzxUH8SFMrIsvMmdxHti.jpg',
      i: 639720,
    },
    {
      url: '/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
      i: 85937,
    },
    {
      url: '/5Aks5cCqHG8xFLoUSLsfGdVfIC.jpg',
      i: 1086747,
    },
    {
      url: '/kwronSXO1ogMqHHFvY2eBxfFLdn.jpg',
      i: 114479,
    },
    {
      url: '/jvPMJ2zM92jfXxVEFsqP1MMrLaO.jpg',
      i: 823464,
    },
    {
      url: '/dvBCdCohwWbsP5qAaglOXagDMtk.jpg',
      i: 533535,
    },
    {
      url: '/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg',
      i: 37854,
    },
    {
      url: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
      i: 693134,
    },
    {
      url: '/5fWxvjOUvtUoSmiMEpFl77V6KZV.jpg',
      i: 196322,
    },
  ];

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
      <Header />
      <main className="min-h-[93vh] relative">
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            ImageArray?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
            ) ?? []
          }
        />
        <div className="container max-w-lg mx-auto py-14 px-4">
          <div className="text-start px-2 mb-4 relative">
            <p className="text-2xl font-extrabold mb-2">Sign in to continue</p>
            <p className="text-sm">
              You will use this account to log into{' '}
              <span className="text-primary font-semibold">Streamarr</span> to
              watch your favourite movies and TV Shows.
            </p>
          </div>
          <div className="join join-vertical w-full backdrop-blur-md">
            <div className="collapse join-item mb-[1px] border-b border-zinc-800">
              <input
                type="radio"
                name="signin"
                className="checked:cursor-not-allowed"
                defaultChecked
              />
              <div className="collapse-title bg-slate-600/40">
                Use your Ple<span className="text-accent">x</span>&trade;
                account
              </div>
              <div className="collapse-content place-content-center bg-brand-dark/50">
                <div className="pt-4">
                  <PlexLoginButton
                    isProcessing={isProcessing}
                    onAuthToken={(authToken) => setAuthToken(authToken)}
                  />
                </div>
              </div>
            </div>
            <div className="collapse join-item">
              <input
                type="radio"
                name="signin"
                className="checked:cursor-not-allowed"
              />
              <div className="collapse-title bg-slate-600/40">
                Use your Streamarr account
              </div>
              <div className="collapse-content bg-brand-dark/50">
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
                      required
                    />
                  </div>
                  <div className="form-control my-4">
                    <label className="flex cursor-pointer place-items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="checkbox checkbox-primary checkbox-xs me-2 rounded-md"
                      />
                      <span className="label-text">Remember me</span>
                    </label>
                  </div>
                  <button
                    className="btn btn-block btn-primary hover:btn-secondary text-lg"
                    type="submit"
                    name="signin"
                  >
                    Sign In
                  </button>
                  <p className="mt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        openPopup({
                          title: 'Plex Password Reset',
                          w: 600,
                          h: 700,
                        });
                      }}
                      className="link-warning text-sm"
                    >
                      Wait, I forgot my password
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
          <p className="mt-4 text-start text-sm px-2 relative">
            New to <span className="text-primary font-semibold">Streamarr</span>
            ?{' '}
            <Link href="/signup" className="font-bold hover:brightness-75">
              Sign up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SignIn;
