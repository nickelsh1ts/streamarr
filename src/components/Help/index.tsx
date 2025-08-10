'use client';
import Alert from '@app/components/Common/Alert';
import HelpHeader from '@app/components/Help/Header';
import MoreHelp from '@app/components/Help/MoreHelp';
import PopularTopics from '@app/components/Help/PopularTopics';
import Topics from '@app/components/Help/Topics';
import Footer from '@app/components/Layout/Footer';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { FormattedMessage } from 'react-intl';

//TODO update help articles with current and up to date information

const Help = () => {
  return (
    <main>
      <HelpHeader />
      <div className="bg-zinc-100 overflow-hidden pt-4 px-4 -mb-4">
        <div className="max-w-screen-xl mx-auto rounded-lg">
          <Alert type="warning">
            <div className="ml-3 flex-1 md:flex md:justify-between text-warning-content">
              <p className="text-sm leading-5">
                <FormattedMessage
                  id="help.preReleaseWarning"
                  defaultMessage="This is a pre-release preview and currently under active development. If you encounter issues please try again or reach out to {support} for further assistance. Please check GitHub for status updates."
                  values={{
                    support: (
                      <span className="text-info font-bold">nickelsh1ts</span>
                    ),
                  }}
                />
              </p>
              <p className="mt-3 text-sm leading-5 md:mt-0 md:ml-6">
                <a
                  href="https://github.com/nickelsh1ts/streamarr"
                  className="whitespace-nowrap font-medium transition duration-150 ease-in-out hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FormattedMessage
                    id="help.githubLink"
                    defaultMessage="GitHub"
                  />{' '}
                  <ArrowRightIcon className="size-4 inline-flex" />
                </a>
              </p>
            </div>
          </Alert>
        </div>
      </div>
      <PopularTopics />
      <Topics />
      <MoreHelp />
      <Footer />
    </main>
  );
};

export default Help;
