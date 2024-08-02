import Tabs from '@app/components/Common/Tabs';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import { ArrowUpOnSquareIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/solid';

const Heading = () => {
  return (
    <>
      How to download the <span className="text-primary">Streamarr</span> app
    </>
  );
};

const SubHeading = () => {
  return (
    <>
      <span className="text-primary font-bold">Streamarr</span> currently
      functions and is designed as a Progressive Web Application (PWA). Not all
      modern browser support PWAs at this time. Below you will find steps for
      the most common browsers, but you may need to refer to your browsers
      documentation if not listed.
    </>
  );
};

const anchors = [
  {
    href: '#googlechrome',
    title: 'Google Chrome',
  },
  {
    href: '#applesafari',
    title: 'Apple Safari',
  },
  {
    href: '#microsoftedge',
    title: 'Microsoft Edge',
  }
];

const ChromeTab = [
  {
    id: 'computer',
    title: 'Computer',
    content: (
      <>
        <p className="text-lg font-extrabold">Install a web app</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>On your computer, open Chrome.</li>
          <li>Browse to the streamarr website.</li>
          <li className="place-items-center">
            At the top right, select More{' '}
            <EllipsisVerticalIcon className="w-5 h-5 inline-flex" />{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Save and share</span>{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Install page as app.</span>
          </li>
          <ul className="list list-disc ms-6">
            <li className="place-items-center">
              You may also at the top right of the address bar, select Install{' '}
              <img
                className="w-5 h-5 inline-flex"
                src="//storage.googleapis.com/support-kms-prod/IXP8s7ymZF6tqtGlIECQYtQfOkZX6X9pHMsX"
                alt="downloooooad"
              />
            </li>
          </ul>
          <li>To install the web app, follow the on-screen instructions.</li>
        </ul>
        <p className="italic text-sm my-4">
          Our app includes shortcuts to different features. To find a list of
          app shortcuts, right-click the web app on the taskbar.
        </p>
        <p className="text-lg font-extrabold">Uninstall a web app</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>On your computer, open Chrome.</li>
          <li>Browse to the streamarr website.</li>
          <li className="place-items-center">
            At the top right, select More{' '}
            <EllipsisVerticalIcon className="w-5 h-5 inline-flex" />{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Uninstall Streamarr</span>{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Remove.</span>
          </li>
          <ul className="list list-disc ms-6">
            <li className="place-items-center">
              To delete app data from Chrome, select &quot;Also delete data from
              Chrome.&quot;
            </li>
          </ul>
        </ul>
        <p className="italic text-sm my-4">
          You can also manage web apps through{' '}
          <code className="text-primary font-bold">chrome://apps</code>.
        </p>
      </>
    ),
  },
  {
    id: 'android',
    title: 'Android',
    content: (
      <>
        <p className="text-lg font-extrabold">Install a web app</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>
            On your Android device, open Chrome{' '}
            <img
              className="w-5 h-5 inline-flex"
              src="//storage.googleapis.com/support-kms-prod/Y57p9LEW3v1cnw4Svh3a53DOnyRPFkiDfTDc"
              alt="chrome"
            />
            .
          </li>
          <li>Browse to the streamarr website.</li>
          <li className="place-items-center">
            On the right of the address bar, tap More{' '}
            <EllipsisVerticalIcon className="w-5 h-5 inline-flex" />{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Add to home screen</span>{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Install.</span>
          </li>
          <li>Follow the on-screen instructions.</li>
        </ul>
        <p className="italic text-sm my-4">
          Our app includes shortcuts to different features. To find a list of
          app shortcuts, right-click the web app on the taskbar.
        </p>
        <p className="text-lg font-extrabold">Uninstall a web app</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>
            On your Android device, tap{' '}
            <span className="font-bold">Settings</span>{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">Apps</span>{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" />{' '}
            <span className="font-bold">See all apps.</span>
          </li>
          <li>To remove a web app, tap the web app&apos;s icon.</li>
          <li className="place-items-center">Tap Uninstall.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'iphoneipad',
    title: 'iPhone & iPad',
    content: (
      <>
        <p className="text-lg font-extrabold">Add to home screen</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>
            On your iPhone or iPad, open Chrome{' '}
            <img
              className="w-5 h-5 inline-flex"
              src="//storage.googleapis.com/support-kms-prod/Y57p9LEW3v1cnw4Svh3a53DOnyRPFkiDfTDc"
              alt="chrome"
            />
            .
          </li>
          <li>Browse to the streamarr website.</li>
          <li className="place-items-center">
            On the right of the address bar, tap Share{' '}
            <ArrowUpOnSquareIcon className="w-4 h-4 inline-flex" />.
          </li>
          <li>
            Find and tap <span className="font-bold">Add to Home Screen</span>.
          </li>
          <li>
            Confirm or edit the website details and tap{' '}
            <span className="font-bold">Add.</span>
          </li>
        </ul>
        <p className="italic text-sm my-4">
          Our app includes shortcuts to different features. To find a list of
          app shortcuts, right-click the web app on the taskbar.
        </p>
        <p className="text-lg font-extrabold">Delete from home screen</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>On your iPhone or iPad, go to the home screen.</li>
          <li>Locate the shortcut you want to delete.</li>
          <li className="place-items-center">Touch and hold the shortcut.</li>
          <li>
            Tap <span className="font-bold">Delete Bookmark.</span>
          </li>
        </ul>
      </>
    ),
  },
];

const MicrosoftTab = [
  {
    id: 'computer',
    title: 'Computer',
    content: (
      <>
        <p className="text-lg font-extrabold">Install an app in Microsoft Edge</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>
            Open Microsoft Edge.
          </li>
          <li>Navigate to the Streamarr website.</li>
          <ul className='list list-disc ms-6'>
            <li>
              Microsoft Edge will prompt you with the possibility of installing the application on the right hands side of the address bar.
            </li>
          <li>
            Alternatively, you can install by going to the top corner of the browser and select <span className='font-bold'>Settings and more ... <ChevronRightIcon className="w-3 h-3 inline-flex" /> Apps <ChevronRightIcon className="w-3 h-3 inline-flex" /> Install this site as an app.</span>
          </li>
          </ul>
        </ul>
        <p className="italic text-sm my-4">
          Once the application is installed, it will appear under <code className='text-primary'>edge://apps.</code>
        </p>
        <p className="text-lg font-extrabold">Uninstall an app in Microsoft Edge</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>Open Microsoft Edge and go to <code className='text-primary'>edge://apps.</code></li>
          <li>Select <span className='font-bold'>Details</span> on the card of the application you want to uninstall.</li>
          <li>Scroll down and choose <span className='font-bold'>Uninstall</span>.</li>
          <li>
            Confirm if you also want to clear data from the associated origin and select <span className='font-bold'>Remove</span>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'android',
    title: 'Android',
    content: (
      <>
        <p className="text-lg font-extrabold">Install an app in Microsoft Edge on Android</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>
            On the bottom right corner, tap on the menu button denoted by three horizontal dots.
          </li>
          <li>From the menu pop-up that you get, select <span className='font-bold'>Add to home screen</span>.</li>
        </ul>
        <p className="italic text-sm my-4">
        If you set Microsoft Edge as your default browser on your Android device, it will launch on Edge; otherwise, it will launch on the other browser that is set as the default browser, which would most probably be Google Chrome on an Android device.
        </p>
      </>
    ),
  },
  {
    id: 'iphoneipad',
    title: 'iPhone & iPad',
    content: (
      <>
        <p className="text-lg font-extrabold">
          How to Add a Web App to Your Home Screen
        </p>
        <ul className="list ms-4 list-decimal my-4">
          <li>Open Edge on your iPhone or iPad.</li>
          <li className="">Navigate to the streamarr website.</li>
          <li className="place-items-center">
            Tap the Hamburger menu <Bars3Icon className='w-5 h-5 inline-flex' />.
          </li>
          <li>
           Tap the share button.
          </li>
          <li>Select <span className='font-bold'>Add to Home Screen</span> </li>
        </ul>
        <p className="text-lg font-extrabold">How to Remove a Web App from Your Home Screen</p>
        <ul className="list list-decimal ms-4 my-4">
          <li>
            Touch and hold the app on the Home Screen
          </li>
          <li>
            Tap Remove App
          </li>
          <li>
            Tap Remove from Home Screen to keep it in App Library, or tap Delete App to delete it from iPhone
          </li>
        </ul>
      </>
    ),
  },
];

const AppleTab = [
  {
    id: 'mac',
    title: 'macOS',
    content: (
      <>
        <p className="text-lg font-extrabold">How to create a web app</p>
        <ul className="list ms-4 list-decimal my-4">
          <li>
            In Safari, open the webpage that you want to use as a web app.
          </li>
          <li className="">
            From the menu bar, choose File{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" /> Add to Dock. Or
            click the Share button{' '}
            <ArrowUpOnSquareIcon className="w-5 h-5 inline-flex align-baseline" />{' '}
            in the Safari toolbar, then choose Add to Dock.
          </li>
          <li className="place-items-center">
            Type the name that you want to use for the web app, then click Add.
            The web app is saved to the Applications folder of your home folder,
            and you can open it from the Dock, Launchpad, or Spotlight.
          </li>
        </ul>
        <p className="italic text-sm my-4">Requires macOS Sonoma or later</p>
        <p className="text-lg font-extrabold">How to delete a web app</p>
        <ul className="my-4">
          <li>
            Web apps are saved to the Applications folder of your home folder.
            To delete a web app, open your home folder, such as by choosing Go{' '}
            <ChevronRightIcon className="w-3 h-3 inline-flex" /> Home from the
            menu bar in the Finder. Then open the Applications folder and drag
            the web app to the Trash.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'iphoneipad',
    title: 'iPhone & iPad',
    content: (
      <>
        <p className="text-lg font-extrabold">
          How to Add a Web App to Your Home Screen
        </p>
        <ul className="list ms-4 list-decimal my-4">
          <li>Open Safari on your iPhone or iPad.</li>
          <li className="">Navigate to the streamarr website.</li>
          <li className="place-items-center">
            Tap the Action button (often called the Share button).
          </li>
          <li>
            Scroll down the share sheet past the rows of contacts and apps, then
            select Add to Home Screen.
          </li>
          <li>Give the web app a name, then tap Add.</li>
        </ul>
        <p className="italic text-sm my-4">
          Your new web app will appear in the next available space on your
          device&apos;s home screen. If you tap it and you&apos;re kicked back
          to the standard website, force quit Safari, then launch the web app
          again.
        </p>
        <p className="text-lg font-extrabold">How to Remove a Web App from Your Home Screen</p>
        <ul className="list list-decimal ms-4 my-4">
          <li>
            Touch and hold the app on the Home Screen
          </li>
          <li>
            Tap Remove App
          </li>
          <li>
            Tap Remove from Home Screen to keep it in App Library, or tap Delete App to delete it from iPhone
          </li>
        </ul>
      </>
    ),
  },
];

const HelpContent = () => {
  return (
    <>
      <div className="mt-5 font-extrabold" id="googlechrome">
        Using Google Chrome
      </div>
      <div className="mt-5">
        <Tabs tabs={ChromeTab} />
      </div>
      <div className="mt-5 font-extrabold" id="applesafari">
        Using Apple Safari
      </div>
      <div className="mt-5">
        <Tabs tabs={AppleTab} />
      </div>
      <div className="mt-5 font-extrabold" id="microsoftedge">
        Using Microsoft Edge
      </div>
      <div className="mt-5">
        <Tabs tabs={MicrosoftTab} />
      </div>
    </>
  );
};

const DownloadStreamarr = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/download-streamarr"
        homeElement={'Help Centre'}
        names="Getting Started,How to download the Streamarr app"
      />
      <HelpCard
        heading={<Heading />}
        subheading={<SubHeading />}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default DownloadStreamarr;
