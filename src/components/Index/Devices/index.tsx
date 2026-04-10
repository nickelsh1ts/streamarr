'use client';
import CachedImage from '@app/components/Common/CachedImage';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

const deviceCategories: {
  imageSrc: string;
  title: ReactNode;
  alt: string;
  devices: string[];
}[] = [
  {
    imageSrc:
      'https://cnbl-cdn.bamgrid.com/assets/00fb59319fa715222100d8a84d11bc7e23a42970b4f413c9e85166d0cfba9346/original',
    alt: 'TV',
    title: <FormattedMessage id="devices.tv" defaultMessage="TV" />,
    devices: [
      'Amazon Fire TV',
      'Android TV',
      'Apple TV',
      'Chromecast',
      'Roku',
      'Samsung',
    ],
  },
  {
    imageSrc:
      'https://cnbl-cdn.bamgrid.com/assets/d73b7c534afd2af2a454dbd47bd6c766c70e334ce8137084e9cd25c2644dd267/original',
    alt: 'Computer',
    title: <FormattedMessage id="devices.computer" defaultMessage="Computer" />,
    devices: ['Windows PC', 'MacOS', 'Chrome OS'],
  },
  {
    imageSrc:
      'https://cnbl-cdn.bamgrid.com/assets/66475056e769443ef9a491a48dfa44059c8964890ae9ef7c4f69f322693c59d8/original',
    alt: 'Mobile & Tablet',
    title: (
      <FormattedMessage
        id="devices.mobileTablet"
        defaultMessage="Mobile & Tablet"
      />
    ),
    devices: [
      'Android Phones & Tablets',
      'iPhones & iPads',
      'Amazon Fire Tablets',
    ],
  },
  {
    imageSrc:
      'https://cnbl-cdn.bamgrid.com/assets/51b639d2ebe97ee175975c29d42a90b0e043713856db8e5d6d9fb87b2b3a48c0/original',
    alt: 'Game Consoles',
    title: (
      <FormattedMessage
        id="devices.gameConsoles"
        defaultMessage="Game Consoles"
      />
    ),
    devices: ['Xbox One', 'Xbox X/S', 'Playstation 4/5'],
  },
];

function Devices() {
  return (
    <section id="devices" className="min-h-lvh place-content-center py-16">
      <div className="container mx-auto text-center">
        <p className="text-3xl font-extrabold pb-10 px-5">
          <FormattedMessage
            id="devices.availableOnDevices"
            defaultMessage="Available on all your favourite devices"
          />
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-5">
          {deviceCategories.map((category) => (
            <div key={category.alt}>
              <CachedImage
                alt={category.alt}
                src={category.imageSrc}
                className="h-auto w-auto"
                width={200}
                height={120}
              />
              <p className="py-6 text-2xl font-extrabold">{category.title}</p>
              {category.devices.map((device) => (
                <p key={device}>{device}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Devices;
