import useSettings from '@app/hooks/useSettings';
import Link from 'next/link';
import Image from 'next/image';

function Requesting() {
  const { currentSettings } = useSettings();

  return (
    <section id="requesting" className="min-h-lvh place-content-center py-16">
      <div className="container p-2 lg:flex lg:flex-row-reverse place-items-center mx-auto">
        <div className="text-center lg:text-start">
          <p className="font-bold place-content-center lg:place-content-start text-3xl mb-3 mt-2 flex flex-wrap">
            Introducing
            <Image
              className="h-auto w-48 ms-3"
              src="/external/os-logo_full.svg"
              alt="overseerr"
              width={192}
              height={48}
            />
          </p>
          <p className="mb-0 text-lg">
            Request almost any Movie or TV Show and watch it directly on
            <span className="text-primary ms-1">
              {currentSettings.applicationTitle}
            </span>{' '}
            in no time with Overseerr. Enjoy Overseerr as part of your
            <span className="text-primary ms-1">
              {currentSettings.applicationTitle}
            </span>{' '}
            membership.
          </p>
          <p className="text-neutral mt-0 mb-4">
            Limits apply. Please see the{' '}
            <Link className="link-accent capitalize" href="/help">
              help centre
            </Link>{' '}
            for more.
          </p>
        </div>
        <div className="w-4/5">
          <Image
            src="/request-promo.png"
            className="h-auto w-4/5 mx-auto"
            alt="overseer promo"
            loading="lazy"
            width={600}
            height={400}
          />
        </div>
      </div>
    </section>
  );
}

export default Requesting;
