import path from 'path';
import { UserConfig } from './types';
import { promises as fs } from 'fs';

const ciConfig = {
  configFile: process.env.PLUGIN_CONFIG_FILE,
  isCI: process.env.CI === 'woodpecker',
  eventType: process.env.CI_PIPELINE_EVENT,
  releaseBranch: process.env.PLUGIN_RELEASE_BRANCH || process.env.CI_REPO_DEFAULT_BRANCH || 'main',
  commitMessage: process.env.CI_COMMIT_MESSAGE,
  forgeType: process.env.CI_FORGE_TYPE,
  githubToken: process.env.PLUGIN_GITHUB_TOKEN,
  gitEmail: process.env.PLUGIN_GIT_EMAIL,
  repoOwner: process.env.CI_REPO_OWNER,
  repoName: process.env.CI_REPO_NAME,
  pullRequestBranchPrefix: process.env.PLUGIN_PULL_REQUEST_BRANCH_PREFIX || 'next-release/',
  releasePrefix: '🎉 Release',
  debug: process.env.PLUGIN_DEBUG === 'true',
};

export type Config = { user: UserConfig; ci: typeof ciConfig };

export const defaultUserConfig: UserConfig = {
  changeTypes: [
    {
      title: '💥 Breaking changes',
      labels: ['breaking'],
      bump: 'major',
      weight: 3,
    },
    {
      title: '🔒 Security',
      labels: ['security'],
      bump: 'patch',
      weight: 2,
    },
    {
      title: '✨ Features',
      labels: ['feature', 'feature 🚀️'],
      bump: 'minor',
      weight: 1,
    },
    {
      title: '📈 Enhancement',
      labels: ['enhancement', 'refactor', 'enhancement 👆️'],
      bump: 'minor',
    },
    {
      title: '🐛 Bug Fixes',
      labels: ['bug', 'bug 🐛️'],
      bump: 'patch',
    },
    {
      title: '📚 Documentation',
      labels: ['docs', 'documentation', 'documentation 📖️'],
      bump: 'patch',
    },
    {
      title: 'Misc',
      labels: ['misc', 'chore 🧰'],
      bump: 'patch',
      default: true,
    },
  ],
  skipLabels: ['skip-release', 'skip-changelog', 'regression'],
  skipCommitsWithoutPullRequest: true,
  commentOnReleasedPullRequests: true,
  sortTags: true,
};

export async function getConfig(): Promise<Config> {
  const userConfig: UserConfig = {};

  const configFilePath = ciConfig.configFile || path.join(process.cwd(), 'release-config.ts');
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
