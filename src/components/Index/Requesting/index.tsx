import Link from 'next/link';

function Requesting() {
  return (
    <section id="requesting" className="min-h-lvh place-content-center py-16">
      <div className="container p-2 lg:flex lg:flex-row-reverse place-items-center mx-auto">
        <div className="text-center lg:text-start">
          <p className="font-bold place-content-center lg:place-content-start text-3xl mb-3 mt-2 flex flex-wrap">
            Introducing
            <img
              className="h-auto w-48 ms-3"
              src="/external/os-logo_full.svg"
              alt="overseerr"
            />
          </p>
          <p className="mb-0 text-lg">
            Request almost any Movie or TV Show and watch it directly on
            <span className="text-primary ms-1">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </span>{' '}
            in no time with Overseerr. Enjoy Overseerr as part of your
            <span className="text-primary ms-1">
              {process.env.NEXT_PUBLIC_APP_NAME}
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
        <div className="">
          <img
            src="/request-promo.png"
            className="h-auto w-4/5 mx-auto"
            alt="overseer promo"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export default Requesting;
