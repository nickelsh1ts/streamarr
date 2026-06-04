'use client';
import Error from '@app/app/error';
import Releases from '@app/components/Admin/Settings/System/Releases';
import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import List from '@app/components/Common/List';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { usePythonRestart } from '@app/hooks/usePythonRestart';
import { useServerRestart } from '@app/hooks/useServerRestart';
import { ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import type {
  RestartStatusResponse,
  SettingsAboutResponse,
  StatusResponse,
} from '@server/interfaces/api/settingsInterfaces';
import useSWR from 'swr';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEffect, useState } from 'react';
import { RESTART_REQUIRED_SWR_KEY } from '@app/components/Admin/Settings/RestartRequiredAlert';
import DiskSpace from '@app/components/Admin/Settings/System/DiskSpace';
import { formatUptime } from '@app/utils/numberHelper';

const SystemSettings = () => {
  const intl = useIntl();
  const {
    isRestarting: isRestartingServer,
    isReconnecting,
    restart: handleRestartServer,
  } = useServerRestart();

  const {
    status: pythonStatus,
    isRestarting: isRestartingPython,
    restart: handleRestartPython,
  } = usePythonRestart({ refreshInterval: 15_000 });
  const { data: restartData, error: restartError } =
    useSWR<RestartStatusResponse>(RESTART_REQUIRED_SWR_KEY, {
      revalidateOnFocus: true,
    });

  const { data, error } = useSWR<SettingsAboutResponse>(
    '/api/v1/settings/about'
  );

  const { data: status } = useSWR<StatusResponse>('/api/v1/status');

  const [liveUptime, setLiveUptime] = useState<number | null>(null);
  useEffect(() => {
    if (!data) return;
    const base = Math.floor(data.uptime);
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setLiveUptime(base + tick);
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  if (!data && !error && !restartError) {
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
      <Alert
        type="primary"
        title={intl.formatMessage({
          id: 'systemSettings.betaWarning',
          defaultMessage:
            'This is BETA software and currently under active development. Features may be broken and/or unstable. Please check GitHub for status updates.',
        })}
      >
        <span className="ml-7">
          <a
            href="https://github.com/nickelsh1ts/streamarr"
            className="whitespace-nowrap font-medium transition duration-150 ease-in-out hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowRightIcon className="size-4 inline-flex" />
          </a>
        </span>
      </Alert>
      <div className="mt-6 flex justify-between items-center">
        <h3 className="text-2xl font-extrabold gap-2 flex items-center">
          <FormattedMessage id="system.health.title" defaultMessage="Health" />
        </h3>
      </div>
      <div className="mt-4">
        {data.version.startsWith('develop-') && (
          <Alert>
            <p className="text-sm leading-5 flex-1">
              <FormattedMessage
                id="systemSettings.developWarning"
                defaultMessage="You are running the <code>develop</code> branch of Streamarr, which is only recommended for those contributing to development or assisting with bleeding-edge testing."
                values={{
                  code: (chunks: React.ReactNode) => <code>{chunks}</code>,
                }}
              />
            </p>
          </Alert>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <HealthCard
          title={intl.formatMessage({
            id: 'system.streamarr.title',
            defaultMessage: 'Streamarr',
          })}
          description={
            restartData?.required
              ? intl.formatMessage({
                  id: 'system.restartRequiredDescription',
                  defaultMessage:
                    'A restart is required to apply recent changes. Please restart the server as soon as possible.',
                })
              : intl.formatMessage({
                  id: 'system.streamarr.description',
                  defaultMessage: 'Main server process for Streamarr.',
                })
          }
          status={restartData?.required ? 'Restart Required' : 'healthy'}
          isRestarting={isRestartingServer || isReconnecting}
          onRestart={handleRestartServer}
        />
        <HealthCard
          title={intl.formatMessage({
            id: 'system.python.title',
            defaultMessage: 'Plex Sync Service',
          })}
          description={intl.formatMessage({
            id: 'system.python.description',
            defaultMessage: 'Handles Plex invites and library synchronization.',
          })}
          status={pythonStatus?.status}
          isRestarting={isRestartingPython}
          onRestart={handleRestartPython}
        />
      </div>
      <DiskSpace data={data} />
      <div className="mt-6">
        <List
          title={intl.formatMessage({
            id: 'common.about',
            defaultMessage: 'About',
          })}
        >
          <List.Item
            title={intl.formatMessage({
              id: 'common.version',
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
                    className="ml-2 cursor-pointer! transition"
                  >
                    <FormattedMessage
                      id="systemSettings.outOfDate"
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
                    className="ml-2 cursor-pointer! transition"
                  >
                    <FormattedMessage
                      id="systemSettings.upToDate"
                      defaultMessage="Up to date"
                    />
                  </Badge>
                </a>
              ))}
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'common.database',
              defaultMessage: 'Database',
            })}
          >
            <code>
              {data.database.type} {data.database.version}
            </code>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.nodeVersion',
              defaultMessage: 'Node.js',
            })}
          >
            <code>{data.nodeVersion}</code>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.pythonVersion',
              defaultMessage: 'Python',
            })}
          >
            <code>{data.pythonVersion}</code>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.totalUsers',
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
              id: 'systemSettings.dataDirectory',
              defaultMessage: 'Data Directory',
            })}
          >
            <code>{data.appDataPath}</code>
          </List.Item>
          {data.tz && (
            <List.Item
              title={intl.formatMessage({
                id: 'systemSettings.timeZone',
                defaultMessage: 'Time Zone',
              })}
            >
              <code>{data.tz}</code>
            </List.Item>
          )}
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.uptime',
              defaultMessage: 'Uptime',
            })}
          >
            <code>{formatUptime(liveUptime ?? Math.floor(data.uptime))}</code>
          </List.Item>
        </List>
      </div>
      <div className="mt-6">
        <List
          title={intl.formatMessage({
            id: 'systemSettings.moreInfo',
            defaultMessage: 'More Info',
          })}
        >
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.homePage',
              defaultMessage: 'Home Page',
            })}
          >
            <a
              href="https://streamarr.dev"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              streamarr.dev
            </a>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.documentation',
              defaultMessage: 'Documentation',
            })}
          >
            <a
              href="https://docs.streamarr.dev"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              docs.streamarr.dev
            </a>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.githubDiscussions',
              defaultMessage: 'GitHub Discussions',
            })}
          >
            <a
              href="https://github.com/nickelsh1ts/streamarr/discussions"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              github.com/nickelsh1ts/streamarr/discussions
            </a>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.helpPayForCoffee',
              defaultMessage: 'Help Pay for Coffee ☕️',
            })}
          >
            <a
              href="https://github.com/sponsors/nickelsh1ts"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              github.com/sponsors/nickelsh1ts
            </a>
            <Badge className="ml-2">
              <FormattedMessage
                id="systemSettings.preferred"
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
              patreon.com/nickelsh1ts
            </a>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.source',
              defaultMessage: 'Source',
            })}
          >
            <a
              href="https://github.com/nickelsh1ts/streamarr"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              github.com/nickelsh1ts/streamarr
            </a>
          </List.Item>
          <List.Item
            title={intl.formatMessage({
              id: 'systemSettings.featureRequests',
              defaultMessage: 'Feature Requests',
            })}
          >
            <a
              href="https://github.com/nickelsh1ts/streamarr/issues"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              github.com/nickelsh1ts/streamarr/issues
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

