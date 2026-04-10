'use client';
import useSettings from '@app/hooks/useSettings';
import Link from 'next/link';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

const Privacy = () => {
  const { currentSettings } = useSettings();
  const [hostname] = useState(() =>
    typeof window !== 'undefined' ? `${window?.location?.host}` : ''
  );

  return (
    <div className="container my-5 text-black max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto p-4">
      <p className="text-4xl mb-6 font-extrabold">
        <FormattedMessage
          id="help.privacy.title"
          defaultMessage="Privacy Statement"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.privacy.intro"
          defaultMessage="This Privacy Statement explains how {appTitle} handles your information. We keep things simple — we collect only what we need to make the service work, and we do not sell your data. Ever."
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
          id="help.privacy.contactTitle"
          defaultMessage="Contacting Us"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.privacy.contactDesc"
          defaultMessage="If you have questions about your account, visit our help center at {helpLink}. For privacy-specific questions, reach out at {emailLink}."
          values={{
            helpLink: (
              <a
                className="text-decoration-none link-primary font-extrabold"
                href="/help"
              >
                {currentSettings.applicationUrl
                  .toLowerCase()
                  .replace('http://', '')
                  .replace('https://', '') || hostname}
                /help
              </a>
            ),
            emailLink: (
              <a
                className="text-decoration-none link-primary font-extrabold"
                href={`mailto:${currentSettings.supportEmail.toLowerCase() || 'privacy@' + hostname}`}
              >
                {currentSettings.supportEmail.toLowerCase() ||
                  'privacy@' + hostname}
              </a>
            ),
          }}
        />
      </p>
      <p className="font-extrabold mt-7 text-xl mb-2">
        <FormattedMessage
          id="help.privacy.collectTitle"
          defaultMessage="What We Collect"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.privacy.collectIntro"
          defaultMessage="We receive and store information about you such as:"
        />
      </p>
      <ul className="list-disc mx-10 my-3">
        <li>
          <span className="font-extrabold">
            <FormattedMessage
              id="help.privacy.providedLabel"
              defaultMessage="Information you provide:"
            />
          </span>{' '}
          <FormattedMessage
            id="help.privacy.providedDesc"
            defaultMessage="Your name and email address when you create an account, and any preferences or requests you submit through the service."
          />
        </li>
        <li className="mt-3">
          <span className="font-extrabold">
            <FormattedMessage
              id="help.privacy.autoLabel"
              defaultMessage="Information collected automatically:"
            />
          </span>{' '}
          <FormattedMessage
            id="help.privacy.autoDesc"
            defaultMessage="Basic usage data such as what you watch, device information, IP address (for general location), and standard web server logs. This helps us keep things running and improve the experience."
          />
        </li>
      </ul>
      <p className="font-extrabold mt-7 text-xl mb-2">
        <FormattedMessage
          id="help.privacy.useTitle"
          defaultMessage="How We Use It"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.privacy.useIntro"
          defaultMessage="We use your information to provide and improve the service. Specifically:"
        />
      </p>
      <ul className="list-disc mx-10 my-3">
        <li className="my-3">
          <FormattedMessage
            id="help.privacy.use1"
            defaultMessage="To keep your account working and secure"
          />
        </li>
        <li className="my-3">
          <FormattedMessage
            id="help.privacy.use2"
            defaultMessage="To personalize your experience and provide recommendations"
          />
        </li>
        <li className="my-3">
          <FormattedMessage
            id="help.privacy.use3"
            defaultMessage="To communicate with you about your account, requests, and service updates"
          />
        </li>
        <li className="my-3">
          <FormattedMessage
            id="help.privacy.use4"
            defaultMessage="To troubleshoot issues and improve the service"
          />
        </li>
      </ul>
      <p className="font-extrabold mt-7 text-xl mb-2" id="cookies">
        <FormattedMessage
          id="help.privacy.cookiesTitle"
          defaultMessage="Cookies"
        />
      </p>
      <p>
        <FormattedMessage
          id="help.privacy.cookiesDesc"
          defaultMessage="We use cookies to keep you signed in and remember your preferences. For full details, see our {link}."
          values={{
            link: (
              <Link
                href="/help/legal/cookies"
                className="link-primary font-extrabold"
              >
                <FormattedMessage
                  id="help.privacy.cookiePolicyLink"
                  defaultMessage="Cookie Policy"
                />
              </Link>
            ),
          }}
        />
      </p>
      <p className="mt-6">
        <span className="font-extrabold">
          <FormattedMessage
            id="help.privacy.lastUpdated"
            defaultMessage="Last Updated:"
          />
        </span>{' '}
        April 9, 2026
      </p>
    </div>
  );
};

export default Privacy;
