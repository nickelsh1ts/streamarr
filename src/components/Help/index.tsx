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
      <div className="overflow-hidden pt-4 px-4 -mb-4">
        <div className="max-w-screen-xl mx-auto rounded-lg">
          <Alert type="warning">
            <p className="text-sm leading-5 flex-1">
              <FormattedMessage
                id="help.preReleaseWarning"
                defaultMessage="This is beta software and currently under active development. If you encounter issues please try again or reach out on GitHub for further assistance or check GitHub for status updates."
              />
            </p>
            <p className="text-sm leading-5 place-content-center ml-7 sm:w-auto w-full">
              <a
                href="https://github.com/nickelsh1ts/streamarr"
                className="whitespace-nowrap font-medium transition duration-150 ease-in-out hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <ArrowRightIcon className="size-4 inline-flex" />
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
