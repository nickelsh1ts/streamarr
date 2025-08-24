'use client';
import Button from '@app/components/Common/Button';
import PathName from '@app/components/Common/PathName';
import Footer from '@app/components/Layout/Footer';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

//BUG: Fix duplicate header/sidebar on nested 404 (iframes)

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <div className="text-center min-h-[calc(100dvh-4rem)] grid place-items-center relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <Image
            alt=""
            style={{ objectFit: 'cover' }}
            className="h-full w-full"
            src="/img/people-cinema-watching.jpg"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-brand-dark/60" />
        </div>
        <div className="w-full max-w-4xl relative px-4 overflow-hidden">
          <div className="h-full w-full justify-items-center mb-4">
            <Image
              alt=""
              src="/img/404-chair.png"
              width={399}
              height={378}
              className=""
            />
          </div>
          <div className="px-4 mb-10">
            <p className="uppercase text-4xl mr-2 py-0.5 overflow-hidden text-ellipsis font-extralight">
              <FormattedMessage id="notFound.page" defaultMessage="Page" />{' '}
              <s className="text-primary">
                <span className="text-primary-content font-bold">
                  <FormattedMessage
                    id="notFound.notFound"
                    defaultMessage="Not found"
                  />
                </span>
              </s>{' '}
            </p>
            <p className="lowercase text-3xl overflow-hidden text-ellipsis">
              {PathName()}
            </p>
          </div>
          <p className="text-lg font-bold">
            <FormattedMessage
              id="notFound.quote"
              defaultMessage="There are places out there you can't find on any map. They're not gone, they're just lost."
            />
          </p>
          <p> (Nathan Drake - Uncharted, 2022)</p>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4 justify-center items-center">
            <div className="flex h-auto justify-center">
              <Button
                className="uppercase text-xl tracking-wider"
                onClick={() => router.back()}
              >
                <span className="mx-4">
                  <FormattedMessage
                    id="common.goBack"
                    defaultMessage="Go back"
                  />
                </span>
              </Button>
            </div>
            <div className="flex h-auto justify-center">
              <Button
                className="uppercase text-xl tracking-wider"
                onClick={() => router.push('/')}
              >
                <span className="mx-4">
                  <FormattedMessage id="common.home" defaultMessage="Home" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
