'use client';
import Alert from '@app/components/Common/Alert';
import HelpHeader from '@app/components/Help/Header';
import MoreHelp from '@app/components/Help/MoreHelp';
import PopularTopics from '@app/components/Help/PopularTopics';
import Topics from '@app/components/Help/Topics';
import Footer from '@app/components/Layout/Footer';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { FormattedMessage } from 'react-intl';

const Help = () => {
  return (
    <main className="bg-zinc-100 text-black">
      <HelpHeader />
      <div className="-mb-4 overflow-hidden px-4 pt-4">
        <div className="mx-auto max-w-screen-xl rounded-lg">
          <Alert type="warning">
            <p className="flex-1 text-sm leading-5">
              <FormattedMessage
                id="help.preReleaseWarning"
                defaultMessage="This is beta software and currently under active development. If you encounter issues please try again or reach out on GitHub for further assistance or check GitHub for status updates."
              />
            </p>
            <p className="ml-7 w-full place-content-center text-sm leading-5 sm:w-auto">
              <a
                href="https://github.com/nickelsh1ts/streamarr"
                className="font-medium whitespace-nowrap transition duration-150 ease-in-out hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <ArrowRightIcon className="inline-flex size-4" />
              </a>
            </p>
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
