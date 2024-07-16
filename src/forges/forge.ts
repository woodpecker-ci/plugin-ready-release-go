export type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type PullRequest = {
  number: number;
  title: string;
  author: string;
  description: string;
  labels: string[];
};

export abstract class Forge {
  abstract createOrUpdatePullRequest(options: {
    draft: boolean;
    title: string;
    description: string;
    owner: string;
    repo: string;
    sourceBranch: string;
    targetBranch: string;
  }): Promise<{
    pullRequestLink: string;
  }>;

  abstract createRelease(options: {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    description: string;
    prerelease?: boolean;
  }): Promise<{
    releaseLink: string;
  }>;

  abstract addCommentToPullRequest(options: {
    owner: string;
    repo: string;
    pullRequestNumber: number;
    comment: string;
  }): Promise<void>;

  abstract getGitCredentials(): Promise<{
    email: string;
    username: string;
    password: string;
  }>;

  abstract getPullRequestFromCommit(options: {
    owner: string;
    repo: string;
    commitHash: string;
  }): Promise<PullRequest | undefined>;

  abstract getPullRequest(options: {
    owner: string;
    repo: string;
    sourceBranch: string;
    targetBranch: string;
  }): Promise<PullRequest | undefined>;

  abstract getRepoUrl(owner: string, repo: string): string;
  abstract getCommitUrl(owner: string, repo: string, commitHash: string): string;
  abstract getIssueUrl(owner: string, repo: string, issueNumber: string | number): string;
  abstract getPullRequestUrl(owner: string, repo: string, pullRequestNumber: string | number): string;
  abstract getReleaseUrl(owner: string, repo: string, release: string): string;
}
