import path from 'path';
import { UserConfig } from './types';
import { promises as fs } from 'fs';

const ciConfig = {
  configFile: process.env.PLUGIN_CONFIG_FILE,
  isCI: process.env.CI === 'woodpecker',
  eventType: process.env.CI_PIPELINE_EVENT,
  releaseBranch: process.env.PLUGIN_RELEASE_BRANCH || process.env.CI_REPO_DEFAULT_BRANCH || 'main',
  commitMessage: process.env.CI_COMMIT_MESSAGE,
  forgeType: process.env.PLUGIN_FORGE_TYPE || process.env.CI_FORGE_TYPE,
  forgeToken: process.env.PLUGIN_FORGE_TOKEN || process.env.PLUGIN_GITHUB_TOKEN,
  forgeURL: process.env.PLUGIN_FORGE_URL || process.env.CI_FORGE_URL,
  gitEmail: process.env.PLUGIN_GIT_EMAIL,
  repoOwner: process.env.CI_REPO_OWNER,
  repoName: process.env.CI_REPO_NAME,
  pullRequestBranchPrefix: process.env.PLUGIN_PULL_REQUEST_BRANCH_PREFIX || 'next-release/',
  debug: process.env.PLUGIN_DEBUG === 'true',
  releasePrefix: process.env.PLUGIN_RELEASE_PREFIX || '🎉 Release',
};

export type Config = { user: UserConfig; ci: typeof ciConfig };

export const defaultUserConfig: UserConfig = {
  changeTypes: [
    {
      title: '💥 Breaking changes',
      labels: ['breaking'],
      bump: 'major',
      weight: 5,
    },
    {
      title: '🔒 Security',
      labels: ['security'],
      bump: 'patch',
      weight: 4,
    },
    {
      title: '✨ Features',
      labels: ['feature', 'feature 🚀️'],
      bump: 'minor',
      weight: 3,
    },
    {
      title: '📈 Enhancement',
      labels: ['enhancement', 'refactor', 'enhancement 👆️'],
      bump: 'minor',
      weight: 2,
    },
    {
      title: '🐛 Bug Fixes',
      labels: ['bug', 'bug 🐛️'],
      bump: 'patch',
      weight: 1,
    },
    {
      title: '📚 Documentation',
      labels: ['docs', 'documentation', 'documentation 📖️'],
      bump: 'patch',
      weight: 0,
    },
    {
      title: '📦️ Dependency',
      labels: ['dependency', 'dependencies'],
      bump: 'patch',
      weight: -1,
    },
    {
      title: 'Misc',
      labels: ['misc', 'chore 🧰'],
      bump: 'patch',
      default: true,
      weight: -2,
    },
  ],
  skipLabels: ['skip-release', 'skip-changelog', 'regression'],
  skipCommitsWithoutPullRequest: true,
  commentOnReleasedPullRequests: false,
};

export async function getConfig(basePath?: string): Promise<Config> {
  const userConfig: UserConfig = {};

  const configFilePath = ciConfig.configFile || path.resolve(basePath ?? process.cwd(), 'release-config.ts');
  if (
    await fs
      .stat(configFilePath)
      .then(() => true)
      .catch(() => false)
  ) {
    console.log('# Loading config from', configFilePath, '...');
    const _userConfig = await import(configFilePath);
    Object.assign(userConfig, _userConfig.default);
    console.log('# Loaded config from', configFilePath);
  }

  return {
    user: { ...defaultUserConfig, ...userConfig },
    ci: ciConfig,
  };
}
