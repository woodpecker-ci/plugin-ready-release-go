import { describe, it, expect, vi } from 'vitest';
import { GiteaForge } from './gitea';

const options = { owner: 'o', repo: 'r', sourceBranch: 'next-release/main', targetBranch: 'main' };

const mergedReleasePullRequest = {
  number: 1,
  title: '🎉 Release 1.0.0-rc.0',
  body: '- [x] Mark this version as a release candidate',
  state: 'closed',
  merged: true,
  user: { login: 'bot' },
  labels: [],
  base: { ref: 'main' },
  head: { ref: 'next-release/main' },
};

function getForge(openPullRequests: object[]) {
  const forge = new GiteaForge('https://gitea.example.com', 'token', 'bot@example.com');
  const repos = {
    repoListPullRequests: vi.fn().mockResolvedValue({ data: openPullRequests }),
    // Gitea returns any pull request for base/head, including already merged ones
    repoGetPullRequestByBaseHead: vi.fn().mockResolvedValue({ data: mergedReleasePullRequest }),
  };
  forge.api = { repos } as unknown as GiteaForge['api'];
  return { forge, repos };
}

describe('GiteaForge.getPullRequest', () => {
  it('ignores merged pull requests of a reused release branch', async () => {
    const { forge } = getForge([]);

    expect(await forge.getPullRequest(options)).toBeUndefined();
  });

  it('returns the open release pull request', async () => {
    const { forge, repos } = getForge([
      {
        number: 7,
        title: '🎉 Release 1.1.0',
        body: '- [ ] Mark this version as a release candidate',
        state: 'open',
        user: { login: 'bot' },
        labels: [{ name: 'misc' }],
        base: { ref: 'main' },
        head: { ref: 'next-release/main' },
      },
    ]);

    expect(await forge.getPullRequest(options)).toEqual({
      number: 7,
      title: '🎉 Release 1.1.0',
      author: 'bot',
      description: '- [ ] Mark this version as a release candidate',
      labels: ['misc'],
    });
    expect(repos.repoListPullRequests).toHaveBeenCalledWith('o', 'r', expect.objectContaining({ state: 'open' }));
  });
});
