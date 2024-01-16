import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';

const WatchOnTV = () => {
  const settings = useSettings();
  const messages = {
    watchontv: `Watch ${settings.currentSettings.applicationTitle} on your TV`,
  };

  return (
    <>
      <PageTitle title={messages.watchontv} />
      <HelpPages>
        <main className="mx-md-5 text-dark mx-2 mt-4">
          <div className="border-1 border-purple rounded-3 col col-xl-7 container border p-5 shadow shadow-lg">
            <h3>
              How can I watch {settings.currentSettings.applicationTitle} on my
              TV?
            </h3>
            <p>
              You can use Chromecast or Apple AirPlay to wirelessly stream{' '}
              {settings.currentSettings.applicationTitle} content from your
              Android or iOS mobile device to your TV or play directly on some
              supported devices such as Apple or Google TV with the Plex app
            </p>
            <div className="">
              <a
                className="link-purple text-decoration-none"
                href="#chromecast"
                title="Chromecast"
              >
                Chromecast
              </a>
              <br />
              <a
                className="link-purple text-decoration-none"
                href="#airplay"
                title="Apple AirPlay"
              >
                Apple AirPlay
              </a>
              <br />
              <a
                className="link-purple text-decoration-none"
                href="#plexapp"
                title="Plex App"
              >
                Plex App
              </a>
            </div>
            <p className="mt-5">
              <strong id="chromecast">How to Chromecast:</strong>
            </p>
            <ol className="ms-4">
              <li>
                Open the Plex or {settings.currentSettings.applicationTitle} app
              </li>
              <li>Tap the Cast icon at the top of the screen</li>
              <li>Select the content you wish to view and tap Play</li>
              <li>Choose the device you wish to stream to</li>
              <li>
                The app will now be cast to your TV. The Cast icon will change
                colour, letting you know you&apos;re connected.
              </li>
              <li>
                The content playing on your device will now show on your TV
              </li>
            </ol>
            <p className="fst-italic">Chromecast troubleshooting:</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>
                  Ensure the Google Home app is installed on your mobile device.
                  It&apos;s available on both the iTunes Store and Google Play
                  Store
                </li>
                <li>Ensure the Chromecast device is connected to your TV</li>
                <li>
                  Ensure the mobile device with{' '}
                  {settings.currentSettings.applicationTitle} and the Chromecast
                  device are both connected to the same Wi-Fi network
                </li>
              </ul>
              For the best experience, including 4k content, we recommend the
              latest generation model
            </div>
            <p className="">
              <strong id="airplay">How to use Apple AirPlay</strong>
            </p>
            <div className="">
              <ol className="ms-4">
                <li>
                  Open the Plex or {settings.currentSettings.applicationTitle}{' '}
                  app
                </li>
                <li>Tap the Airplay icon at the top of the screen</li>
                <li>Select the content you wish to view and tap Play</li>
                <li>Choose the Apple TV you wish to stream to</li>
                <li>
                  The app will now be cast via Airplay to your TV. The Airplay
                  icon will change colour, letting you know you&apos;re
                  connected.
                </li>
                <li>
                  The content playing on your device will now show on your TV
                </li>
              </ol>
            </div>
            <p className="fst-italic">Apple AirPlay troubleshooting:</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>Ensure the Apple TV is connected to your TV</li>
                <li>
                  Ensure the iOS device with{' '}
                  {settings.currentSettings.applicationTitle} and the Apple TV
                  are both connected to the same Wi-Fi network
                </li>
              </ul>
              For the best experience, including 4k content, we recommend the
              latest AppleTV model
            </div>
            <p className="">
              <strong id="plexapp">How to use the Plex app:</strong>
            </p>
            <ol className="ms-4">
              <li>Open the Plex app on your device</li>
              <li>Login if not already</li>
              <li>Browse to the desired library</li>
              <li>Select the content you wish to view and tap Play</li>
            </ol>
            <p className="fst-italic">Plex Troubleshooting:</p>
            <ul className="ms-4">
              <li>
                Ensure the device with Plex is powered on and connected to Wi-Fi
              </li>
              <li>Restart the device with Plex</li>
              <li>Reset and clear the cache of the Plex app</li>
            </ul>
            For the best experience, including 4k content, we recommend the
            latest version of Plex
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default WatchOnTV;
