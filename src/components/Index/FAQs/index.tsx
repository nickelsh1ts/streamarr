import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex.svg';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import type { ReactNode } from 'react';

function FAQs() {
  const { currentSettings } = useSettings();

  const defaultLimit = currentSettings.defaultInviteQuotas?.quotaLimit;
  const defaultDays = currentSettings.defaultInviteQuotas?.quotaDays;
  const hasQuotas = defaultLimit !== undefined && defaultLimit > 0;

  const faqs: { question: ReactNode; answer: ReactNode; hidden?: boolean }[] = [
    {
      question: (
        <FormattedMessage
          id="index.faqs.whatIsStreamarr.question"
          defaultMessage="What is {appTitle}?"
          values={{
            appTitle: (
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      ),
      answer: (
        <>
          <p className="mb-4">
            <FormattedMessage
              id="index.faqs.whatIsStreamarr.answer1"
              defaultMessage="{appTitle} is a free, Plex-powered streaming service that brings all your favourites together in one place. With content spanning Netflix, Disney+, Prime Video, HBO Max, and more — there's always something exciting to watch."
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage
              id="index.faqs.whatIsStreamarr.answer2"
              defaultMessage="Watch the latest releases, timeless classics, and hidden gems across all your devices. {seerr}{helpLink}"
              values={{
                seerr: currentSettings.seerrEnabled
                  ? "Can't find what you're looking for? Request it and it'll be available within minutes. "
                  : '',
                helpLink: currentSettings.enableHelpCentre ? (
                  <FormattedMessage
                    id="index.faqs.whatIsStreamarr.helpLink"
                    defaultMessage="Learn more in our {link}."
                    values={{
                      link: (
                        <Link href="/help" className="link-accent">
                          <FormattedMessage
                            id="index.faqs.whatIsStreamarr.helpCentre"
                            defaultMessage="Help Centre"
                          />
                        </Link>
                      ),
                    }}
                  />
                ) : (
                  ''
                ),
              }}
            />
          </p>
        </>
      ),
    },
    {
      question: (
        <FormattedMessage
          id="index.faqs.whatIsPlex.question"
          defaultMessage="What is {plex}?"
          values={{
            plex: <PlexLogo className="inline-block size-9" />,
          }}
        />
      ),
      answer: (
        <>
          <p className="mb-4">
            <FormattedMessage
              id="index.faqs.whatIsPlex.answer1"
              defaultMessage="Plex gives you one place to find and access all the media that matters to you. From personal media on your own server, to free and on-demand Movies & Shows, live TV, podcasts, and web shows, you can enjoy it all in one app, on any device."
            />
          </p>
          <p className="mb-4">
            <FormattedMessage
              id="index.faqs.whatIsPlex.answer2"
              defaultMessage="If you are streaming only third-party content ({appTitle}, live TV, web shows), then you are good to go as soon as you have an account, just install an app on your phone, Smart TV, computer, or simply open up our web app on your browser!"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </p>
          <p className="mb-4">
            <FormattedMessage
              id="index.faqs.whatIsPlex.answer3"
              defaultMessage="Watch thousands of free, on-demand Movies & Shows or live TV channels. Listen to your favourite podcasts at home or on your commute, and watch popular web shows from creators around the world."
            />
          </p>
          <p>
            <FormattedMessage
              id="index.faqs.whatIsPlex.answer4"
              defaultMessage="Find more feature information {plexLink}"
              values={{
                plexLink: (
                  <Link
                    href="https://plex.tv"
                    target="_blank"
                    className="link-accent"
                  >
                    <FormattedMessage
                      id="index.faqs.whatIsPlex.plexLink"
                      defaultMessage="on their website."
                    />
                  </Link>
                ),
              }}
            />
          </p>
        </>
      ),
    },
    {
      question: (
        <FormattedMessage
          id="index.faqs.howToJoin.question"
          defaultMessage="How can I join {appTitle}?"
          values={{
            appTitle: (
              <span className="text-primary ms-1">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      ),
      answer: (
        <>
          <p className="mb-4">
            {hasQuotas ? (
              <FormattedMessage
                id="index.faqs.howToJoin.answer1.withQuota"
                defaultMessage="Joining {appTitle} is by invite only. Current active members can invite up to {limit} friends{days}."
                values={{
                  appTitle: (
                    <span className="text-primary">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                  limit: <span className="font-bold">{defaultLimit}</span>,
                  days:
                    defaultDays && defaultDays > 0
                      ? ` every ${defaultDays} days`
                      : '',
                }}
              />
            ) : (
              <FormattedMessage
                id="index.faqs.howToJoin.answer1"
                defaultMessage="Joining {appTitle} is by invite only. Current active members can invite friends from their profile."
                values={{
                  appTitle: (
                    <span className="text-primary">
                      {currentSettings.applicationTitle}
                    </span>
                  ),
                }}
              />
            )}
          </p>
          <p>
            <FormattedMessage
              id="index.faqs.howToJoin.answer2"
              defaultMessage="To invite a friend, log into your account, go to your profile and select the Invites tab. Share the generated invite code or link with your friend and they can sign up at {appUrl}/signup."
              values={{
                appUrl: (
                  <span className="text-primary">
                    {currentSettings.applicationUrl
                      .toLowerCase()
                      .replace(/^https?:\/\//, '') || ''}
                  </span>
                ),
              }}
            />
          </p>
        </>
      ),
      hidden: !currentSettings.enableSignUp,
    },
    {
      question: (
        <FormattedMessage
          id="index.faqs.whereToWatch.question"
          defaultMessage="Where can I watch {appTitle}?"
          values={{
            appTitle: (
              <span className="text-primary ms-1">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      ),
      answer: (
        <>
          <p className="mb-4">
            <FormattedMessage
              id="index.faqs.whereToWatch.answer1"
              defaultMessage="{appTitle} is available anywhere you can use Plex — on mobile devices, web browsers, smart TVs, game consoles, streaming devices, and more. You can also visit {appUrl} directly."
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
                appUrl: (
                  <span className="text-primary">
                    {currentSettings.applicationUrl
                      .toLowerCase()
                      .replace(/^https?:\/\//, '') || 'our website'}
                  </span>
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage
              id="index.faqs.whereToWatch.answer2"
              defaultMessage="You can also install {appTitle} as an app on your device for quick access. {devicesLink}"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
                devicesLink: currentSettings.enableHelpCentre ? (
                  <FormattedMessage
                    id="index.faqs.whereToWatch.devicesLink"
                    defaultMessage="For a complete list of supported devices, click {link}"
                    values={{
                      link: (
                        <Link
                          href="/help/watching-streamarr/devices"
                          className="link-accent"
                        >
                          <FormattedMessage
                            id="index.faqs.whereToWatch.here"
                            defaultMessage="here."
                          />
                        </Link>
                      ),
                    }}
                  />
                ) : (
                  ''
                ),
              }}
            />
          </p>
        </>
      ),
    },
    {
      question: (
        <FormattedMessage
          id="index.faqs.whatToWatch.question"
          defaultMessage="What can I watch on {appTitle}?"
          values={{
            appTitle: (
              <span className="text-primary ms-1">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      ),
      answer: (
        <>
          <p className="mb-4">
            <FormattedMessage
              id="index.faqs.whatToWatch.answer1"
              defaultMessage="{appTitle} offers an ever-evolving collection of movies, TV shows, and more. From the latest blockbusters and binge-worthy series to timeless classics and nostalgic throwbacks."
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </p>
          {currentSettings.seerrEnabled && (
            <p className="mb-4">
              <FormattedMessage
                id="index.faqs.whatToWatch.seerr"
                defaultMessage="Can't find something? Use Seerr to request almost anything and it'll be available to watch within minutes."
              />
            </p>
          )}
          <p>
            <FormattedMessage
              id="index.faqs.whatToWatch.answer2"
              defaultMessage="New content is added regularly, so there's always something new to discover."
            />
          </p>
        </>
      ),
    },
    {
      question: (
        <FormattedMessage
          id="index.faqs.howToInstall.question"
          defaultMessage="How do I install the app?"
        />
      ),
      answer: (
        <p>
          <FormattedMessage
            id="index.faqs.howToInstall.answer"
            defaultMessage="{appTitle} is a Progressive Web App (PWA) that can be installed directly from your browser on any device. Simply visit {appUrl} and use your browser's install option to add it to your home screen. {downloadLink}"
            values={{
              appTitle: (
                <span className="text-primary">
                  {currentSettings.applicationTitle}
                </span>
              ),
              appUrl: (
                <span className="text-primary">
                  {currentSettings.applicationUrl
                    .toLowerCase()
                    .replace(/^https?:\/\//, '') || 'our website'}
                </span>
              ),
              downloadLink: currentSettings.enableHelpCentre ? (
                <FormattedMessage
                  id="index.faqs.howToInstall.downloadLink"
                  defaultMessage="For step-by-step instructions, visit {link}"
                  values={{
                    link: (
                      <Link
                        href="/help/getting-started/download-streamarr"
                        className="link-accent"
                      >
                        <FormattedMessage
                          id="index.faqs.howToInstall.helpLink"
                          defaultMessage="our download guide."
                        />
                      </Link>
                    ),
                  }}
                />
              ) : (
                ''
              ),
            }}
          />
        </p>
      ),
    },
  ];

  return (
    <section id="faqs" className="min-h-lvh place-content-center py-16">
      <div className="container mx-auto">
        <div className="pb-10">
          <p className="text-2xl md:text-4xl text-center font-extrabold">
            <FormattedMessage
              id="index.faqs.title"
              defaultMessage="Frequently Asked Questions"
            />
          </p>
        </div>
        <div className="join join-vertical w-full gap-3 rounded-none px-4">
          {faqs
            .filter((faq) => !faq.hidden)
            .map((faq, idx) => (
              <details
                key={idx}
                name={`faq-${idx}`}
                className="collapse collapse-arrow join-item bg-base-100"
              >
                <summary className="collapse-title text-xl font-medium">
                  {faq.question}
                </summary>
                <div className="collapse-content border-t border-base-300 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
        </div>
      </div>
    </section>
  );
}

export default FAQs;
