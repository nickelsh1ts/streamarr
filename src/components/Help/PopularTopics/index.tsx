'use client';
import useSettings from '@app/hooks/useSettings';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

const PopularTopics = () => {
  const { currentSettings } = useSettings();

  const topics = [
    {
      href: '/help/getting-started/become-a-member',
      label: (
        <FormattedMessage
          id="help.howToBecomeMember"
          defaultMessage="How to become a member"
        />
      ),
    },
    {
      href: '/help/watching-streamarr/devices',
      label: (
        <FormattedMessage
          id="help.supportedDevices"
          defaultMessage="Supported devices"
        />
      ),
    },
    {
      href: '/help/watching-streamarr/requesting',
      label: (
        <FormattedMessage
          id="help.requestingNewMedia"
          defaultMessage="Requesting new media"
        />
      ),
      hidden: !currentSettings.seerrEnabled,
    },
  ];

  return (
    <div className="bg-zinc-100 text-black p-4">
      <div className="container max-w-screen-xl mx-auto border-b-2">
        <h4 className="text-2xl font-extrabold mb-1">
          <FormattedMessage
            id="help.popularTopics"
            defaultMessage="Popular topics"
          />
        </h4>
        <div className="mb-8 flex flex-wrap gap-2">
          {topics
            .filter((topic) => !topic.hidden)
            .map((topic, idx) => (
              <Link
                key={idx}
                href={topic.href}
                className="btn rounded-none bg-zinc-50 border-0 text-black hover:bg-zinc-50 hover:brightness-95 max-md:btn-block lg:w-1/4 shadow-xl justify-start md:justify-center min-h-16"
              >
                <DocumentTextIcon className="w-5" />
                {topic.label}
              </Link>
            ))}
        </div>
        {currentSettings.statusUrl && currentSettings.statusEnabled && (
          <p className="mb-4 text-sm">
            <FormattedMessage
              id="help.statusPageMessage"
              defaultMessage="Having issues connecting? Check out our {statusLink}"
              values={{
                statusLink: (
                  <Link
                    href={currentSettings.statusUrl}
                    className="link-primary font-extrabold mb-4"
                  >
                    <FormattedMessage
                      id="help.statusPage"
                      defaultMessage="Status Page"
                    />
                  </Link>
                ),
              }}
            />
          </p>
        )}
      </div>
    </div>
  );
};

export default PopularTopics;
