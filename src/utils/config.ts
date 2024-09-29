import path from 'node:path';
import { UserConfig } from './types.ts';

const ciConfig = {
  configFile: Deno.env.get('PLUGIN_CONFIG_FILE'),
  isCI: Deno.env.get('CI') === 'woodpecker',
  eventType: Deno.env.get('CI_PIPELINE_EVENT'),
  releaseBranch: Deno.env.get('PLUGIN_RELEASE_BRANCH') || Deno.env.get('CI_REPO_DEFAULT_BRANCH') || 'main',
  commitMessage: Deno.env.get('CI_COMMIT_MESSAGE'),
  forgeType: Deno.env.get('PLUGIN_FORGE_TYPE') || Deno.env.get('CI_FORGE_TYPE'),
  forgeToken: Deno.env.get('PLUGIN_FORGE_TOKEN') || Deno.env.get('PLUGIN_GITHUB_TOKEN'),
  forgeURL: Deno.env.get('PLUGIN_FORGE_URL') || Deno.env.get('CI_FORGE_URL'),
  gitEmail: Deno.env.get('PLUGIN_GIT_EMAIL'),
  repoOwner: Deno.env.get('CI_REPO_OWNER'),
  repoName: Deno.env.get('CI_REPO_NAME'),
  pullRequestBranchPrefix: Deno.env.get('PLUGIN_PULL_REQUEST_BRANCH_PREFIX') || 'next-release/',
  releasePrefix: '🎉 Release',
  debug: Deno.env.get('PLUGIN_DEBUG') === 'true',
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
  commentOnReleasedPullRequests: true,
};

export async function getConfig(): Promise<Config> {
  const userConfig: UserConfig = {};

  const configFilePath = ciConfig.configFile || path.join(Deno.cwd(), 'release-config.ts');
  if (
    await Deno.stat(configFilePath)
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
