import type { ExecFunction } from 'shelljs';
import type { Forge } from '../forges/forge';
import type { Config } from './config';
import type { DefaultLogFields, LogResult, SimpleGit } from 'simple-git';

export type PromiseOrValue<T> = Promise<T> | T;

export type Exec = ExecFunction;

export type CommandContext = {
  exec: Exec;
  config: Config;
  forge: Forge;
  git: SimpleGit;
  latestVersion: string;
  useVersionPrefixV: boolean;
  nextVersion: string;
  pullRequestBranch: string;
  shouldBeRC: boolean;
  changes: Change[];
};

export type Change = {
  title: string;
  author: string;
  commitHash: string;
  pullRequestNumber?: number;
  labels: string[];
};

export type HookContext = {
  exec: Exec;
  latestVersion?: string;
  nextVersion?: string;
  changes?: Change[];
};

export type UserConfig = Partial<{
  /**
   * Get the next version to release. By default pull-request labels will be used.
   */
  getNextVersion: (ctx: HookContext) => PromiseOrValue<string>;

  /**
   * Get the release description.
   *
   * Used as pull-request and release description.
   * By default it's the changelog part of the current / next version.
   */
  getReleaseDescription: (ctx: HookContext) => PromiseOrValue<string>;

  /**
   * Run before the release pull request is created.
   *
   * Could be used to update changelog, version, etc
   */
  beforePrepare: (ctx: HookContext) => PromiseOrValue<boolean | void>;

  /**
   * Run after the release pull request was created.
   *
   * Could be used to notify maintainers about review, etc
   */
  afterPrepare: (ctx: HookContext) => PromiseOrValue<boolean | void>;

  /**
   * Run before the release is created.
   *
   * Could be used to create release notes, etc
   */
  beforeRelease: (ctx: HookContext) => PromiseOrValue<boolean | void>;

  /**
   * Run after the release was created.
   *
   * Could be used to notify maintainers about release, publish release artifacts, etc
   */
  afterRelease: (ctx: HookContext) => PromiseOrValue<boolean | void>;

  /**
   * Determine if a release should be set as latest. Returns true by default.
   *
   * Note: This only has an effect for GitHub releases.
   */
  useLatestRelease: (ctx: HookContext) => PromiseOrValue<boolean>;

  /**
   * Get the latest tag for determining unreleased changes relative to the release branch.
   *
   * This might be useful when working with backports and stable branches to ignore changes from newer tags.
   * Defaults to the latest tag in the repository.
   */
  getLatestTag: (ctx: HookContext) => PromiseOrValue<string>;

  changeTypes: {
    title: string;
    labels: string[];
    bump: 'major' | 'minor' | 'patch';
    default?: boolean;
    weight?: number;
  }[];

  /**
   * Skip commits associated with pull-requests with these labels
   * @default ["skip-release", "skip-changelog", "regression"]
   */
  skipLabels: string[];

  /**
   * Skip commits that are not associated with a pull-request
   * @default true
   */
  skipCommitsWithoutPullRequest: boolean;

  /**
   * Use a 'v' prefix for the version
   * @default true if the previous version already has a v-prefix
   */
  useVersionPrefixV: boolean;

  /**
   * Comment on pull-requests that are included in the release
   * @default true
   */
  commentOnReleasedPullRequests: boolean;
}>;

export const defineConfig = (config: UserConfig) => config;

export type Commit = LogResult<DefaultLogFields>['all'][0];

export type Analyser = {
  getChangesFromCommits(commits: Commit[]): Promise<Change[]>;
};
