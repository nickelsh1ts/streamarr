'use client';
import Button from '@app/components/Common/Button';
import PathName from '@app/components/Common/PathName';
import Footer from '@app/components/Layout/Footer';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <div className="text-center min-h-[calc(100dvh-4rem)] grid place-items-center relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <img
            title=""
            alt=""
            style={{ objectFit: 'cover' }}
            className="h-full w-full"
            src="/img/people-cinema-watching.jpg"
          />
          <div className="absolute inset-0 bg-brand-dark/60" />
        </div>
        <div className="w-full max-w-4xl relative px-4 overflow-hidden">
          <div className="h-full w-full justify-items-center mb-4">
            <img alt="" src="/img/404-chair.png" className="" />
            {/* <img alt="" src="/img/404-robot-yellow.png" className=" top-9" /> */}
          </div>
          <div className="px-4 mb-10">
            <p className="uppercase text-4xl mr-2 py-0.5 overflow-hidden text-ellipsis font-extralight">
              Page{' '}
              <s className="text-primary">
                <span className="text-primary-content font-bold">
                  Not found
                </span>
              </s>{' '}
            </p>
            <p className="lowercase text-3xl overflow-hidden text-ellipsis">
              {PathName()}
            </p>
          </div>
          <p className="text-lg font-bold">
            There are places out there you can&apos;t find on any map.
            They&apos;re not gone, they&apos;re just lost.
          </p>
          <p> (Nathan Drake - Uncharted, 2022)</p>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4 justify-center items-center">
            <div className="flex h-auto justify-center">
              <Button
                className="uppercase text-xl tracking-wider"
                onClick={() => router.back()}
              >
                <span className="mx-4">Go back</span>
              </Button>
            </div>
            <div className="flex h-auto justify-center">
              <Button
                className="uppercase text-xl tracking-wider"
                onClick={() => router.push('/')}
              >
                <span className="mx-4">Home</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
