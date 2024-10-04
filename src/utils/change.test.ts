import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { getChangeLogSection } from './change';
import { Config } from './config';
import { Change } from './types';
import { Forge } from '../forges/forge';
import { GithubForge } from '../forges/github';

function getMockedForge(): Forge {
  const forge = new GithubForge('', '');

  vi.spyOn(forge, 'getPullRequest').mockImplementation(
    (o: { owner: string; repo: string; sourceBranch: string; targetBranch: string }) => {
      return Promise.resolve(undefined);
    },
  );

  vi.spyOn(forge, 'getPullRequestFromCommit').mockImplementation(
    (o: { owner: string; repo: string; commitHash: string }) => {
      switch (o.commitHash) {
        case '1':
          return Promise.resolve({
            number: 1,
            title: 'Fix sth on the backend',
            author: 'anbraten',
            description: '',
            labels: ['bug'],
          });

        case '2':
          return Promise.resolve({
            number: 2,
            title: 'Add some nice feature to the ui',
            author: 'anbraten',
            description: '',
            labels: ['feature'],
          });

        case '3':
          return Promise.resolve({
            number: 3,
            title: 'docs: Update documentation',
            author: 'anbraten',
            description: '',
            labels: [],
          });

        case '4':
          return Promise.resolve({
            number: 4,
            title: 'feat: Add a new feature',
            author: 'anbraten',
            description: '',
            labels: ['bug'], // Label should take precedence over commit message
          });

        default:
          return Promise.resolve(undefined);
      }
    },
  );

  return forge;
}

