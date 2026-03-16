import cacheManager from '@server/lib/cache';
import type { GitHubRelease } from '@server/interfaces/api/settingsInterfaces';
import logger from '@server/logger';
import ExternalAPI from './externalapi';

const GITHUB_CACHE_TTL = 1800;

interface GithubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    message: string;
    tree: { sha: string; url: string };
    url: string;
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: string;
      payload: string;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  parents: [{ sha: string; url: string; html_url: string }];
}

class GithubAPI extends ExternalAPI {
  constructor() {
    super(
      'https://api.github.com',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        nodeCache: cacheManager.getCache('github').data,
      }
    );
  }

  public async getStreamarrReleases({
    take = 20,
  }: { take?: number } = {}): Promise<GitHubRelease[]> {
    try {
      const data = await this.get<GitHubRelease[]>(
        '/repos/nickelsh1ts/streamarr/releases',
        { params: { per_page: take } },
        GITHUB_CACHE_TTL
      );

      return data;
    } catch (e) {
      logger.warn(
        "Failed to retrieve GitHub releases. This may be an issue on GitHub's end. Streamarr can't check if it's on the latest version.",
        {
          label: 'GitHub API',
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      );
      return [];
    }
  }

  public async getStreamarrCommits({
    take = 20,
    branch = 'develop',
  }: { take?: number; branch?: string } = {}): Promise<GithubCommit[]> {
    try {
      const data = await this.get<GithubCommit[]>(
        '/repos/nickelsh1ts/streamarr/commits',
        { params: { per_page: take, branch } },
        GITHUB_CACHE_TTL
      );

      return data;
    } catch (e) {
      logger.warn(
        "Failed to retrieve GitHub commits. This may be an issue on GitHub's end. Streamarr can't check if it's on the latest version.",
        {
          label: 'GitHub API',
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      );
      return [];
    }
  }
}

export default GithubAPI;
