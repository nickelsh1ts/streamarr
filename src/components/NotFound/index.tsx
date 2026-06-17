'use client';
import Button from '@app/components/Common/Button';
import PathName from '@app/components/Common/PathName';
import Footer from '@app/components/Layout/Footer';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <div className="relative grid min-h-[calc(100dvh-4rem)] place-items-center text-center">
        <div className="absolute top-0 right-0 bottom-0 left-0">
          <Image
            alt=""
            style={{ objectFit: 'cover' }}
            className="h-full w-full"
            src="/img/people-cinema-watching.jpg"
            width={1920}
            height={1080}
          />
          <div className="bg-brand-dark/60 absolute inset-0" />
        </div>
        <div className="relative w-full max-w-4xl overflow-hidden px-4">
          <div className="mb-4 h-full w-full justify-items-center">
            <Image
              alt=""
              src="/img/404-chair.png"
              width={399}
              height={378}
              className=""
            />
          </div>
          <div className="mb-10 px-4">
            <p className="mr-2 overflow-hidden py-0.5 text-4xl font-extralight text-ellipsis uppercase">
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
            <p className="overflow-hidden text-3xl text-ellipsis lowercase">
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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <div className="flex h-auto justify-center">
              <Button
                className="text-xl tracking-wider uppercase"
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
                className="text-xl tracking-wider uppercase"
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
