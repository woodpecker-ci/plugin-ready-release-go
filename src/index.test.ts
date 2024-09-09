import { describe, it, expect, vi, beforeAll, afterEach, MockedFunction } from 'vitest';
import { run } from './index';
import { Config, defaultUserConfig } from './utils/config';
import { GithubForge } from './forges/github';
import { SimpleGit, simpleGit } from 'simple-git';

import { prepare } from './cmd/prepare';
import { release } from './cmd/release';

const config: Config = {
  ci: {
    releaseBranch: 'main',
    commitMessage: 'chore(release): 1.0.0 [skip ci]',
    configFile: 'ready-go-release.config.ts',
    eventType: 'push',
    gitEmail: 'ci@woodpecker-ci.org',
    repoOwner: 'woodpecker-ci',
    repoName: 'woodpecker',
    forgeType: 'github',
    forgeToken: '123',
    forgeURL: '',
    pullRequestBranchPrefix: 'next-release/',
    isCI: true,
    releasePrefix: '🎉 Release',
    debug: false,
  },
  user: defaultUserConfig,
};

vi.mock('./cmd/prepare');
vi.mock('./cmd/release');

describe('index', () => {
  beforeAll(() => {
    const date = new Date(2000, 1, 1, 13);
    vi.setSystemTime(date);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should prepare a new release', async () => {
    const git = getMockedGit();
    const forge = getMockedForged();

    const latestTag = '1.0.4';
    const tags = ['1.0.3', '2.0.1', latestTag];
    vi.spyOn(git, 'tags').mockImplementation(() => mockSimpleGitResponse({ all: tags, latest: latestTag }));

    const commits = [
      {
        hash: '1',
        date: '',
        message: 'fix sth on the backend',
        refs: '',
        body: '',
        author_name: '',
        author_email: '',
        diff: undefined,
      },
      {
        hash: '2',
        date: '',
        message: 'add some nice feature to the ui',
        refs: '',
        body: '',
        author_name: '',
        author_email: '',
        diff: undefined,
      },
    ];
    vi.spyOn(git, 'log').mockImplementation(() =>
      mockSimpleGitResponse({
        all: commits,
        total: commits.length,
        latest: commits[0],
      }),
    );

    const _prepare = prepare as MockedFunction<typeof prepare>;
    _prepare.mockImplementation(() => {
      return Promise.resolve();
    });

    await run({
      git,
      forge,
      config,
    });

    expect(prepare).toHaveBeenCalledWith({
      exec: expect.anything(),
      config: expect.anything(),
      forge: expect.anything(),
      git: expect.anything(),
      latestVersion: '2.0.1',
      useVersionPrefixV: false,
      nextVersion: '2.1.0',
      pullRequestBranch: 'next-release/main',
      shouldBeRC: false,
      changes: expect.anything(),
    });
  });

  it.todo('should prepare a new rc release');

  it.todo('should prepare a new release after an rc release');

  it.todo('should release a new release');
  it.todo('should release a new rc release');
});

type SimpleGitResponse<T> = SimpleGit & Promise<T>;

const mockSimpleGitResponse = <T>(value: T): SimpleGitResponse<T> => {
  return Promise.resolve(value) as SimpleGitResponse<T>;
};

function getMockedGit(): SimpleGit {
  const git = simpleGit();
  vi.spyOn(git, 'addConfig').mockImplementation(() => mockSimpleGitResponse(''));
  vi.spyOn(git, 'getRemotes').mockImplementation(() =>
    mockSimpleGitResponse([
      {
        name: 'origin',
        refs: {
          fetch: '',
          push: 'https://oauth:token123@github.com/woodpecker-ci/woodpecker',
        },
      },
    ]),
  );

  vi.spyOn(git, 'fetch').mockImplementation(() =>
    mockSimpleGitResponse({
      raw: '',
      remote: null,
      branches: [],
      tags: [],
      updated: [],
      deleted: [],
    }),
  );
  vi.spyOn(git, 'checkout').mockImplementation(() => mockSimpleGitResponse(''));
  vi.spyOn(git, 'branch').mockImplementation(() =>
    mockSimpleGitResponse({
      detached: false,
      current: '',
      all: [],
      branches: {},
    }),
  );
  vi.spyOn(git, 'pull').mockImplementation(() =>
    mockSimpleGitResponse({
      files: [],
      insertions: {},
      deletions: {},
      summary: {
        changes: 0,
        insertions: 0,
        deletions: 0,
      },
      created: [],
      deleted: [],
      remoteMessages: {
        all: [],
      },
    }),
  );

  return git;
}

function getMockedForged() {
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

        default:
          return Promise.resolve(undefined);
      }
    },
  );

  return forge;
}
