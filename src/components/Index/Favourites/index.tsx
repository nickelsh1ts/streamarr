import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

const providers = [
  { src: '/img/netflix.png', alt: 'Netflix' },
  { src: '/img/disneyplus.png', alt: 'Disney+' },
  { src: '/img/primevideo.png', alt: 'Prime Video' },
  { src: '/img/appletv.png', alt: 'Apple TV+' },
  { src: '/img/hulu.png', alt: 'Hulu' },
  { src: '/img/hbomax.png', alt: 'HBO Max' },
  { src: '/img/paramountplus.png', alt: 'Paramount+' },
  { src: '/img/peacock.png', alt: 'Peacock' },
  { src: '/img/evenmore.png', alt: 'Even More' },
];

function Favourites() {
  const { currentSettings } = useSettings();

  return (
    <section id="favs" className="min-h-lvh place-content-center py-16">
      <div className="mx-auto px-5 text-center text-light">
        <p className="p-2 text-4xl font-extrabold">
          <FormattedMessage
            id="index.favourites.title"
            defaultMessage="{appTitle} has all your favourites in one place"
            values={{
              appTitle: (
                <span className="text-primary">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </p>
        <p className="text-lg py-4">
          <FormattedMessage
            id="index.favourites.subtitle"
            defaultMessage="An ever evolving collection of the world's most beloved movies and TV shows."
          />
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 lg:mx-5">
          {providers.map((provider) => (
            <Image
              key={provider.src}
              alt={provider.alt}
              src={provider.src}
              className="h-auto w-2/5 md:w-1/4"
              width={520}
              height={280}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Favourites;
