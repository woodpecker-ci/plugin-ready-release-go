import { ExecFunction } from "shelljs";
import { Forge } from "../forges/forge";
import { Config } from "./config";
import type { SimpleGit } from "simple-git";

export type PromiseOrValue<T> = Promise<T> | T;

export type Exec = ExecFunction;

export type CommandContext = {
  exec: Exec;
  config: Config;
  forge: Forge;
  git: SimpleGit;
  latestVersion: string;
  nextVersion: string;
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
   * Get the branch the release will be created from.
   *
   * Normally main or master
   */
  getReleaseBranch: (ctx: HookContext) => PromiseOrValue<string>;

  /**
   * Get the release description.
   *
   * Used as pull-request and release description.
   * By default it's `Release of ${version}`
   */
  getReleaseDescription: (ctx: HookContext) => PromiseOrValue<string>;

  /**
   * Get the branch used for the release pull request
   *
   * By default it's `next-release/${latest-version}`
   */
  getPullRequestBranch: (ctx: HookContext) => PromiseOrValue<string>;

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
}>;

export const defineConfig = (config: UserConfig) => config;