describe('getChangeLogSection', () => {
  beforeAll(() => {
    const date = new Date(2000, 1, 1, 13);
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should group changes by labels and then by commit messages', () => {
    const config: Config = {
      user: {
        changeTypes: [
          {
            title: '💥 Breaking changes',
            labels: ['breaking'],
            bump: 'major',
            commitMessage: ["breaking:"],
            weight: 3,
          },
          {
            title: '🔒 Security',
            labels: ['security'],
            bump: 'patch',
            commitMessage: ["sec:"],
            weight: 2,
          },
          {
            title: '✨ Features',
            labels: ['feature', 'feature 🚀️'],
            commitMessage: ["feat:"],
            bump: 'minor',
            weight: 1,
          },
          {
            title: '📈 Enhancement',
            labels: ['enhancement', 'refactor', 'enhancement 👆️'],
            commitMessage: ["refactor:"],
            bump: 'minor',
          },
          {
            title: '🐛 Bug Fixes',
            labels: ['bug', 'bug 🐛️'],
            commitMessage: ["fix:"],
            bump: 'patch',
          },
          {
            title: '📚 Documentation',
            labels: ['docs', 'documentation', 'documentation 📖️'],
            commitMessage: ["docs:"],
            bump: 'patch',
          },
          {
            title: '📦️ Dependency',
            labels: ['dependency', 'dependencies'],
            bump: 'patch',
            commitMessage: [""],
            weight: -1,
          },
          {
            title: 'Misc',
            labels: ['misc', 'chore 🧰'],
            commitMessage: ["chore:"],
            bump: 'patch',
            default: true,
            weight: -2,
          },
        ],
        skipLabels: ['skip-release', 'skip-changelog', 'regression'],
        skipCommitsWithoutPullRequest: true,
        commentOnReleasedPullRequests: true,
        groupByCommitMessage: true,
      },
      ci: {
        repoOwner: 'woodpecker-ci',
        repoName: 'plugin-ready-release-go',
        configFile: undefined,
        isCI: false,
        eventType: undefined,
        releaseBranch: 'main',
        commitMessage: undefined,
        forgeType: undefined,
        forgeToken: undefined,
        forgeURL: 'dummy',
        gitEmail: 'dummy',
        pullRequestBranchPrefix: 'next-release/',
        releasePrefix: '🎉 Release',
        debug: false,
      },
    };

    const changes: Change[] = [
      {
        commitHash: '1',
        title: 'Fix sth on the backend',
        author: 'anbraten',
        labels: ['bug'],
        pullRequestNumber: 1,
      },
      {
        commitHash: '2',
        title: 'Add some nice feature to the ui',
        author: 'anbraten',
        labels: ['feature'],
        pullRequestNumber: 2,
      },
      {
        commitHash: '3',
        title: 'docs: Update documentation',
        author: 'anbraten',
        labels: [],
        pullRequestNumber: 3,
      }
    ];

    const forge = getMockedForge();
    const changeLogSection = getChangeLogSection('1.0.0', 'v1.0.0', config, changes, forge, true);

    expect(changeLogSection).toContain('### ✨ Features');
    expect(changeLogSection).toContain(
      '- Add some nice feature to the ui [[#2](https://github.com/woodpecker-ci/plugin-ready-release-go/pull/2)]',
    );
    expect(changeLogSection).toContain('### 📚 Documentation');
    expect(changeLogSection).toContain(
      '- docs: Update documentation [[#3](https://github.com/woodpecker-ci/plugin-ready-release-go/pull/3)]',
    );
    expect(changeLogSection).toContain('### 🐛 Bug Fixes');
    expect(changeLogSection).toContain(
      '- Fix sth on the backend [[#1](https://github.com/woodpecker-ci/plugin-ready-release-go/pull/1)]',
    );
  });

  it('should prefer labels over commit messages when both are present', () => {
    const config: Config = {
      user: {
        changeTypes: [
          {
            title: '💥 Breaking changes',
            labels: ['breaking'],
            bump: 'major',
            commitMessage: ['breaking:'],
            weight: 3,
          },
          {
            title: '🔒 Security',
            labels: ['security'],
            bump: 'patch',
            commitMessage: ['sec:'],
            weight: 2,
          },
          {
            title: '✨ Features',
            labels: ['feature', 'feature 🚀️'],
            commitMessage: ['feat:'],
            bump: 'minor',
            weight: 1,
          },
          {
            title: '📈 Enhancement',
            labels: ['enhancement', 'refactor', 'enhancement 👆️'],
            commitMessage: ['refactor:'],
            bump: 'minor',
          },
          {
            title: '🐛 Bug Fixes',
            labels: ['bug', 'bug 🐛️'],
            commitMessage: ['fix:'],
            bump: 'patch',
          },
          {
            title: '📚 Documentation',
            labels: ['docs', 'documentation', 'documentation 📖️'],
            commitMessage: ['docs:'],
            bump: 'patch',
          },
          {
            title: '📦️ Dependency',
            labels: ['dependency', 'dependencies'],
            bump: 'patch',
            commitMessage: [''],
            weight: -1,
          },
          {
            title: 'Misc',
            labels: ['misc', 'chore 🧰'],
            commitMessage: ['chore:'],
            bump: 'patch',
            default: true,
            weight: -2,
          },
        ],
        skipLabels: ['skip-release', 'skip-changelog', 'regression'],
        skipCommitsWithoutPullRequest: true,
        commentOnReleasedPullRequests: true,
        groupByCommitMessage: true,
      },
      ci: {
        repoOwner: 'woodpecker-ci',
        repoName: 'plugin-ready-release-go',
        configFile: undefined,
        isCI: false,
        eventType: undefined,
        releaseBranch: 'main',
        commitMessage: undefined,
        forgeType: undefined,
        forgeToken: undefined,
        forgeURL: 'dummy',
        gitEmail: 'dummy',
        pullRequestBranchPrefix: 'next-release/',
        releasePrefix: '🎉 Release',
        debug: false,
      },
    };

    const changes: Change[] = [
      {
        commitHash: '4',
        title: 'feat: Add a new feature',
        author: 'anbraten',
        labels: ['bug'], // Label should take precedence over commit message
        pullRequestNumber: 4,
      },
    ];

    const forge = getMockedForge();
    const changeLogSection = getChangeLogSection('1.0.0', 'v1.0.0', config, changes, forge, true);

    expect(changeLogSection).toContain('### 🐛 Bug Fixes');
    expect(changeLogSection).toContain(
      '- feat: Add a new feature [[#4](https://github.com/woodpecker-ci/plugin-ready-release-go/pull/4)]',
    );
  });
});
