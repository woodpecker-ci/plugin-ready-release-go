import { ExecFunction } from "shelljs";
import { Forge } from "../forges/forge";
import { Config } from "./config";
import { Git } from "./git";

export type PromiseOrValue<T> = Promise<T> | T;

export type Exec = ExecFunction;

export type CommandContext = {
  exec: Exec;
  config: Config;
  forge: Forge;
  git: Git;
};

export type HookContext = {
  exec: Exec;
  nextVersion: string;
};

export type UserConfig = {
  /**
   * Get the next version to release.
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
   * By default it's `next-release/${version}`
   */
  getPullRequestBranch: (o: { version: string }) => PromiseOrValue<string>;

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
};

export const defineConfig = (config: Partial<UserConfig>) => config;
