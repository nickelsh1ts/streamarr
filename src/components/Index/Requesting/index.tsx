import useSettings from '@app/hooks/useSettings';
import Link from 'next/link';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

function Requesting() {
  const { currentSettings } = useSettings();

  return (
    <section id="requesting" className="min-h-lvh place-content-center py-16">
      <div className="container p-2 lg:flex lg:flex-row-reverse place-items-center mx-auto">
        <div className="text-center lg:text-start">
          <p className="font-bold place-content-center lg:place-content-start text-3xl mb-3 mt-2 flex flex-wrap">
            <FormattedMessage
              id="index.requesting.introducing"
              defaultMessage="Introducing"
            />
            <Image
              className="h-auto w-40 ms-3"
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
            className="h-auto w-4/5 mx-auto"
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
