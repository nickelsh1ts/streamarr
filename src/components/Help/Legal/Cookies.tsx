'use client';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage } from 'react-intl';

const Cookies = () => {
  const { currentSettings } = useSettings();

  return (
    <div
      className="container mx-auto my-5 max-w-screen-md p-4 text-black lg:max-w-screen-lg xl:max-w-screen-xl"
      id="cookies"
    >
      <p className="mb-6 text-4xl font-extrabold">
        <FormattedMessage
          id="help.cookies.title"
          defaultMessage="Cookie Policy"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.cookies.intro"
          defaultMessage="This Cookie Policy explains how {appTitle} uses cookies and similar technologies when you use our service."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <p className="mt-10 mb-2 text-xl font-extrabold">
        <FormattedMessage
          id="help.cookies.whatTitle"
          defaultMessage="What Are Cookies?"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.cookies.whatDesc"
          defaultMessage="Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site operators."
        />
      </p>
      <p className="mt-7 mb-2 text-xl font-extrabold">
        <FormattedMessage
          id="help.cookies.howTitle"
          defaultMessage="How We Use Cookies"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.cookies.howDesc"
          defaultMessage="{appTitle} uses cookies for the following purposes:"
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <ul className="mx-10 my-3 list-disc">
        <li className="my-3">
          <span className="font-extrabold">
            <FormattedMessage
              id="help.cookies.essentialLabel"
              defaultMessage="Essential Cookies:"
            />
          </span>{' '}
          <FormattedMessage
            id="help.cookies.essentialDesc"
            defaultMessage="These are required for the service to function. They include session cookies that keep you signed in and CSRF tokens that protect against cross-site request forgery."
          />
        </li>
        <li className="my-3">
          <span className="font-extrabold">
            <FormattedMessage
              id="help.cookies.preferenceLabel"
              defaultMessage="Preference Cookies:"
            />
          </span>{' '}
          <FormattedMessage
            id="help.cookies.preferenceDesc"
            defaultMessage="These remember your settings and preferences, such as your language selection and display options."
          />
        </li>
      </ul>
      <p className="mt-7 mb-2 text-xl font-extrabold">
        <FormattedMessage
          id="help.cookies.thirdPartyTitle"
          defaultMessage="Third-Party Cookies"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.cookies.thirdPartyDesc"
          defaultMessage="{appTitle} integrates with {plexLogo} for media playback and account authentication. When using the {plexLogo} web player within {appTitle}, {plexLogo} may set its own cookies subject to their privacy policy."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <p className="mt-7 mb-2 text-xl font-extrabold">
        <FormattedMessage
          id="help.cookies.managingTitle"
          defaultMessage="Managing Cookies"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.cookies.managingDesc"
          defaultMessage='Most web browsers allow you to control cookies through their settings. You can typically find these options in your browser&apos;s "Settings", "Preferences", or "Privacy" menu. Please note that disabling essential cookies may prevent you from using {appTitle} properly, as they are required for authentication and security.'
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <p className="mt-6">
        <span className="font-extrabold">
          <FormattedMessage
            id="help.cookies.lastUpdated"
            defaultMessage="Last Updated:"
          />
        </span>{' '}
        April 9, 2026
      </p>
    </div>
  );
};

export default Cookies;
