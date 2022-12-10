import { Forge } from "./forge";
import { Octokit } from "@octokit/rest";

export class GithubForge extends Forge {
  accessToken: string;
  email: string;
  octokit: Octokit;

  constructor(accessToken: string, email: string) {
    super();
    this.email = email;
    this.accessToken = accessToken;
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async createOrUpdatePullRequest(options: {
    draft: boolean;
    title: string;
    description: string;
    owner: string;
    repo: string;
    sourceBranch: string;
    targetBranch: string;
  }): Promise<void> {
    const pullRequests = await this.octokit.pulls.list({
      owner: options.owner,
      repo: options.repo,
      head: `${options.owner}:${options.sourceBranch}`,
    });

    if (pullRequests.data.length > 0) {
      await this.octokit.pulls.update({
        owner: options.owner,
        repo: options.repo,
        pull_number: pullRequests.data[0].number,
        title: options.title,
        draft: options.draft,
        head: options.sourceBranch,
        base: options.targetBranch,
        body: options.description,
      });
      return;
    }

    await this.octokit.pulls.create({
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      draft: options.draft,
      head: options.sourceBranch,
      base: options.targetBranch,
      body: options.description,
    });
  }

  async createRelease(options?: {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    description: string;
    prerelease: boolean;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getGitCredentials(): Promise<{
    email: string;
    username: string;
    password: string;
  }> {
    return {
      email: this.email,
      username: "oauth",
      password: this.accessToken,
    };
  }
}
