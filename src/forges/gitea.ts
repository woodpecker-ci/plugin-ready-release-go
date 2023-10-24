import { Forge } from "./forge";
import { giteaApi, Api } from "gitea-js";

export class GiteaForge extends Forge {
  accessToken: string;
  email: string;
  api: Api<unknown>;
  url: string;

  constructor(url: string, accessToken: string, email: string) {
    super();
    this.email = email;
    this.accessToken = accessToken;
    this.url = url;
    this.api = giteaApi(url, {
      token: accessToken, // generate one at https://gitea.example.com/user/settings/applications
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
  }): Promise<{ pullRequestLink: string }> {
    const pullRequests = await this.api.repos.repoListPullRequests(
      options.owner,
      options.repo,
      {
        // head: `${options.owner}:${options.sourceBranch}`, // TODO: filter by source and target branch
      }
    );

    if (pullRequests.data.length > 0) {
      const pr = await this.api.repos.repoEditPullRequest(
        options.owner,
        options.repo,
        pullRequests.data[0].number!,
        {
          title: options.title,
          body: options.description,
        }
      );

      return { pullRequestLink: pr.data.html_url! };
    }

    const pr = await this.api.repos.repoCreatePullRequest(
      options.owner,
      options.repo,
      {
        title: options.title,
        head: options.sourceBranch,
        base: options.targetBranch,
        body: options.description,
      }
    );

    return { pullRequestLink: pr.data.html_url! };
  }

  async createRelease(options: {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    description: string;
    prerelease?: boolean;
  }): Promise<{ releaseLink: string }> {
    const release = await this.api.repos.repoCreateRelease(
      options.owner,
      options.repo,
      {
        tag_name: options.tag,
        name: options.name,
        body: options.description,
        prerelease: options.prerelease,
      }
    );

    return { releaseLink: release.data.html_url! };
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

  async getPullRequestFromCommit(options: {
    owner: string;
    repo: string;
    commitHash: string;
  }): Promise<
    | { title: string; author?: string; number: number; labels: string[] }
    | undefined
  > {
    const pr = await this.api.repos.listPullRequestsAssociatedWithCommit({
      owner: options.owner,
      repo: options.repo,
      commit_sha: options.commitHash,
    });

    if (pr.data.length === 0) {
      return undefined;
    }

    return {
      title: pr.data[0].title,
      author: pr.data[0].user?.login,
      number: pr.data[0].number,
      labels: pr.data[0].labels.map((label) => label.name),
    };
  }

  async addCommentToPullRequest(options: {
    owner: string;
    repo: string;
    pullRequestNumber: number;
    comment: string;
  }): Promise<void> {
    await this.api.repos.issueCreateComment(
      options.owner,
      options.repo,
      options.pullRequestNumber,
      {
        body: options.comment,
      }
    );
  }

  getRepoUrl(owner: string, repo: string): string {
    return `${this.url}/${owner}/${repo}`;
  }

  getCommitUrl(owner: string, repo: string, commitHash: string): string {
    return `${this.url}/${owner}/${repo}/src/commit/${commitHash}`;
  }

  getIssueUrl(
    owner: string,
    repo: string,
    issueNumber: string | number
  ): string {
    return `${this.url}/${owner}/${repo}/issues/${issueNumber}`;
  }

  getPullRequestUrl(
    owner: string,
    repo: string,
    pullRequestNumber: string | number
  ): string {
    return `${this.url}/${owner}/${repo}/pulls/${pullRequestNumber}`;
  }

  getReleaseUrl(owner: string, repo: string, release: string): string {
    return `${this.url}/${owner}/${repo}/releases/tag/${release}`;
  }
}
