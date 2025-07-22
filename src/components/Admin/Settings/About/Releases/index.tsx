'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import useSWR from 'swr';
import moment from 'moment';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
});
const REPO_RELEASE_API =
  'https://api.github.com/repos/nickelsh1ts/streamarr/releases?per_page=20';

interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  tarball_url: string;
  zipball_url: string;
  body: string;
}

interface ReleaseProps {
  release: GitHubRelease;
  isLatest: boolean;
  currentVersion: string;
}

const Release = ({ currentVersion, release, isLatest }: ReleaseProps) => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex w-full flex-col space-y-3 rounded-md bg-secondary px-4 py-2 shadow-md ring-1 ring-primary sm:flex-row sm:space-y-0 sm:space-x-3">
      <Modal
        onCancel={() => setModalOpen(false)}
        title={`${release.tag_name} Changelog`}
        subtitle={release.name}
        show={isModalOpen}
        okText={'View on GitHub'}
        onOk={() => {
          window.open(release.html_url, '_blank');
        }}
      >
        <div className="prose overflow-auto">
          <ReactMarkdown>{release.body}</ReactMarkdown>
        </div>
      </Modal>
      <div className="flex w-full flex-grow items-center justify-center space-x-2 truncate sm:justify-start">
        <span className="truncate text-lg font-bold">
          <span className="mr-2 whitespace-nowrap text-xs font-normal align-center">
            {moment(release.created_at)?.fromNow()}
          </span>
          {release.tag_name}
        </span>
        {isLatest && <Badge badgeType="success">Latest Version</Badge>}
        {release.name.includes(currentVersion) && (
          <Badge badgeType="primary">Current Version</Badge>
        )}
      </div>
      <Button
        type="button"
        buttonSize="sm"
        buttonType="primary"
        onClick={() => setModalOpen(true)}
      >
        <DocumentTextIcon className="size-6 mr-2" />
        <span>View Changelog</span>
      </Button>
    </div>
  );
};

interface ReleasesProps {
  currentVersion: string;
}

const Releases = ({ currentVersion }: ReleasesProps) => {
  const { data, error } = useSWR<GitHubRelease[]>(REPO_RELEASE_API);

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return (
      <div className="text-gray-300">Release data is currently unavailable</div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold">Releases</h3>
      <div className="mt-6 mb-10 space-y-3">
        {data.map((release, index) => {
          return (
            <div key={`release-${release.id}`}>
              <Release
                release={release}
                currentVersion={currentVersion}
                isLatest={index === 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Releases;
