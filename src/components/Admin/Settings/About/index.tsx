'use client';
import Error from '@app/app/error';
import Releases from '@app/components/Admin/Settings/About/Releases';
import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import List from '@app/components/Common/List';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import type {
  SettingsAboutResponse,
  StatusResponse,
} from '@server/interfaces/api/settingsInterfaces';
import useSWR from 'swr';
import { FormattedMessage, useIntl } from 'react-intl';

const AboutSettings = () => {
  const intl = useIntl();
  const { data, error } = useSWR<SettingsAboutResponse>(
    '/api/v1/settings/about'
  );

  const { data: status } = useSWR<StatusResponse>('/api/v1/status');

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return (
      <Error
        statusCode={500}
        error={{ name: 'Failed to read status' }}
        reset={null}
      />
    );
  }

  return (
    <div>
      <Alert type="primary">
        <p className="text-sm leading-5 flex-1">
          <FormattedMessage
            id="aboutSettings.preAlphaWarning"
            defaultMessage="This is PRE-ALPHA software and currently under active development. Features may be broken and/or unstable. Please check GitHub for status updates."
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
      <div className="mt-6">
        <List
          title={intl.formatMessage({
            id: 'aboutSettings.title',
            defaultMessage: 'About Streamarr',
          })}
        >
          <div className="mt-4">
            {data.version.startsWith('develop-') && (
              <Alert>
                <p className="text-sm leading-5 flex-1">
                  <FormattedMessage
                    id="aboutSettings.developWarning"
                    defaultMessage="You are running the <code>develop</code> branch of Streamarr, which is only recommended for those contributing to development or assisting with bleeding-edge testing."
                    values={{
                      code: (chunks: React.ReactNode) => <code>{chunks}</code>,
                    }}
                  />
                </p>
              </Alert>
            )}
          </div>
          <List.Item
            title={intl.formatMessage({
              id: 'aboutSettings.version',
              defaultMessage: 'Version',
            })}
            className="flex flex-row items-center truncate"
          >
            <code>{data.version.replace('develop-', '')}</code>
            {status?.commitTag !== 'local' &&
              (status?.updateAvailable ? (
                <a
                  href={
                    data.version.startsWith('develop-')
                      ? `https://github.com/nickelsh1ts/streamarr/compare/${status.commitTag}...develop`
                      : 'https://github.com/nickelsh1ts/streamarr/releases'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge
                    badgeType="warning"
                    className="ml-2 !cursor-pointer transition hover:bg-yellow-400"
                  >
                    <FormattedMessage
                      id="aboutSettings.outOfDate"
                      defaultMessage="Out of date"
                    />
                  </Badge>
                </a>
              ) : (
                <a
                  href={
                    data.version.startsWith('develop-')
                      ? 'https://github.com/nickelsh1ts/streamarr/commits/develop'
                      : 'https://github.com/nickelsh1ts/streamarr/releases'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge
                    badgeType="success"
                    className="ml-2 !cursor-pointer transition hover:bg-green-400"
                  >
                    <FormattedMessage
                      id="aboutSettings.upToDate"
                      defaultMessage="Up to date"
                    />
                  </Badge>
                </a>
              ))}
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'aboutSettings.totalUsers',
              defaultMessage: 'Total Users',
            })}
          >
            <code>{data.totalUsers}</code>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'profile.totalInvites',
              defaultMessage: 'Total Invites',
            })}
          >
            <code>{data.totalInvites}</code>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'aboutSettings.dataDirectory',
              defaultMessage: 'Data Directory',
            })}
          >
            <code>{data.appDataPath}</code>
          </List.Item>
          {data.tz && (
            <List.Item
              title={intl.formatMessage({
                id: 'aboutSettings.timeZone',
                defaultMessage: 'Time Zone',
              })}
            >
              <code>{data.tz}</code>
            </List.Item>
          )}
        </List>
      </div>
      <div className="mt-6">
        <List
          title={intl.formatMessage({
            id: 'aboutSettings.gettingSupport',
            defaultMessage: 'Getting Support',
          })}
        >
          <List.Item
            title={intl.formatMessage({
              id: 'aboutSettings.documentation',
              defaultMessage: 'Documentation',
            })}
          >
            <a
              href="https://docs.streamarr.dev"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://docs.streamarr.dev
            </a>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'aboutSettings.githubDiscussions',
              defaultMessage: 'GitHub Discussions',
            })}
          >
            <a
              href="https://github.com/nickelsh1ts/streamarr/discussions"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://github.com/nickelsh1ts/streamarr/discussions
            </a>
          </List.Item>
          <List.Item title="Discord">
            <a
              href="https://discord.gg/streamarr"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://discord.gg/streamarr
            </a>
          </List.Item>
        </List>
      </div>
      <div className="mt-6">
        <List
          title={intl.formatMessage({
            id: 'aboutSettings.supportStreamarr',
            defaultMessage: 'Support Streamarr',
          })}
        >
          <List.Item
            title={intl.formatMessage({
              id: 'aboutSettings.helpPayForCoffee',
              defaultMessage: 'Help Pay for Coffee ☕️',
            })}
          >
            <a
              href="https://github.com/sponsors/nickelsh1ts"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://github.com/sponsors/nickelsh1ts
            </a>
            <Badge className="ml-2">
              <FormattedMessage
                id="aboutSettings.preferred"
                defaultMessage="Preferred"
              />
            </Badge>
          </List.Item>
          <List.Item title="">
            <a
              href="https://patreon.com/nickelsh1ts"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://patreon.com/nickelsh1ts
            </a>
          </List.Item>
        </List>
      </div>
      <div className="section">
        <Releases currentVersion={data.version} />
      </div>
    </div>
  );
};
export default AboutSettings;
