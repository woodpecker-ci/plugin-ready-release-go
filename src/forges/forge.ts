export abstract class Forge {
  abstract createOrUpdatePullRequest(options: {
    draft: boolean;
    title: string;
    description: string;
    owner: string;
    repo: string;
    sourceBranch: string;
    targetBranch: string;
  }): Promise<void>;

  abstract createRelease(options: {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    description: string;
    prerelease: boolean;
  }): Promise<void>;

  abstract getGitCredentials(): Promise<{
    email: string;
    username: string;
    password: string;
  }>;
}
