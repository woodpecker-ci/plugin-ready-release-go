import { CIConfig } from '../types';

export function getWoodpeckerConfig(): Partial<CIConfig> {
  return {
    configFile: process.env.PLUGIN_CONFIG_FILE,
    eventType: process.env.CI_PIPELINE_EVENT,
    releaseBranch: process.env.PLUGIN_RELEASE_BRANCH || process.env.CI_REPO_DEFAULT_BRANCH,
    commitMessage: process.env.CI_COMMIT_MESSAGE,
    forgeType: process.env.CI_FORGE_TYPE,
    githubToken: process.env.PLUGIN_GITHUB_TOKEN,
    gitEmail: process.env.PLUGIN_GIT_EMAIL,
    repoOwner: process.env.CI_REPO_OWNER,
    repoName: process.env.CI_REPO_NAME,
    pullRequestBranchPrefix: process.env.PLUGIN_PULL_REQUEST_BRANCH_PREFIX,
    debug: process.env.PLUGIN_DEBUG === 'true',
  };
}
