import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

function Watching() {
  const { currentSettings } = useSettings();

  const features: { label: ReactNode; hidden?: boolean }[] = [
    {
      label: (
        <FormattedMessage
          id="index.watching.watchTogether"
          defaultMessage="Host virtual movie nights with Watch Together. Pause, rewind and react with your friends. Both users must be active members."
        />
      ),
    },
    {
      label: (
        <FormattedMessage
          id="index.watching.download"
          defaultMessage="Download any movie or series and watch on-the-go. *"
        />
      ),
    },
    {
      label: (
        <FormattedMessage
          id="index.watching.limitExperience"
          defaultMessage="Limit your experience to {appTitle} or leverage all Plex has to offer."
          values={{
            appTitle: (
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      ),
    },
    {
      label: (
        <FormattedMessage
          id="index.watching.quality"
          defaultMessage="An ever-growing range of titles in 720p/1080p/4K and Dolby Atmos sound on compatible devices."
        />
      ),
    },
    {
      label: (
        <FormattedMessage
          id="index.watching.requestSeerr"
          defaultMessage="Request anything new, anywhere on the go with the Seerr app."
        />
      ),
      hidden: !currentSettings.seerrEnabled,
    },
    {
      label: (
        <FormattedMessage
          id="index.watching.inviteFriends"
          defaultMessage="Invite some of your closest friends to join the fun."
        />
      ),
      hidden: !currentSettings.enableSignUp,
    },
  ];

  return (
    <section id="watching" className="min-h-lvh place-content-center py-16">
      <div className="container lg:flex flex-row place-items-center mx-auto px-5">
        <div className="mx-auto md:p-10 w-4/5">
          <Image
            src="/devices-to-watch.png"
            className="mx-auto h-auto w-auto"
            alt={`Watching ${currentSettings.applicationTitle}`}
            loading="lazy"
            width={600}
            height={400}
          />
        </div>
        <div>
          <p className="font-extrabold tracking-wide mb-3 mt-2 text-center lg:text-start text-3xl">
            <FormattedMessage
              id="index.watching.title"
              defaultMessage="Watch the way you want"
            />
          </p>
          <ul className="list-disc list-outside ps-5">
            {features
              .filter((f) => !f.hidden)
              .map((f, i) => (
                <li key={i} className="mb-4">
                  {f.label}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Watching;
