import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';

const DownloadOffline = () => {
  const settings = useSettings();
  const messages = {
    downloadoffline: 'Download Offline',
  };

  return (
    <>
      <PageTitle title={messages.downloadoffline} />
      <HelpPages>
        <main className="mx-md-5 text-dark mx-2 my-4">
          <div className="border-1 border-purple rounded-3 col col-xl-7 container border p-5 shadow shadow-lg">
            <h3>
              How can I watch {settings.currentSettings.applicationTitle}{' '}
              offline?
            </h3>
            <p>
              You can use the Plex app to download{' '}
              {settings.currentSettings.applicationTitle} content for streaming
              offline on some supported devices such as Laptops, tablets and
              Mobile.
            </p>
            <p className="">
              <a
                className="link-purple text-decoration-none"
                href="#downloadplex"
                title="Download Plex"
              >
                Download Plex
              </a>
              <br />
              <a
                className="link-purple text-decoration-none"
                href="#downloadmedia"
                title="Download Media"
              >
                Download Media
              </a>
              <br />
              <a
                className="link-purple text-decoration-none"
                href="#watchoffline"
                title="Watch Offline"
              >
                Watch Offline
              </a>
            </p>
            <p className="mt-5">
              <strong id="downloadplex">How to download Plex:</strong>
            </p>
            <ol className="ms-4">
              <li>Open the app store on your supported device</li>
              <li>Search for Plex under entertainment</li>
              <li>Install the application</li>
              <li>
                Log into the Plex app with your{' '}
                {settings.currentSettings.applicationTitle} registered account
              </li>
            </ol>
            <p className="fst-italic">Important Information</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>
                  You can view the list of supported devices and their apps by
                  visiting{' '}
                  <a
                    className="link-warning text-decoration-none"
                    href="https://www.plex.tv/media-server-downloads/#plex-app"
                  >
                    Plex Apps & Devices
                  </a>
                </li>
                <li>
                  You are required to connect your device and Plex to the same
                  account registered with{' '}
                  {settings.currentSettings.applicationTitle}
                </li>
                <li>
                  {settings.currentSettings.applicationTitle} is not resposible
                  for the Plex app or any issues that may arise from use
                </li>
              </ul>
              For the best results and playback we reccomend downloading the
              latest version of the Plex app.
            </div>
            <p className="mt-5">
              <strong id="downloadmedia">How to download media:</strong>
            </p>
            <ol className="ms-4">
              <li>Open and login to the Plex app on your supported device</li>
              <li>Browse to the individual media item you wish to download</li>
              <li>
                Depending on the device, locate the download icon or menu option
              </li>
              <li>
                On most devices you will see a{' '}
                <i className="fa-solid fa-circle-arrow-down"></i> icon
              </li>
              <li>Wait for the media to be queued and downloaded</li>
            </ol>
            <p className="fst-italic">Important Information</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>
                  You cannot currenly download media on NickflixTX.com or on the{' '}
                  {settings.currentSettings.applicationTitle} app.
                </li>
                <li>
                  To download on PC or MAC, please ensure you are using the Plex
                  for Windows/MAC and not Plex HTPC.
                </li>
                <li>
                  {settings.currentSettings.applicationTitle} content can only
                  be downloaded while online and conected to the internet
                </li>
              </ul>
              An active network connection is required to access and download
              content. Download speeds are dependant on the device, version and
              network connectivity status.
            </div>
            <p className="mt-5">
              <strong id="watchoffline">How to watch offline:</strong>
            </p>
            <ol className="ms-4">
              <li>
                When no longer connected to the internet, open the Plex app on
                your supported device
              </li>
              <li>Browse to the Downloads section via the menu</li>
              <li>Locate the content previously downloaded</li>
              <li>Select play and enjoy your content</li>
            </ol>
            <p className="fst-italic">Important Information</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>
                  Some media can take longer to complete downloading, please
                  ensure success before taking offline
                </li>
                <li>
                  If your media is not listed in the downloads section, your
                  media is no longer available for playback
                </li>
                <li>
                  Media can be downloaded more then once but not more then one
                  device at a time.
                </li>
              </ul>
              Plex may occasionally require network &quote;check in&quote; for
              continued playback offline.
            </div>
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default DownloadOffline;
