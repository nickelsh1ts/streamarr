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
    <div className="bg-zinc-100 p-4 text-black">
      <div className="container mx-auto max-w-screen-xl border-b-2 border-gray-200">
        <h4 className="mb-1 text-2xl font-extrabold">
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
                className="btn max-md:btn-block min-h-16 justify-start rounded-none border-0 bg-zinc-50 text-black shadow-xl hover:bg-zinc-50 hover:brightness-95 md:justify-center lg:w-1/4"
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
                    className="link-primary mb-4 font-extrabold"
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
