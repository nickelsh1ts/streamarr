import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import { ArrowDownCircleIcon } from '@heroicons/react/24/solid';

const HelpContent = () => {
  return (
    <>
      <div className="mt-5 font-extrabold" id="downloadplex">
        How to download Plex:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>Open the app store on your supported device</li>
        <li>Search for Plex under entertainment</li>
        <li>Install the application</li>
        <li>Log into the Plex app with your Streamarr registered account</li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          You can view the list of supported devices and their apps by visiting{' '}
          <a
            className="link-accent font-extrabold"
            href="https://www.plex.tv/media-server-downloads/#plex-app"
          >
            Plex Apps & Devices
          </a>
        </li>
        <li>
          You are required to connect your device and Plex to the same account
          registered with Streamarr
        </li>
        <li>
          Streamarr is not responsible for the Plex app or any issues that may
          arise from use
        </li>
      </ul>
      <p className="mb-16">
        For the best results and playback we recommend downloading the latest
        version of the Plex app.
      </p>
      <div className="mt-5 font-extrabold" id="downloadmedia">
        How to download media:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>Open and login to the Plex app on your supported device</li>
        <li>Browse to the individual media item you wish to download</li>
        <li>
          Depending on the device, locate the download icon or menu option
        </li>
        <li className="flex flex-wrap place-items-center">
          On most devices you will see an
          <ArrowDownCircleIcon className="w-5 h-5 mx-1" /> icon
        </li>
        <li>Wait for the media to be queued and downloaded</li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          You cannot currently download media on Streamarr.com or on the
          Streamarr app.
        </li>
        <li>
          To download on PC or MAC, please ensure you are using the Plex for
          Windows/MAC and not Plex HTPC.
        </li>
        <li>
          Streamarr content can only be downloaded while online and connected to
          the internet
        </li>
      </ul>
      <p className="mb-16">
        An active network connection is required to access and download content.
        Download speeds are dependant on the device, version and network
        connectivity status.
      </p>
      <div className="font-extrabold" id="watchoffline">
        How to watch offline:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          When no longer connected to the internet, open the Plex app on your
          supported device
        </li>
        <li>Browse to the Downloads section via the menu</li>
        <li>Locate the content previously downloaded</li>
        <li>Select play and enjoy your content</li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          Some media can take longer to complete downloading, please ensure
          success before taking offline
        </li>
        <li>
          If your media is not listed in the downloads section, your media is no
          longer available for playback
        </li>
        <li>
          Media can be downloaded more then once but not more then one device at
          a time.
        </li>
      </ul>
      <p className="">
        Plex may occasionally require network &quot;check in&quot; for continued
        playback offline.
      </p>
    </>
  );
};

const anchors = [
  {
    href: '#downloadplex',
    title: 'Download Plex',
  },
  {
    href: '#downloadmedia',
    title: 'Download Media',
  },
  {
    href: '#watchoffline',
    title: 'Watch Offline',
  },
];

const DownloadOffline = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/download-offline"
        homeElement={'Help Centre'}
        names="Watching Streamarr,How can I watch Streamarr offline?"
      />
      <HelpCard
        heading="How can I watch Streamarr offline?"
        subheading="You can use the Plex app to download Streamarr content for streaming offline on some supported devices such as Laptops, tablets and Mobile."
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default DownloadOffline;
