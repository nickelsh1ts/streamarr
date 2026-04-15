'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage, useIntl } from 'react-intl';
import PlexLogo from '@app/assets/services/plex_dark.svg';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="chromecast">
        <FormattedMessage
          id="help.watchOnTv.chromecastTitle"
          defaultMessage="How to Chromecast:"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastStep1"
            defaultMessage="Open the {plexLogo} or {appTitle} app"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastStep2"
            defaultMessage="Tap the Cast icon at the top of the screen"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastStep3"
            defaultMessage="Select the content you wish to view and tap Play"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastStep4"
            defaultMessage="Choose the device you wish to stream to"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastStep5"
            defaultMessage="The app will now be cast to your TV. The Cast icon will change colour, letting you know you're connected."
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastStep6"
            defaultMessage="The content playing on your device will now show on your TV"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.watchOnTv.chromecastTroubleshooting"
          defaultMessage="Chromecast troubleshooting:"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastTip1"
            defaultMessage="Ensure the Google Home app is installed on your mobile device. It's available on both the iTunes Store and Google Play Store"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastTip2"
            defaultMessage="Ensure the Chromecast device is connected to your TV"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.chromecastTip3"
            defaultMessage="Ensure the mobile device with {appTitle} and the Chromecast device are both connected to the same Wi-Fi network"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
      </ul>
      <p className="mb-16">
        <FormattedMessage
          id="help.watchOnTv.chromecastBest"
          defaultMessage="For the best experience, including 4k content, we recommend the latest generation model"
        />
      </p>
      <div className="font-extrabold" id="airplay">
        <FormattedMessage
          id="help.watchOnTv.airplayTitle"
          defaultMessage="How to use Apple AirPlay"
        />
      </div>
      <ul className="list list-decimal ms-10 my-4">
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayStep1"
            defaultMessage="Open the {plexLogo} or {appTitle} app"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayStep2"
            defaultMessage="Tap the Airplay icon at the top of the screen"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayStep3"
            defaultMessage="Select the content you wish to view and tap Play"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayStep4"
            defaultMessage="Choose the Apple TV you wish to stream to"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayStep5"
            defaultMessage="The app will now be cast via Airplay to your TV. The Airplay icon will change colour, letting you know you're connected."
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayStep6"
            defaultMessage="The content playing on your device will now show on your TV"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.watchOnTv.airplayTroubleshooting"
          defaultMessage="Apple AirPlay troubleshooting:"
        />
      </p>
      <ul className="list list-disc ms-10 my-4">
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayTip1"
            defaultMessage="Ensure the Apple TV is connected to your TV"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.airplayTip2"
            defaultMessage="Ensure the iOS device with {appTitle} and the Apple TV are both connected to the same Wi-Fi network"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
      </ul>
      <p className="mb-16">
        <FormattedMessage
          id="help.watchOnTv.airplayBest"
          defaultMessage="For the best experience, including 4k content, we recommend the latest AppleTV model"
        />
      </p>
      <p className="font-extrabold" id="plexapp">
        <FormattedMessage
          id="help.watchOnTv.plexAppTitle"
          defaultMessage="How to use the {plexLogo} app:"
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <ul className="list list-decimal ms-10 my-4">
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexStep1"
            defaultMessage="Open the {plexLogo} app on your device"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexStep2"
            defaultMessage="Login if not already"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexStep3"
            defaultMessage="Browse to the desired library"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexStep4"
            defaultMessage="Select the content you wish to view and tap Play"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.watchOnTv.plexTroubleshooting"
          defaultMessage="{plexLogo} Troubleshooting:"
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <ul className="list list-disc ms-10 my-4">
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexTip1"
            defaultMessage="Ensure the device with {plexLogo} is powered on and connected to Wi-Fi"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexTip2"
            defaultMessage="Restart the device with {plexLogo}"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.watchOnTv.plexTip3"
            defaultMessage="Reset and clear the cache of the {plexLogo} app"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
      </ul>
      <p className="">
        <FormattedMessage
          id="help.watchOnTv.plexBest"
          defaultMessage="For the best experience, including 4k content, we recommend the latest version of {plexLogo}"
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
    </>
  );
};

const anchors = [
  { href: '#chromecast', title: 'Chromecast' },
  { href: '#airplay', title: 'Apple AirPlay' },
  { href: '#plexapp', title: 'Plex App' },
];

const WatchOnTV = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/watch-on-tv"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage(
          {
            id: 'help.watching.breadcrumb',
            defaultMessage: 'Watching {appTitle}',
          },
          {
            appTitle: currentSettings.applicationTitle,
          }
        )},${intl.formatMessage(
          {
            id: 'help.watchOnTv.breadcrumb',
            defaultMessage: 'How can I watch {appTitle} on my TV?',
          },
          {
            appTitle: currentSettings.applicationTitle,
          }
        )}`}
      />
      <HelpCard
        heading={
          <FormattedMessage
            id="help.watchOnTv.heading"
            defaultMessage="How can I watch {appTitle} on my TV?"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        }
        subheading={
          <FormattedMessage
            id="help.watchOnTv.subheading"
            defaultMessage="You can use Chromecast or Apple AirPlay to wirelessly stream {appTitle} content from your Android or iOS mobile device to your TV or play directly on some supported devices such as Apple or Google TV with the Plex app"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        }
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default WatchOnTV;
