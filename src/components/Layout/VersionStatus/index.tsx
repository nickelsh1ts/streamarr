'use client';
import {
  ArrowUpCircleIcon,
  BeakerIcon,
  CodeBracketIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import type { StatusResponse } from '@server/interfaces/api/settingsInterfaces';
import Link from 'next/link';
import useSWR from 'swr';

interface VersionStatusProps {
  onClick?: () => void;
}

const VersionStatus = ({ onClick }: VersionStatusProps) => {
  const { data } = useSWR<StatusResponse>('/api/v1/status', {
    refreshInterval: 60 * 1000,
  });

  if (!data) {
    return null;
  }

  const versionStream =
    data.commitTag === 'local'
      ? 'Keep it up! 💾'
      : data.version.startsWith('develop-')
        ? 'Streamarr Develop'
        : 'Streamarr Stable';

  return (
    <Link
      href="/admin/settings/system"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={`flex items-center rounded-lg p-2 pl-5 text-xs transition duration-300 pointer-events-auto ${
        data.updateAvailable
          ? 'bg-warning bg-opacity-60 backdrop-blur text-white hover:bg-opacity-50'
          : 'bg-primary bg-opacity-30 backdrop-blur text-primary-content hover:bg-opacity-20'
      }`}
    >
      {data.commitTag === 'local' ? (
        <CodeBracketIcon className="h-6 w-6" />
      ) : data.version.startsWith('develop-') ? (
        <BeakerIcon className="h-6 w-6" />
      ) : (
        <ServerIcon className="h-6 w-6" />
      )}
      <div className="flex min-w-0 flex-1 flex-col truncate px-2 last:pr-0">
        <span className="font-bold">{versionStream}</span>
        <span className="overflow-hidden text-ellipsis">
          {data.commitTag === 'local' ? (
            'working on it'
          ) : data.commitsBehind > 0 ? (
            data.commitsBehind + ' commit(s) behind'
          ) : data.commitsBehind === -1 ? (
            'out of date'
          ) : (
            <code className="bg-transparent p-0">
              {data.version.replace('develop-', '')}
            </code>
          )}
        </span>
      </div>
      {data.updateAvailable && <ArrowUpCircleIcon className="h-6 w-6" />}
    </Link>
  );
};

export default VersionStatus;
