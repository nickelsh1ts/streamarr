import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';

const HelpContent = () => {
  return (
    <>
      <div className="mt-5 font-extrabold" id="chromecast">
        How to Chromecast:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>Open the Plex or Streamarr app</li>
        <li>Tap the Cast icon at the top of the screen</li>
        <li>Select the content you wish to view and tap Play</li>
        <li>Choose the device you wish to stream to</li>
        <li>
          The app will now be cast to your TV. The Cast icon will change colour,
          letting you know you’re connected.
        </li>
        <li>The content playing on your device will now show on your TV</li>
      </ul>
      <p className="italic text-sm my-4">Chromecast troubleshooting:</p>
        <ul className="list list-disc ms-14 my-4">
          <li>
            Ensure the Google Home app is installed on your mobile device. It’s
            available on both the iTunes Store and Google Play Store
          </li>
          <li>Ensure the Chromecast device is connected to your TV</li>
          <li>
            Ensure the mobile device with Streamarr and the Chromecast device
            are both connected to the same Wi-Fi network
          </li>
        </ul>
        <p className='mb-16'>For the best experience, including 4k content, we recommend the latest
        generation model</p>
      <div className="font-extrabold" id="airplay">
        How to use Apple AirPlay
      </div>
        <ul className="list list-decimal ms-10 my-4">
          <li>Open the Plex or Streamarr app</li>
          <li>Tap the Airplay icon at the top of the screen</li>
          <li>Select the content you wish to view and tap Play</li>
          <li>Choose the Apple TV you wish to stream to</li>
          <li>
            The app will now be cast via Airplay to your TV. The Airplay icon
            will change colour, letting you know you’re connected.
          </li>
          <li>The content playing on your device will now show on your TV</li>
        </ul>
        <p className="italic text-sm my-4">Apple AirPlay troubleshooting:</p>
        <ul className="list list-disc ms-10 my-4">
          <li>Ensure the Apple TV is connected to your TV</li>
          <li>
            Ensure the iOS device with Streamarr and the Apple TV are both
            connected to the same Wi-Fi network
          </li>
        </ul>
        <p className='mb-16'>For the best experience, including 4k content, we recommend the latest
        AppleTV model</p>
      <p className="font-extrabold" id="plexapp">How to use the Plex app:
      </p>
      <ul className="list list-decimal ms-10 my-4">
        <li>Open the Plex app on your device</li>
        <li>Login if not already</li>
        <li>Browse to the desired library</li>
        <li>Select the content you wish to view and tap Play</li>
      </ul>
      <p className="italic text-sm my-4">Plex Troubleshooting:</p>
      <ul className="list list-disc ms-10 my-4">
        <li>
          Ensure the device with Plex is powered on and connected to Wi-Fi
        </li>
        <li>Restart the device with Plex</li>
        <li>Reset and clear the cache of the Plex app</li>
      </ul>
      <p className=''>For the best experience, including 4k content, we recommend the latest
      version of Plex</p>
    </>
  );
};

const anchors = [
  {
    href: '#chromecast',
    title: 'Chromecast',
  },
  {
    href: '#airplay',
    title: 'Apple AirPlay',
  },
  {
    href: '#plexapp',
    title: 'Plex App',
  },
];

const WatchOnTV = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/watch-on-tv"
        homeElement={'Help Centre'}
        names="Watching Streamarr,How can I watch Streamarr on my TV?"
      />
      <HelpCard
        heading="How can I watch Streamarr on my TV?"
        subheading="You can use Chromecast or Apple AirPlay to wirelessly stream Streamarr content from your Android or iOS mobile device to your TV or play directly on some supported devices such as Apple or Google TV with the Plex app"
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default WatchOnTV;
