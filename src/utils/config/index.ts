import path from 'path';
import { UserConfig } from '../types';
import { promises as fs } from 'fs';
import type { CIConfig, Config } from '../types';
import { getWoodpeckerConfig } from './woodpecker';
import { getGithubActionsConfig } from './github-actions';

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
};

const defaultCIConfig: CIConfig = {
  eventType: 'manual',
  releaseBranch: 'main',
  commitMessage: '',
  forgeType: 'github',
  githubToken: '',
  gitEmail: '',
  repoOwner: '',
  repoName: '',
  pullRequestBranchPrefix: 'next-release/',
  releasePrefix: '🎉 Release',
  debug: false,
};

export async function getConfig(): Promise<Config> {
  const userConfig: UserConfig = {};
  let ciConfig: CIConfig = defaultCIConfig;

  if (process.env.CI === 'woodpecker') {
    console.log('# CI: Woodpecker');
    ciConfig = { ...defaultCIConfig, ...getWoodpeckerConfig() };
  } else if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('# CI: GitHub Actions');
    ciConfig = { ...defaultCIConfig, ...getGithubActionsConfig() };
  } else {
    throw new Error('Unsupported CI type');
  }

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
