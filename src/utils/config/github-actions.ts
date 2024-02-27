import { CIConfig } from '../types';

export function getGithubActionsConfig(): Partial<CIConfig> {
  const eventType = process.env.GITHUB_EVENT_NAME; // TODO: map to woodpecker event types

  const githubToken = process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('Please provide a GitHub token');
  }

  return {
    configFile: process.env.INPUT_CONFIG_FILE,
    eventType,
    releaseBranch: process.env.INPUT_RELEASE_BRANCH || process.env.CI_REPO_DEFAULT_BRANCH,
    commitMessage: process.env.CI_COMMIT_MESSAGE,
    forgeType: 'github',
    githubToken,
    gitEmail: process.env.INPUT_GIT_EMAIL,
    repoOwner: process.env.GITHUB_REPOSITORY_OWNER,
    repoName: process.env.GITHUB_REPOSITORY?.split('/')?.[1],
    pullRequestBranchPrefix: process.env.INPUT_PULL_REQUEST_BRANCH_PREFIX,
    debug: process.env.INPUT_DEBUG === 'true',
  };
}
