import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Table from '@app/components/Common/Table';
import { PencilIcon, StopIcon, PlayIcon } from '@heroicons/react/24/outline';

interface Job {
  id: string;
  name?: string;
  type: 'process' | 'command';
  interval: 'seconds' | 'minutes' | 'hours' | 'fixed';
  running: boolean;
}

const JobsCacheSettings = () => {
  const data: Job[] = [
    {
      id: 'plex-library-sync',
      name: 'Plex Library Sync',
      type: 'process',
      interval: 'hours',
      running: false,
    },
    {
      id: 'image-cache-cleanup',
      name: 'Image Cache Cleanup',
      type: 'process',
      interval: 'hours',
      running: false,
    },
  ];

  const cacheData = {
    imageCache: { tmdb: { imageCount: 41416, size: '978.51 MB' } },
  };

  return (
    <>
      <form className="mt-6 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Jobs</h3>
        <p className="mb-5">
          Streamarr performs certain maintenance tasks as regularly-scheduled
          jobs, but they can also be manually triggered below. Manually running
          a job will not alter its schedule.
        </p>
        <Table>
          <thead>
            <tr>
              <Table.TH>Job Name</Table.TH>
              <Table.TH>Type</Table.TH>
              <Table.TH>Next Execution</Table.TH>
              <Table.TH></Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {data?.map((job) => (
              <tr key={`job-list-${job.id}`}>
                <Table.TD>
                  <div className="flex items-center text-sm leading-5 text-white">
                    <span>{job.name ?? 'Unknown Job'}</span>
                    {job.running && <LoadingEllipsis />}
                  </div>
                </Table.TD>
                <Table.TD>
                  <Badge
                    badgeType={job.type === 'process' ? 'primary' : 'warning'}
                    className="uppercase"
                  >
                    {job.type === 'process' ? 'Process' : 'Command'}
                  </Badge>
                </Table.TD>
                <Table.TD>
                  <div className="text-sm leading-5 text-white">in 1 hour</div>
                </Table.TD>
                <Table.TD alignText="right">
                  {job.interval !== 'fixed' && (
                    <Button
                      buttonSize="sm"
                      className="mr-2"
                      buttonType="warning"
                    >
                      <PencilIcon className="size-5 mr-2" />
                      Edit
                    </Button>
                  )}
                  {job.running ? (
                    <Button buttonSize="sm" buttonType="error">
                      <StopIcon className="size-5 mr-2" />
                      Cancel Job
                    </Button>
                  ) : (
                    <Button
                      buttonType="primary"
                      buttonSize="sm"
                      className="whitespace-nowrap"
                    >
                      <PlayIcon className="size-5 mr-2" />
                      Run Now
                    </Button>
                  )}
                </Table.TD>
              </tr>
            ))}
          </Table.TBody>
        </Table>
      </form>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Image Cache</h3>
        <p className="mb-5">
          Streamarr will proxy and cache images from pre-configured external
          sources. Cached images are saved into your config folder. You can find
          the files in <code>/app/config/cache/images</code>.
        </p>
        <Table>
          <thead>
            <tr>
              <Table.TH>Cache Name</Table.TH>
              <Table.TH>Images Cached</Table.TH>
              <Table.TH>Total Cache Size</Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            <tr>
              <Table.TD>The Movie Database (tmdb)</Table.TD>
              <Table.TD>{cacheData?.imageCache?.tmdb.imageCount ?? 0}</Table.TD>
              <Table.TD>{cacheData?.imageCache?.tmdb.size ?? 0}</Table.TD>
            </tr>
          </Table.TBody>
        </Table>
      </form>
    </>
  );
};
export default JobsCacheSettings;
