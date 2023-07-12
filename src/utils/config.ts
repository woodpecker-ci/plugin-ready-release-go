import path from "path";
import { UserConfig } from "./types";
import { promises as fs } from "fs";

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
  releasePrefix: "🎉 Release",
};

export type Config = { user: UserConfig; ci: typeof ciConfig };

export const defaultUserConfig: UserConfig = {
  changeTypes: [
    {
      title: "💥 Breaking changes",
      labels: ["breaking"],
      bump: "major",
      weight: 3,
    },
    {
      title: "🔒 Security",
      labels: ["security"],
      bump: "patch",
      weight: 2,
    },
    {
      title: "✨ Features",
      labels: ["feature"],
      bump: "minor",
      weight: 1,
    },
    {
      title: "📈 Enhancement",
      labels: ["enhancement", "refactor"],
      bump: "patch",
    },
    {
      title: "🐛 Bug Fixes",
      labels: ["bug"],
      bump: "patch",
    },
    {
      title: "📚 Documentation",
      labels: ["docs", "documentation"],
      bump: "patch",
    },
    {
      title: "Misc",
      labels: ["misc"],
      bump: "patch",
      default: true,
    },
  ],
  skipLabels: ["skip-release", "skip-changelog"],
};

export async function getConfig(): Promise<Config> {
  const userConfig: UserConfig = {};

  const configFilePath =
    ciConfig.configFile || path.join(process.cwd(), "release-config.ts");
  if (
    await fs
      .stat(configFilePath)
      .then(() => true)
      .catch(() => false)
  ) {
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
