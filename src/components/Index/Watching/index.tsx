import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';

function Watching() {
  const { currentSettings } = useSettings();

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
            Watch the way you want
          </p>
          <ul className="list-disc list-outside ps-5">
            <li className="mb-4">
              Host virtual movie nights with Watch Together. Pause, rewind and
              react with your friends. Both users must be active members.
            </li>
            <li className="mb-4">
              Download any movie or series and watch on-the-go. *
            </li>
            <li className="mb-4">
              Limit your experience to{' '}
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>{' '}
              or leverage all Plex has to offer.
            </li>
            <li className="mb-4">
              An ever-growing range of titles in 720p/1080p/4K and Dolby Atmos
              sound on compatible devices.
            </li>
            <li className="mb-4">
              Request anything new, anywhere on the go with the Overseerr app.
            </li>
            <li className="mb-4">
              Invite some of your closest friends to join the fun.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Watching;
