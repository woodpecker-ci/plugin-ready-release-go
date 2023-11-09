import type { ExecFunction } from "shelljs";
import type { Forge, PullRequest } from "../forges/forge";
import type { Config } from "./config";
import type { SimpleGit } from "simple-git";

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

  changeTypes: {
    title: string;
    labels: string[];
    bump: "major" | "minor" | "patch";
    default?: boolean;
    weight?: number;
  }[];

  skipLabels: string[];

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
