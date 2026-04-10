'use client';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage } from 'react-intl';
import PlexLogo from '@app/assets/services/plex_dark.svg';

const Cookies = () => {
  const { currentSettings } = useSettings();

  return (
    <div
      className="container my-5 text-black max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto p-4 "
      id="cookies"
    >
      <p className="text-4xl mb-6 font-extrabold">
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
      <p className="font-extrabold mt-10 text-xl mb-2">
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
      <p className="font-extrabold mt-7 text-xl mb-2">
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
      <ul className="list-disc mx-10 my-3">
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
      <p className="font-extrabold mt-7 text-xl mb-2">
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
      <p className="font-extrabold mt-7 text-xl mb-2">
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
