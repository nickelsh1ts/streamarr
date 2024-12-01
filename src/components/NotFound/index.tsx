'use client';
import ImageFader from '@app/components/Common/ImageFader';
import PathName from '@app/components/Common/PathName';
import { ImageArray } from '@app/components/Layout';
import Footer from '@app/components/Layout/Footer';
import { BackwardIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <div className="text-center min-h-[calc(100dvh-4rem)] grid place-items-center relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <ImageFader
            rotationSpeed={6000}
            backgroundImages={
              ImageArray?.map(
                (backdrop) =>
                  `https://image.tmdb.org/t/p/original${backdrop.url}`
              ) ?? []
            }
          />
        </div>
        <div className="w-full max-w-2xl overflow-hidden relative">
          <div
            className="h-72"
            style={{
              backgroundImage: 'url(/img/caveman.gif)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'auto 30rem',
              backgroundPosition: '50% 35%',
            }}
          >
            <h1 className="text-8xl font-extrabold">404</h1>
          </div>
          <div className="px-4 mb-10">
            <p className="uppercase text-4xl mr-2 py-0.5 overflow-hidden text-ellipsis">
              Lost in{' '}
              <s className="text-primary">
                <span className="text-primary-content">Space</span>
              </s>{' '}
              <span className="lowercase">
                <PathName />
              </span>
            </p>
            <p>Hmm, looks like that page doesn&apos;t exist.</p>
          </div>
          <button
            className="text-lg font-bold btn btn-sm btn-primary"
            onClick={() => {
              router.back();
            }}
          >
            Let&apos;s Rewind
            <BackwardIcon className="size-5" />
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
