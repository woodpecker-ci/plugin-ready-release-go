import path from "path";
import { UserConfig } from "./types";

const ciConfig = {
  configFile: process.env.PLUGIN_CONFIG_FILE,
  isCI: process.env.CI === "woodpecker",
  eventType: process.env.PLUGIN_EVENT_TYPE || process.env.CI_PIPELINE_EVENT,
  branch: process.env.PLUGIN_BRANCH || process.env.CI_COMMIT_BRANCH,
  commitMessage:
    process.env.PLUGIN_COMMIT_MESSAGE || process.env.CI_COMMIT_MESSAGE,
  forgeType: process.env.PLUGIN_FORGE_TYPE || process.env.CI_REPO_FORGE_TYPE,
  githubToken: process.env.PLUGIN_GITHUB_TOKEN,
  gitEmail: process.env.PLUGIN_GIT_EMAIL,
  repoOwner: process.env.PLUGIN_REPO_OWNER || process.env.CI_REPO_OWNER,
  repoName: process.env.PLUGIN_REPO_NAME || process.env.CI_REPO_NAME,
};

export type Config = { user: UserConfig; ci: typeof ciConfig };

const defaultUserConfig: UserConfig = {
  getNextVersion: async () => "0.0.0", // TODO,
  getReleaseBranch: () => "main",
  getReleaseDescription: ({ nextVersion }) => `Release of ${nextVersion}`,
  getPullRequestBranch: ({ version }) => `next-release/${version}`,
  beforePrepare: async () => true,
  afterPrepare: async () => true,
  beforeRelease: async () => true,
  afterRelease: async () => true,
};

export async function getConfig(): Promise<Config> {
  const userConfig: Partial<UserConfig> = {};

  const configFilePath =
    ciConfig.configFile || path.join(process.cwd(), "release-config.ts");
  if (configFilePath) {
    console.log("# Loading config from", configFilePath, "...");
    const _userConfig = await import(configFilePath);
    Object.assign(userConfig, _userConfig.default);
    console.log("# Loaded config from", configFilePath);
  }

  return {
    user: { ...defaultUserConfig, ...userConfig },
    ci: ciConfig,
  };
}
