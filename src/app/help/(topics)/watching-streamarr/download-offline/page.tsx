'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { ArrowDownCircleIcon } from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import PlexLogo from '@app/assets/services/plex_dark.svg';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="downloadplex">
        <FormattedMessage
          id="help.downloadOffline.downloadPlexTitle"
          defaultMessage="How to download {plexLogo}:"
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadPlexStep1"
            defaultMessage="Open the app store on your supported device"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadPlexStep2"
            defaultMessage="Search for {plexLogo} under entertainment"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadPlexStep3"
            defaultMessage="Install the application"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadPlexStep4"
            defaultMessage="Log into the {plexLogo} app with your {appTitle} registered account"
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
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadPlexTip1"
            defaultMessage="You can view the list of supported devices and their apps by visiting {link}"
            values={{
              link: (
                <a
                  className="link-accent font-extrabold"
                  href="https://www.plex.tv/media-server-downloads/#plex-app"
                >
                  <FormattedMessage
                    id="help.downloadOffline.plexAppsDevices"
                    defaultMessage="Plex Apps & Devices"
                  />
                </a>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadPlexTip2"
            defaultMessage="You are required to connect your device and {plexLogo} to the same account registered with {appTitle}"
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
            id="help.downloadOffline.downloadPlexTip3"
            defaultMessage="{appTitle} is not responsible for the {plexLogo} app or any issues that may arise from use"
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
      </ul>
      <p className="mb-16">
        <FormattedMessage
          id="help.downloadOffline.downloadPlexBest"
          defaultMessage="For the best results and playback we recommend downloading the latest version of the {plexLogo} app."
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <div className="mt-5 font-extrabold" id="downloadmedia">
        <FormattedMessage
          id="help.downloadOffline.downloadMediaTitle"
          defaultMessage="How to download media:"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaStep1"
            defaultMessage="Open and login to the {plexLogo} app on your supported device"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaStep2"
            defaultMessage="Browse to the individual media item you wish to download"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaStep3"
            defaultMessage="Depending on the device, locate the download icon or menu option"
          />
        </li>
        <li className="flex flex-wrap place-items-center">
          <FormattedMessage
            id="help.downloadOffline.downloadMediaStep4"
            defaultMessage="On most devices you will see an {icon} icon"
            values={{ icon: <ArrowDownCircleIcon className="w-5 h-5 mx-1" /> }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaStep5"
            defaultMessage="Wait for the media to be queued and downloaded"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaTip1"
            defaultMessage="You cannot currently download media on {appDomain} or on the {appTitle} app."
            values={{
              appDomain: currentSettings.applicationTitle.toLowerCase(),
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaTip2"
            defaultMessage="To download on PC or MAC, please ensure you are using the {plexLogo} for Windows/MAC and not Plex HTPC."
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.downloadMediaTip3"
            defaultMessage="{appTitle} content can only be downloaded while online and connected to the internet"
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
          id="help.downloadOffline.downloadMediaNote"
          defaultMessage="An active network connection is required to access and download content. Download speeds are dependant on the device, version and network connectivity status."
        />
      </p>
      <div className="font-extrabold" id="watchoffline">
        <FormattedMessage
          id="help.downloadOffline.watchOfflineTitle"
          defaultMessage="How to watch offline:"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineStep1"
            defaultMessage="When no longer connected to the internet, open the {plexLogo} app on your supported device"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineStep2"
            defaultMessage="Browse to the Downloads section via the menu"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineStep3"
            defaultMessage="Locate the content previously downloaded"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineStep4"
            defaultMessage="Select play and enjoy your content"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineTip1"
            defaultMessage="Some media can take longer to complete downloading, please ensure success before taking offline"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineTip2"
            defaultMessage="If your media is not listed in the downloads section, your media is no longer available for playback"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadOffline.watchOfflineTip3"
            defaultMessage="Media can be downloaded more then once but not more then one device at a time."
          />
        </li>
      </ul>
      <p className="">
        <FormattedMessage
          id="help.downloadOffline.watchOfflineNote"
          defaultMessage='{plexLogo} may occasionally require network "check in" for continued playback offline.'
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
    </>
  );
};

const anchors = [
  { href: '#downloadplex', title: 'Download Plex' },
  { href: '#downloadmedia', title: 'Download Media' },
  { href: '#watchoffline', title: 'Watch Offline' },
];

const DownloadOffline = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/download-offline"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.downloadOffline.breadcrumb', defaultMessage: 'How can I watch {appTitle} offline?' }, { appTitle: currentSettings.applicationTitle })}`}
      />
      <HelpCard
        heading={intl.formatMessage(
          {
            id: 'help.downloadOffline.heading',
            defaultMessage: 'How can I watch {appTitle} offline?',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        subheading={intl.formatMessage(
          {
            id: 'help.downloadOffline.subheading',
            defaultMessage:
              'You can use the {plexLogo} app to download {appTitle} content for streaming offline on some supported devices such as Laptops, tablets and Mobile.',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }
        )}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default DownloadOffline;