const HealthCard = ({
  title,
  description,
  status,
  isRestarting,
  onRestart,
}: {
  title: string;
  description: string;
  status?: string;
  isRestarting: boolean;
  onRestart: () => void;
}) => {
  const intl = useIntl();

  const getStatusBadge = () => {
    switch (status) {
      case 'healthy':
        return (
          <Badge badgeType="success">
            <FormattedMessage
              id="system.status.healthy"
              defaultMessage="Healthy"
            />
          </Badge>
        );
      case 'unhealthy':
        return (
          <Badge badgeType="error">
            <FormattedMessage
              id="system.status.unhealthy"
              defaultMessage="Unhealthy"
            />
          </Badge>
        );
      default:
        return (
          <Badge badgeType="warning">
            {status ? (
              status
            ) : (
              <FormattedMessage
                id="system.status.unknown"
                defaultMessage="Unknown"
              />
            )}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-lg border border-base-content/10 bg-base-200/50 hover:bg-base-200/30 py-2 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold flex gap-2">
            {title} {status && <span>{getStatusBadge()}</span>}
          </h4>
          <p className="text-sm text-neutral">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {isRestarting ? (
            <Button buttonSize="sm" buttonType="error" disabled>
              <ArrowPathIcon className="size-4 mr-1 animate-spin" />
              <FormattedMessage
                id="system.restarting"
                defaultMessage="Restarting…"
              />
            </Button>
          ) : (
            <ConfirmButton
              onClick={onRestart}
              confirmText={intl.formatMessage({
                id: 'common.areYouSure',
                defaultMessage: 'Are you sure?',
              })}
              buttonSize="sm"
              className="max-sm:btn-block"
            >
              <ArrowPathIcon className="size-4 mr-1" />
              <FormattedMessage id="common.restart" defaultMessage="Restart" />
            </ConfirmButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
