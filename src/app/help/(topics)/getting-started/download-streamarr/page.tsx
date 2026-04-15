'use client';
import CachedImage from '@app/components/Common/CachedImage';
import Tabs from '@app/components/Common/Tabs';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { ArrowUpOnSquareIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';

const Heading = () => {
  const { currentSettings } = useSettings();

  return (
    <FormattedMessage
      id="help.downloadStreamarr.heading"
      defaultMessage="How to download the {appTitle} app"
      values={{
        appTitle: (
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>
        ),
      }}
    />
  );
};

const SubHeading = () => {
  const { currentSettings } = useSettings();
  return (
    <FormattedMessage
      id="help.downloadStreamarr.subheading"
      defaultMessage="{appTitle} currently functions and is designed as a Progressive Web Application (PWA). Not all modern browser support PWAs at this time. Below you will find steps for the most common browsers, but you may need to refer to your browsers documentation if not listed."
      values={{
        appTitle: (
          <span className="text-primary font-bold">
            {currentSettings.applicationTitle}
          </span>
        ),
      }}
    />
  );
};

const anchors = [
  { href: '#googlechrome', title: 'Google Chrome' },
  { href: '#applesafari', title: 'Apple Safari' },
  { href: '#microsoftedge', title: 'Microsoft Edge' },
];

const HelpContent = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const ChromeTab = [
    {
      id: 'computer',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.computer',
        defaultMessage: 'Computer',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.installWebApp"
              defaultMessage="Install a web app"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.openComputer"
                defaultMessage="On your computer, open Chrome {chromeIcon}"
                values={{
                  chromeIcon: (
                    <CachedImage
                      className="w-5 h-5 inline-flex"
                      src="/img/chrome.svg"
                      alt="Chrome"
                      width={20}
                      height={20}
                    />
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.browseToWebsite"
                defaultMessage="Browse to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.chrome.selectMore"
                defaultMessage="At the top right, select More {moreIcon} {chevron} {saveAndShare} {chevron} {installPageAsApp}"
                values={{
                  moreIcon: (
                    <EllipsisVerticalIcon className="w-5 h-5 inline-flex" />
                  ),
                  chevron: <ChevronRightIcon className="w-3 h-3 inline-flex" />,
                  saveAndShare: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.saveAndShare"
                        defaultMessage="Save and share"
                      />
                    </span>
                  ),
                  installPageAsApp: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.installPageAsApp"
                        defaultMessage="Install page as app."
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <ul className="list list-disc ms-6">
              <li className="place-items-center">
                <FormattedMessage
                  id="help.downloadStreamarr.chrome.alsoInstall"
                  defaultMessage="You may also at the top right of the address bar, select Install {installIcon}"
                  values={{
                    installIcon: (
                      <CachedImage
                        className="w-5 h-5 inline-flex"
                        src="https://storage.googleapis.com/support-kms-prod/IXP8s7ymZF6tqtGlIECQYtQfOkZX6X9pHMsX"
                        alt="download"
                        width={20}
                        height={20}
                      />
                    ),
                  }}
                />
              </li>
            </ul>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.followInstructions"
                defaultMessage="To install the web app, follow the on-screen instructions."
              />
            </li>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.appShortcutsTip"
              defaultMessage="Our app includes shortcuts to different features. To find a list of app shortcuts, right-click the web app on the taskbar."
            />
          </p>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.uninstallWebApp"
              defaultMessage="Uninstall a web app"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.openComputerUninstall"
                defaultMessage="On your computer, open Chrome {chromeIcon}"
                values={{
                  chromeIcon: (
                    <CachedImage
                      className="w-5 h-5 inline-flex"
                      src="/img/chrome.svg"
                      alt="Chrome"
                      width={20}
                      height={20}
                    />
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.browseToWebsiteUninstall"
                defaultMessage="Browse to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.chrome.selectMoreUninstall"
                defaultMessage="At the top right, select More {moreIcon} {chevron} {uninstallApp} {chevron} {remove}"
                values={{
                  moreIcon: (
                    <EllipsisVerticalIcon className="w-5 h-5 inline-flex" />
                  ),
                  chevron: <ChevronRightIcon className="w-3 h-3 inline-flex" />,
                  uninstallApp: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.uninstallAppName"
                        defaultMessage="Uninstall {appTitle}"
                        values={{
                          appTitle: (
                            <span className="text-primary font-bold">
                              {currentSettings.applicationTitle}
                            </span>
                          ),
                        }}
                      />
                    </span>
                  ),
                  remove: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.remove"
                        defaultMessage="Remove."
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <ul className="list list-disc ms-6">
              <li className="place-items-center">
                <FormattedMessage
                  id="help.downloadStreamarr.chrome.deleteData"
                  defaultMessage='To delete app data from Chrome, select "Also delete data from Chrome."'
                />
              </li>
            </ul>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.chromeApps"
              defaultMessage="You can also manage web apps through {code}"
              values={{
                code: (
                  <code className="text-base-content font-bold">
                    chrome://apps
                  </code>
                ),
              }}
            />
          </p>
        </>
      ),
    },
    {
      id: 'android',
      title: 'Android',
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.chrome.installAndroid"
              defaultMessage="Install a web app"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.openAndroid"
                defaultMessage="On your Android device, open Chrome {chromeIcon}"
                values={{
                  chromeIcon: (
                    <CachedImage
                      className="w-5 h-5 inline-flex"
                      src="/img/chrome.svg"
                      alt="Chrome"
                      width={20}
                      height={20}
                    />
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.browseToWebsiteAndroid"
                defaultMessage="Browse to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.chrome.tapMoreAndroid"
                defaultMessage="On the right of the address bar, tap More {moreIcon} {chevron} {addToHome} {chevron2} {install}"
                values={{
                  moreIcon: (
                    <EllipsisVerticalIcon className="w-5 h-5 inline-flex" />
                  ),
                  chevron: <ChevronRightIcon className="w-3 h-3 inline-flex" />,
                  addToHome: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.addToHomeScreen"
                        defaultMessage="Add to home screen"
                      />
                    </span>
                  ),
                  chevron2: (
                    <ChevronRightIcon className="w-3 h-3 inline-flex" />
                  ),
                  install: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.install"
                        defaultMessage="Install."
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.followInstructionsAndroid"
                defaultMessage="Follow the on-screen instructions."
              />
            </li>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.appShortcutsTipAndroid"
              defaultMessage="Our app includes shortcuts to different features. To find a list of app shortcuts, right-click the web app on the taskbar."
            />
          </p>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.uninstallWebAppAndroid"
              defaultMessage="Uninstall a web app"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.androidSettings"
                defaultMessage="On your Android device, tap {settings} {chevron} {apps} {chevron} {seeAll}"
                values={{
                  settings: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.settings"
                        defaultMessage="Settings"
                      />
                    </span>
                  ),
                  chevron: <ChevronRightIcon className="w-3 h-3 inline-flex" />,
                  apps: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.apps"
                        defaultMessage="Apps"
                      />
                    </span>
                  ),
                  seeAll: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.seeAllApps"
                        defaultMessage="See all apps."
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.removeWebApp"
                defaultMessage="To remove a web app, tap the web app's icon."
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.chrome.tapUninstall"
                defaultMessage="Tap Uninstall."
              />
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'iphoneipad',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.iphoneIpad',
        defaultMessage: 'iPhone & iPad',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.addToHomeScreen"
              defaultMessage="Add to home screen"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.openIos"
                defaultMessage="On your iPhone or iPad, open Chrome {chromeIcon}"
                values={{
                  chromeIcon: (
                    <CachedImage
                      className="w-5 h-5 inline-flex"
                      src="/img/chrome.svg"
                      alt="Chrome"
                      width={20}
                      height={20}
                    />
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.browseToWebsiteIos"
                defaultMessage="Browse to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.chrome.tapShareIos"
                defaultMessage="On the right of the address bar, tap Share {shareIcon}."
                values={{
                  shareIcon: (
                    <ArrowUpOnSquareIcon className="w-4 h-4 inline-flex" />
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.addToHomeIos"
                defaultMessage="Find and tap {addToHome}."
                values={{
                  addToHome: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.addToHomeScreenLabel"
                        defaultMessage="Add to Home Screen"
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.confirmDetails"
                defaultMessage="Confirm or edit the website details and tap {add}"
                values={{
                  add: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.add"
                        defaultMessage="Add."
                      />
                    </span>
                  ),
                }}
              />
            </li>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.appShortcutsTipIos"
              defaultMessage="Our app includes shortcuts to different features. To find a list of app shortcuts, right-click the web app on the taskbar."
            />
          </p>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.deleteFromHomeScreen"
              defaultMessage="Delete from home screen"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.goToHomeScreen"
                defaultMessage="On your iPhone or iPad, go to the home screen."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.locateShortcut"
                defaultMessage="Locate the shortcut you want to delete."
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.chrome.touchAndHold"
                defaultMessage="Touch and hold the shortcut."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.chrome.tapDeleteBookmark"
                defaultMessage="Tap {deleteBookmark}"
                values={{
                  deleteBookmark: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.chrome.deleteBookmark"
                        defaultMessage="Delete Bookmark."
                      />
                    </span>
                  ),
                }}
              />
            </li>
          </ul>
        </>
      ),
    },
  ];

  const MicrosoftTab = [
    {
      id: 'computer',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.computerEdge',
        defaultMessage: 'Computer',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.installEdge"
              defaultMessage="Install an app in Microsoft Edge"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.openEdge"
                defaultMessage="Open Microsoft Edge."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.navigateToWebsiteEdge"
                defaultMessage="Navigate to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <ul className="list list-disc ms-6">
              <li>
                <FormattedMessage
                  id="help.downloadStreamarr.edge.promptInstall"
                  defaultMessage="Microsoft Edge will prompt you with the possibility of installing the application on the right hands side of the address bar."
                />
              </li>
              <li>
                <FormattedMessage
                  id="help.downloadStreamarr.edge.alternativeInstall"
                  defaultMessage="Alternatively, you can install by going to the top corner of the browser and select {settingsMore}"
                  values={{
                    settingsMore: (
                      <span className="font-bold">
                        <FormattedMessage
                          id="help.downloadStreamarr.edge.settingsPath"
                          defaultMessage="Settings and more ... {chevron} Apps {chevron2} Install this site as an app."
                          values={{
                            chevron: (
                              <ChevronRightIcon className="w-3 h-3 inline-flex" />
                            ),
                            chevron2: (
                              <ChevronRightIcon className="w-3 h-3 inline-flex" />
                            ),
                          }}
                        />
                      </span>
                    ),
                  }}
                />
              </li>
            </ul>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.edge.installedApps"
              defaultMessage="Once the application is installed, it will appear under {edgeApps}"
              values={{
                edgeApps: (
                  <code className="text-base-content">edge://apps</code>
                ),
              }}
            />
          </p>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.uninstallEdge"
              defaultMessage="Uninstall an app in Microsoft Edge"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.openEdgeApps"
                defaultMessage="Open Microsoft Edge and go to {edgeApps}"
                values={{
                  edgeApps: (
                    <code className="text-base-content">edge://apps</code>
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.selectDetails"
                defaultMessage="Select {details} on the card of the application you want to uninstall."
                values={{
                  details: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.edge.details"
                        defaultMessage="Details"
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.scrollUninstall"
                defaultMessage="Scroll down and choose {uninstall}."
                values={{
                  uninstall: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.edge.uninstall"
                        defaultMessage="Uninstall"
                      />
                    </span>
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.confirmRemove"
                defaultMessage="Confirm if you also want to clear data from the associated origin and select {remove}."
                values={{
                  remove: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.edge.remove"
                        defaultMessage="Remove"
                      />
                    </span>
                  ),
                }}
              />
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'android',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.androidEdge',
        defaultMessage: 'Android',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.installEdgeAndroid"
              defaultMessage="Install an app in Microsoft Edge on Android"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.tapMenuAndroid"
                defaultMessage="On the bottom right corner, tap on the menu button denoted by three horizontal dots."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.addToHomeAndroid"
                defaultMessage="From the menu pop-up that you get, select {addToHome}."
                values={{
                  addToHome: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.edge.addToHomeScreen"
                        defaultMessage="Add to home screen"
                      />
                    </span>
                  ),
                }}
              />
            </li>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.edge.defaultBrowserNote"
              defaultMessage="If you set Microsoft Edge as your default browser on your Android device, it will launch on Edge; otherwise, it will launch on the other browser that is set as the default browser, which would most probably be Google Chrome on an Android device."
            />
          </p>
        </>
      ),
    },
    {
      id: 'iphoneipad',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.iphoneIpadEdge',
        defaultMessage: 'iPhone & iPad',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.addWebAppEdge"
              defaultMessage="How to Add a Web App to Your Home Screen"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.openEdgeIos"
                defaultMessage="Open Edge on your iPhone or iPad."
              />
            </li>
            <li className="">
              <FormattedMessage
                id="help.downloadStreamarr.navigateToWebsiteEdgeIos"
                defaultMessage="Navigate to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.edge.tapHamburger"
                defaultMessage="Tap the Hamburger menu {menuIcon}."
                values={{
                  menuIcon: <Bars3Icon className="w-5 h-5 inline-flex" />,
                }}
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.tapShareButton"
                defaultMessage="Tap the share button."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.selectAddToHome"
                defaultMessage="Select {addToHome}"
                values={{
                  addToHome: (
                    <span className="font-bold">
                      <FormattedMessage
                        id="help.downloadStreamarr.edge.addToHomeScreenIos"
                        defaultMessage="Add to Home Screen"
                      />
                    </span>
                  ),
                }}
              />
            </li>
          </ul>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.removeWebAppEdge"
              defaultMessage="How to Remove a Web App from Your Home Screen"
            />
          </p>
          <ul className="list list-decimal ms-4 my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.touchAndHoldIos"
                defaultMessage="Touch and hold the app on the Home Screen"
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.tapRemoveAppIos"
                defaultMessage="Tap Remove App"
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.edge.removeOrDeleteIos"
                defaultMessage="Tap Remove from Home Screen to keep it in App Library, or tap Delete App to delete it from iPhone"
              />
            </li>
          </ul>
        </>
      ),
    },
  ];

  const AppleTab = [
    {
      id: 'mac',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.macos',
        defaultMessage: 'macOS',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.createWebApp"
              defaultMessage="How to create a web app"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.openWebpage"
                defaultMessage="In Safari, open the webpage that you want to use as a web app."
              />
            </li>
            <li className="">
              <FormattedMessage
                id="help.downloadStreamarr.safari.chooseFile"
                defaultMessage="From the menu bar, choose File {chevron} Add to Dock. Or click the Share button {shareIcon} in the Safari toolbar, then choose Add to Dock."
                values={{
                  chevron: <ChevronRightIcon className="w-3 h-3 inline-flex" />,
                  shareIcon: (
                    <ArrowUpOnSquareIcon className="w-5 h-5 inline-flex align-baseline" />
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.safari.typeNameAndAdd"
                defaultMessage="Type the name that you want to use for the web app, then click Add. The web app is saved to the Applications folder of your home folder, and you can open it from the Dock, Launchpad, or Spotlight."
              />
            </li>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.safari.requiresSonoma"
              defaultMessage="Requires macOS Sonoma or later"
            />
          </p>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.deleteWebApp"
              defaultMessage="How to delete a web app"
            />
          </p>
          <ul className="my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.deleteInstructions"
                defaultMessage="Web apps are saved to the Applications folder of your home folder. To delete a web app, open your home folder, such as by choosing Go {chevron} Home from the menu bar in the Finder. Then open the Applications folder and drag the web app to the Trash."
                values={{
                  chevron: <ChevronRightIcon className="w-3 h-3 inline-flex" />,
                }}
              />
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'iphoneipad',
      title: intl.formatMessage({
        id: 'help.downloadStreamarr.iphoneIpadSafari',
        defaultMessage: 'iPhone & iPad',
      }),
      content: (
        <>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.addWebAppSafari"
              defaultMessage="How to Add a Web App to Your Home Screen"
            />
          </p>
          <ul className="list ms-4 list-decimal my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.openSafariIos"
                defaultMessage="Open Safari on your iPhone or iPad."
              />
            </li>
            <li className="">
              <FormattedMessage
                id="help.downloadStreamarr.navigateToWebsiteSafari"
                defaultMessage="Navigate to the {appTitle} website."
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </li>
            <li className="place-items-center">
              <FormattedMessage
                id="help.downloadStreamarr.safari.tapActionButton"
                defaultMessage="Tap the Action button (often called the Share button)."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.scrollAddToHome"
                defaultMessage="Scroll down the share sheet past the rows of contacts and apps, then select Add to Home Screen."
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.giveNameTapAdd"
                defaultMessage="Give the web app a name, then tap Add."
              />
            </li>
          </ul>
          <p className="italic text-sm my-4">
            <FormattedMessage
              id="help.downloadStreamarr.safari.webAppTip"
              defaultMessage="Your new web app will appear in the next available space on your device's home screen. If you tap it and you're kicked back to the standard website, force quit Safari, then launch the web app again."
            />
          </p>
          <p className="text-lg font-extrabold">
            <FormattedMessage
              id="help.downloadStreamarr.removeWebAppSafari"
              defaultMessage="How to Remove a Web App from Your Home Screen"
            />
          </p>
          <ul className="list list-decimal ms-4 my-4">
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.touchAndHoldIos"
                defaultMessage="Touch and hold the app on the Home Screen"
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.tapRemoveAppIos"
                defaultMessage="Tap Remove App"
              />
            </li>
            <li>
              <FormattedMessage
                id="help.downloadStreamarr.safari.removeOrDeleteIos"
                defaultMessage="Tap Remove from Home Screen to keep it in App Library, or tap Delete App to delete it from iPhone"
              />
            </li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <>
      <div className="mt-5 font-extrabold" id="googlechrome">
        <FormattedMessage
          id="help.downloadStreamarr.usingChrome"
          defaultMessage="Using Google Chrome"
        />
      </div>
      <div className="mt-5">
        <Tabs tabs={ChromeTab} />
      </div>
      <div className="mt-5 font-extrabold" id="applesafari">
        <FormattedMessage
          id="help.downloadStreamarr.usingSafari"
          defaultMessage="Using Apple Safari"
        />
      </div>
      <div className="mt-5">
        <Tabs tabs={AppleTab} />
      </div>
      <div className="mt-5 font-extrabold" id="microsoftedge">
        <FormattedMessage
          id="help.downloadStreamarr.usingEdge"
          defaultMessage="Using Microsoft Edge"
        />
      </div>
      <div className="mt-5">
        <Tabs tabs={MicrosoftTab} />
      </div>
    </>
  );
};

const DownloadStreamarr = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/download-streamarr"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.gettingStarted.breadcrumb', defaultMessage: 'Getting Started' })},${intl.formatMessage({ id: 'help.downloadStreamarr.breadcrumb', defaultMessage: 'How to download the {appTitle} app' }, { appTitle: currentSettings.applicationTitle })}`}
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
