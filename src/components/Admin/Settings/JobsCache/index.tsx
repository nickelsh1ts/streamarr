'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Table from '@app/components/Common/Table';
import Toast from '@app/components/Toast';
import { formatBytes } from '@app/utils/numberHelper';
import {
  PencilIcon,
  StopIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type {
  CacheResponse,
  CacheItem,
} from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import cronstrue from 'cronstrue';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { useEffect, useReducer, useState } from 'react';
import useSWR from 'swr';
import { useIntl, FormattedMessage } from 'react-intl';

interface Job {
  id: string;
  name?: string;
  type: 'process' | 'command';
  interval: 'seconds' | 'minutes' | 'hours' | 'fixed';
  cronSchedule: string;
  nextExecutionTime: string;
  running: boolean;
}

type JobModalState = {
  isOpen?: boolean;
  job?: Job;
  scheduleHours: number;
  scheduleMinutes: number;
  scheduleSeconds: number;
};

type JobModalAction =
  | { type: 'set'; hours?: number; minutes?: number; seconds?: number }
  | {
      type: 'close';
    }
  | { type: 'open'; job?: Job };

const jobModalReducer = (
  state: JobModalState,
  action: JobModalAction
): JobModalState => {
  switch (action.type) {
    case 'close':
      return {
        ...state,
        isOpen: false,
      };

    case 'open':
      return {
        isOpen: true,
        job: action.job,
        scheduleHours: 1,
        scheduleMinutes: 5,
        scheduleSeconds: 30,
      };

    case 'set':
      return {
        ...state,
        scheduleHours: action.hours ?? state.scheduleHours,
        scheduleMinutes: action.minutes ?? state.scheduleMinutes,
        scheduleSeconds: action.seconds ?? state.scheduleSeconds,
      };
  }
};

const JobsCacheSettings = () => {
  const intl = useIntl();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<Job[]>('/api/v1/settings/jobs', {
    refreshInterval: 5000,
  });
  const { data: appData } = useSWR('/api/v1/status/appdata');
  const {
    data: cacheData,
    mutate: cacheRevalidate,
    isLoading,
  } = useSWR<CacheResponse>('/api/v1/settings/cache', {
    refreshInterval: 10000,
  });

  const [jobModalState, dispatch] = useReducer(jobModalReducer, {
    isOpen: false,
    scheduleHours: 1,
    scheduleMinutes: 5,
    scheduleSeconds: 30,
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  const runJob = async (job: Job) => {
    await axios.post(`/api/v1/settings/jobs/${job.id}/run`);
    Toast({
      title: intl.formatMessage(
        {
          id: 'jobs.started',
          defaultMessage: '{jobName} Started',
        },
        {
          jobName:
            job.name ??
            intl.formatMessage({
              id: 'jobs.unknownJob',
              defaultMessage: 'Unknown Job',
            }),
        }
      ),
      type: 'success',
      icon: <CheckBadgeIcon className="size-7" />,
    });
    revalidate();
  };

  const cancelJob = async (job: Job) => {
    await axios.post(`/api/v1/settings/jobs/${job.id}/cancel`);
    Toast({
      title: intl.formatMessage(
        {
          id: 'jobs.canceled',
          defaultMessage: '{jobName} Canceled',
        },
        {
          jobName:
            job.name ??
            intl.formatMessage({
              id: 'jobs.unknownJob',
              defaultMessage: 'Unknown Job',
            }),
        }
      ),
      type: 'error',
      icon: <XCircleIcon className="size-7" />,
    });
    revalidate();
  };

  const flushCache = async (cache: CacheItem) => {
    await axios.post(`/api/v1/settings/cache/${cache.id}/flush`);
    Toast({
      title: intl.formatMessage(
        {
          id: 'cache.flushed',
          defaultMessage: '{cacheName} cache flushed.',
        },
        { cacheName: cache.name }
      ),
      type: 'success',
      icon: <CheckBadgeIcon className="size-7" />,
    });
    cacheRevalidate();
  };

  const scheduleJob = async () => {
    const jobScheduleCron = ['0', '0', '*', '*', '*', '*'];

    try {
      if (jobModalState.job?.interval === 'seconds') {
        jobScheduleCron.splice(0, 2, `*/${jobModalState.scheduleSeconds}`, '*');
      } else if (jobModalState.job?.interval === 'minutes') {
        jobScheduleCron[1] = `*/${jobModalState.scheduleMinutes}`;
      } else if (jobModalState.job?.interval === 'hours') {
        jobScheduleCron[2] = `*/${jobModalState.scheduleHours}`;
      } else {
        // jobs with interval: fixed should not be editable
        throw new Error();
      }

      setIsSaving(true);
      await axios.post(
        `/api/v1/settings/jobs/${jobModalState.job.id}/schedule`,
        {
          schedule: jobScheduleCron.join(' '),
        }
      );

      Toast({
        title: intl.formatMessage({
          id: 'jobs.editSuccess',
          defaultMessage: 'Job Edited Successfully!',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });

      dispatch({ type: 'close' });
      revalidate();
    } catch {
      Toast({
        title: intl.formatMessage({
          id: 'jobs.editError',
          defaultMessage: 'Something went wrong while saving the job.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        title={intl.formatMessage({
          id: 'jobs.modifyTitle',
          defaultMessage: 'Modify Job',
        })}
        okText={
          isSaving
            ? intl.formatMessage({
                id: 'common.saving',
                defaultMessage: 'Saving...',
              })
            : intl.formatMessage({
                id: 'common.saveChanges',
                defaultMessage: 'Save Changes',
              })
        }
        onCancel={() => dispatch({ type: 'close' })}
        okDisabled={isSaving}
        onOk={() => scheduleJob()}
        show={jobModalState.isOpen}
      >
        <div className="mt-5 max-w-6xl space-y-5">
          <form className="mb-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="frequency">
                <FormattedMessage
                  id="jobs.currentFrequency"
                  defaultMessage="Current Frequency"
                />
              </label>
              <div id="frequency" className="col-span-2 mt-2 mb-1">
                <div>
                  {jobModalState.job &&
                    cronstrue.toString(jobModalState.job.cronSchedule)}
                </div>
                <div className="text-sm">{jobModalState.job?.cronSchedule}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
              <label htmlFor="jobSchedule">
                <FormattedMessage
                  id="jobs.newFrequency"
                  defaultMessage="New Frequency"
                />
              </label>
              <div className="col-span-2">
                {jobModalState.job?.interval === 'seconds' ? (
                  <select
                    name="jobScheduleSeconds"
                    className="select select-primary select-sm w-full"
                    value={jobModalState.scheduleSeconds}
                    onChange={(e) =>
                      dispatch({
                        type: 'set',
                        seconds: Number(e.target.value),
                      })
                    }
                  >
                    {[30, 45, 60].map((v) => (
                      <option value={v} key={`jobScheduleSeconds-${v}`}>
                        <FormattedMessage
                          id="jobs.everySeconds"
                          defaultMessage="Every {count, plural, one {# second} other {# seconds}}"
                          values={{ count: v }}
                        />
                      </option>
                    ))}
                  </select>
                ) : jobModalState.job?.interval === 'minutes' ? (
                  <select
                    name="jobScheduleMinutes"
                    className="select select-primary select-sm w-full"
                    value={jobModalState.scheduleMinutes}
                    onChange={(e) =>
                      dispatch({
                        type: 'set',
                        minutes: Number(e.target.value),
                      })
                    }
                  >
                    {[5, 10, 15, 20, 30, 60].map((v) => (
                      <option value={v} key={`jobScheduleMinutes-${v}`}>
                        <FormattedMessage
                          id="jobs.everyMinutes"
                          defaultMessage="Every {count, plural, one {# minute} other {# minutes}}"
                          values={{ count: v }}
                        />
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    name="jobScheduleHours"
                    className="select select-primary select-sm w-full"
                    value={jobModalState.scheduleHours}
                    onChange={(e) =>
                      dispatch({
                        type: 'set',
                        hours: Number(e.target.value),
                      })
                    }
                  >
                    {[1, 2, 3, 4, 6, 8, 12, 24, 48, 72].map((v) => (
                      <option value={v} key={`jobScheduleHours-${v}`}>
                        <FormattedMessage
                          id="jobs.everyHours"
                          defaultMessage="Every {count, plural, one {hour} other {# hours}}"
                          values={{ count: v }}
                        />
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>
      <div className="mt-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage id="jobs.title" defaultMessage="Jobs" />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="jobs.description"
            defaultMessage="Streamarr performs certain maintenance tasks as regularly-scheduled jobs, but they can also be manually triggered below. Manually running a job will not alter its schedule."
          />
        </p>
        <Table>
          <thead>
            <tr>
              <Table.TH>
                <FormattedMessage
                  id="jobs.table.jobName"
                  defaultMessage="Job Name"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage id="common.type" defaultMessage="Type" />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="jobs.table.nextExecution"
                  defaultMessage="Next Execution"
                />
              </Table.TH>
              <Table.TH></Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {data?.map((job) => (
              <tr key={`job-list-${job.id}`}>
                <Table.TD>
                  <div className="flex items-center text-sm leading-5">
                    <span>
                      {job.name ??
                        intl.formatMessage({
                          id: 'jobs.unknownJob',
                          defaultMessage: 'Unknown Job',
                        })}
                    </span>
                    {job.running && <LoadingEllipsis />}
                  </div>
                </Table.TD>
                <Table.TD>
                  <Badge
                    badgeType={job.type === 'process' ? 'primary' : 'warning'}
                    className="uppercase"
                  >
                    {job.type === 'process' ? (
                      <FormattedMessage
                        id="jobs.type.process"
                        defaultMessage="Process"
                      />
                    ) : (
                      <FormattedMessage
                        id="jobs.type.command"
                        defaultMessage="Command"
                      />
                    )}
                  </Badge>
                </Table.TD>
                <Table.TD>
                  <div className="text-sm leading-5">
                    {moment(job.nextExecutionTime).from(now)}
                  </div>
                </Table.TD>
                <Table.TD alignText="right" className="space-y-2">
                  {job.interval !== 'fixed' && (
                    <Button
                      type="button"
                      buttonSize="sm"
                      className="mr-2 max-sm:btn-block"
                      buttonType="warning"
                      onClick={() => dispatch({ type: 'open', job })}
                    >
                      <PencilIcon className="size-5 mr-2" />
                      <FormattedMessage
                        id="common.edit"
                        defaultMessage="Edit"
                      />
                    </Button>
                  )}
                  {job.running ? (
                    <Button
                      type="button"
                      buttonSize="sm"
                      buttonType="error"
                      onClick={() => cancelJob(job)}
                    >
                      <StopIcon className="size-5 mr-2" />
                      <FormattedMessage
                        id="jobs.cancelJob"
                        defaultMessage="Cancel Job"
                      />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      buttonType="primary"
                      buttonSize="sm"
                      className="whitespace-nowrap max-sm:btn-block"
                      onClick={() => runJob(job)}
                    >
                      <PlayIcon className="size-5 mr-2" />
                      <FormattedMessage
                        id="jobs.runNow"
                        defaultMessage="Run Now"
                      />
                    </Button>
                  )}
                </Table.TD>
              </tr>
            ))}
          </Table.TBody>
        </Table>
      </div>
      <div className="my-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage id="cache.title" defaultMessage="Cache" />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="cache.description"
            defaultMessage="Streamarr caches requests to external API endpoints to optimize performance and avoid making unnecessary API calls."
          />
        </p>
        <Table>
          <thead>
            <tr>
              <Table.TH>
                <FormattedMessage
                  id="cache.table.cacheName"
                  defaultMessage="Cache Name"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage id="cache.table.hits" defaultMessage="Hits" />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="cache.table.misses"
                  defaultMessage="Misses"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="cache.table.totalKeys"
                  defaultMessage="Total keys"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="cache.table.keySize"
                  defaultMessage="Key Size"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="cache.table.valueSize"
                  defaultMessage="Value Size"
                />
              </Table.TH>
              <Table.TH></Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {!isLoading ? (
              cacheData?.apiCaches.map((cache) => (
                <tr key={`cache-list-${cache.id}`}>
                  <Table.TD>{cache.name}</Table.TD>
                  <Table.TD>{cache.stats.hits}</Table.TD>
                  <Table.TD>{cache.stats.misses}</Table.TD>
                  <Table.TD>{cache.stats.keys}</Table.TD>
                  <Table.TD>{formatBytes(cache.stats.ksize)}</Table.TD>
                  <Table.TD>{formatBytes(cache.stats.vsize)}</Table.TD>
                  <Table.TD alignText="right">
                    <Button
                      buttonSize="sm"
                      buttonType="error"
                      className="overflow-hidden truncate"
                      onClick={() => flushCache(cache)}
                    >
                      <TrashIcon className="size-5 mr-2" />
                      <FormattedMessage
                        id="cache.flushCache"
                        defaultMessage="Flush Cache"
                      />
                    </Button>
                  </Table.TD>
                </tr>
              ))
            ) : (
              <tr>
                <Table.TD colSpan={7} className="text-center">
                  <LoadingEllipsis />
                </Table.TD>
              </tr>
            )}
          </Table.TBody>
        </Table>
      </div>
      <div>
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="imageCache.title"
            defaultMessage="Image Cache"
          />
        </h3>
        <p className="mb-5 overflow-hidden w-full">
          <FormattedMessage
            id="imageCache.description"
            defaultMessage="Streamarr will proxy and cache images from pre-configured external sources. Cached images are saved into your config folder. You can find the files in <code>{cachePath}</code>"
            values={{
              cachePath: `${appData ? appData.appDataPath : '/app/config'}/cache/images`,
              code: (chunks: React.ReactNode) => (
                <code className="max-sm:block overflow-hidden text-ellipsis">
                  {chunks}
                </code>
              ),
            }}
          />
        </p>
      </div>
      <div className="mb-10">
        <Table>
          <thead>
            <tr>
              <Table.TH>
                <FormattedMessage
                  id="cache.table.cacheName"
                  defaultMessage="Cache Name"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="imageCache.table.imagesCached"
                  defaultMessage="Images Cached"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="imageCache.table.totalCacheSize"
                  defaultMessage="Total Cache Size"
                />
              </Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            <tr>
              <Table.TD>The Movie Database (tmdb)</Table.TD>
              <Table.TD>{cacheData?.imageCache.tmdb.imageCount ?? 0}</Table.TD>
              <Table.TD>
                {formatBytes(cacheData?.imageCache.tmdb.size ?? 0)}
              </Table.TD>
            </tr>
            <tr>
              <Table.TD>
                <FormattedMessage
                  id="imageCache.qrcode"
                  defaultMessage="Invite QR Codes"
                />
              </Table.TD>
              <Table.TD>
                {cacheData?.imageCache.qrcode?.imageCount ?? 0}
              </Table.TD>
              <Table.TD>
                {formatBytes(cacheData?.imageCache.qrcode?.size ?? 0)}
              </Table.TD>
            </tr>
          </Table.TBody>
        </Table>
      </div>
    </>
  );
};
export default JobsCacheSettings;
