'use client';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage } from 'react-intl';
import PlexLogo from '@app/assets/services/plex_dark.svg';

const TermsOfUse = () => {
  const { currentSettings } = useSettings();
  return (
    <div className="container my-5 text-black max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto p-4">
      <p className="text-4xl mb-10 font-extrabold">
        <FormattedMessage
          id="help.terms.title"
          defaultMessage="{appTitle} Terms of Use"
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <div>
        <p className="mb-2">
          <FormattedMessage
            id="help.terms.welcome"
            defaultMessage="Welcome to {appTitle}! These Terms of Use govern your use of our service. By using {appTitle}, you agree to these terms. They are not meant to be scary — just a few ground rules so everyone can enjoy the service."
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </p>
        <p className="mb-2">
          <FormattedMessage
            id="help.terms.definition"
            defaultMessage='As used in these Terms of Use, "{appTitle} service", "our service" or "the service" means the personalized service provided by {appTitle} for discovering and watching content, including all features and functionalities, recommendations, the website, and user interfaces, as well as all content and software associated with our service.'
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </p>
        <ul className="list-disc mx-9 my-5">
          <li className="mb-2">
            <span className="font-extrabold">
              <FormattedMessage
                id="help.terms.membershipLabel"
                defaultMessage="Membership"
              />
            </span>
            <ul className="list-inside space-y-6 my-6">
              <li>
                <FormattedMessage
                  id="help.terms.membership1"
                  defaultMessage="1.1 Your {appTitle} membership will continue until terminated. To use the {appTitle} service you need Internet access and a compatible device."
                  values={{
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
                  id="help.terms.membership2"
                  defaultMessage="1.2 {appTitle} is a personal, non-commercial service. Think of it like being invited to a really great movie night — just, you know, every night."
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
          </li>
          <li className="mb-2">
            <span className="font-extrabold">
              <FormattedMessage
                id="help.terms.cancellationLabel"
                defaultMessage="Cancellation"
              />
            </span>
            <ul className="list-inside space-y-6 my-6">
              <li>
                <FormattedMessage
                  id="help.terms.cancellation1"
                  defaultMessage="2.1. You can leave {appTitle} at any time — no hard feelings. Your access will end and your account will be closed."
                  values={{
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
                  id="help.terms.cancellation2"
                  defaultMessage="2.2. {plexLogo} accounts are managed separately and subject to their own terms and conditions."
                  values={{
                    plexLogo: <PlexLogo className="inline-block size-9" />,
                  }}
                />
              </li>
            </ul>
          </li>
          <li className="mb-2">
            <span className="font-extrabold">
              <FormattedMessage
                id="help.terms.serviceLabel"
                defaultMessage="{appTitle} Service"
                values={{
                  appTitle: (
                    <span className="text-primary font-bold">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            </span>
            <ul className="list-inside space-y-6 my-6">
              <li>
                <FormattedMessage
                  id="help.terms.service1"
                  defaultMessage="3.1. The service is for your personal and non-commercial use only and may not be shared with individuals beyond your household. Please do not use it for public performances — this is not a cinema (though we understand the temptation)."
                />
              </li>
              <li>
                <FormattedMessage
                  id="help.terms.service2"
                  defaultMessage="3.2. Content availability may vary by location. The number of simultaneous streams may be limited by the admin."
                />
              </li>
              <li>
                <FormattedMessage
                  id="help.terms.service3"
                  defaultMessage="3.3. The content library is regularly updated. We are always working to improve things and keep the shelves stocked."
                />
              </li>
              <li>
                <FormattedMessage
                  id="help.terms.service4"
                  defaultMessage="3.4. Some content may be available for temporary offline download on supported devices. Limitations apply."
                />
              </li>
              <li>
                <FormattedMessage
                  id="help.terms.service5"
                  defaultMessage="3.5. Please use {appTitle} responsibly. Do not attempt to circumvent, reverse engineer, or otherwise tamper with the service. Do not use automated tools to access or scrape content. We reserve the right to terminate accounts that violate these terms."
                  values={{
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
                  id="help.terms.service6"
                  defaultMessage="3.6. Streaming quality depends on your internet connection and device. We recommend at least 3 Mbps for HD content. You are responsible for your own internet costs — we cannot help with your ISP bill, sadly."
                />
              </li>
              <li>
                <FormattedMessage
                  id="help.terms.service7"
                  defaultMessage="3.7. The {plexLogo} software is subject to its own licenses. Updates may be applied automatically."
                  values={{
                    plexLogo: <PlexLogo className="inline-block size-9" />,
                  }}
                />
              </li>
            </ul>
          </li>
          <li className="mb-4">
            <span className="font-extrabold">
              <FormattedMessage
                id="help.terms.passwordsLabel"
                defaultMessage="Passwords and Account Access."
              />
            </span>{' '}
            <FormattedMessage
              id="help.terms.passwordsDesc"
              defaultMessage="Keep your account credentials safe. You are responsible for all activity on your account. If you suspect unauthorized access, let us know and we will help sort it out."
            />
          </li>
          <li className="mb-4">
            <span className="font-extrabold">
              <FormattedMessage
                id="help.terms.warrantiesLabel"
                defaultMessage="Warranties and Limitations on Liability."
              />
            </span>{' '}
            <FormattedMessage
              id="help.terms.warrantiesDesc"
              defaultMessage='The {appTitle} service is provided "as is" and without warranty. We do our best to keep things running smoothly, but the occasional hiccup is inevitable. You waive all special, indirect and consequential damages against us.'
              values={{
                appTitle: (
                  <span className="text-primary font-bold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </li>
          <li className="mb-4">
            <span className="font-extrabold">
              <FormattedMessage
                id="help.terms.changesLabel"
                defaultMessage="Changes to These Terms."
              />
            </span>{' '}
            <FormattedMessage
              id="help.terms.changesDesc"
              defaultMessage="We may update these terms from time to time. Continued use of the service after changes means you accept the updated terms. We will do our best to keep things reasonable."
            />
          </li>
        </ul>
      </div>
      <p className="mt-4">
        <span className="font-extrabold">
          <FormattedMessage
            id="help.terms.lastUpdated"
            defaultMessage="Last Updated:"
          />
        </span>{' '}
        April 9, 2026
      </p>
    </div>
  );
};

export default TermsOfUse;
