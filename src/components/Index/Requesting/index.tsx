import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

function Requesting() {
  const { currentSettings } = useSettings();

  return (
    <section id="requesting" className="min-h-lvh place-content-center py-16">
      <div className="container mx-auto place-items-center p-2 lg:flex lg:flex-row-reverse">
        <div className="text-center lg:text-start">
          <p className="mt-2 mb-3 flex flex-wrap place-content-center text-3xl font-bold lg:place-content-start">
            <FormattedMessage
              id="index.requesting.introducing"
              defaultMessage="Introducing"
            />
            <Image
              className="ms-3 h-auto w-40"
              src="/external/seerr-logo_full.svg"
              alt="Seerr"
              width={160}
              height={40}
            />
          </p>
          <p className="mb-0 text-lg">
            <FormattedMessage
              id="index.requesting.description"
              defaultMessage="Request almost any Movie or TV Show and watch it directly on {appTitle} in no time with Seerr. Enjoy Seerr as part of your {appTitle} membership."
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </p>
          <p className="text-neutral mt-0 mb-4">
            <FormattedMessage
              id="index.requesting.limitsApply"
              defaultMessage="Limits apply."
            />
            {currentSettings.enableHelpCentre && (
              <>
                {' '}
                <FormattedMessage
                  id="index.requesting.helpCentre"
                  defaultMessage="Please see the {helpLink} for more."
                  values={{
                    helpLink: (
                      <Link
                        className="link-accent capitalize"
                        href="/help/watching-streamarr/requesting"
                      >
                        <FormattedMessage
                          id="index.requesting.helpCentreLink"
                          defaultMessage="help centre"
                        />
                      </Link>
                    ),
                  }}
                />
              </>
            )}
          </p>
        </div>
        <div className="w-4/5">
          <Image
            src="/request-promo.png"
            className="mx-auto h-auto w-4/5"
            alt="Seerr promo"
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
