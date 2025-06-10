import useIsAdmin from '@app/hooks/useIsAdmin';
import {
  ArrowUpCircleIcon,
  BeakerIcon,
  CodeBracketIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface VersionStatusProps {
  onClick?: () => void;
}

const VersionStatus = ({ onClick }: VersionStatusProps) => {
  const versionStream = `${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'} Preview 💾`;
  const isAdmin = useIsAdmin();
  const data = {
    updateAvailable: false,
    commitTag: 'develop',
    version: '0.00.1',
    commitsBehind: 0,
  };

  return (
    <Link
      href={`${isAdmin ? '/admin/settings/about' : '/help'}`}
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
        <span className="truncate">
          {data.commitTag === 'local' ? (
            'local version'
          ) : data.commitsBehind > 0 ? (
            data.commitsBehind + ' commit(s) behind'
          ) : data.commitsBehind === -1 ? (
            'out of date'
          ) : (
            <code className="bg-transparent p-0">{data.version}</code>
          )}
        </span>
      </div>
      {data.updateAvailable && <ArrowUpCircleIcon className="h-6 w-6" />}
    </Link>
  );
};

export default VersionStatus;
