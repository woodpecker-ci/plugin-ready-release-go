import { Comment, Forge, PullRequest } from "./forge";
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
  }): Promise<{ pullRequestLink: string }> {
    const pullRequests = await this.octokit.pulls.list({
      owner: options.owner,
      repo: options.repo,
      head: `${options.owner}:${options.sourceBranch}`,
    });

    if (pullRequests.data.length > 0) {
      const pr = await this.octokit.pulls.update({
        owner: options.owner,
        repo: options.repo,
        pull_number: pullRequests.data[0].number,
        title: options.title,
        draft: options.draft,
        head: options.sourceBranch,
        base: options.targetBranch,
        body: options.description,
      });

      return { pullRequestLink: pr.data._links.html.href };
    }

    const pr = await this.octokit.pulls.create({
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      draft: options.draft,
      head: options.sourceBranch,
      base: options.targetBranch,
      body: options.description,
    });

    return { pullRequestLink: pr.data._links.html.href };
  }

  async createRelease(options: {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    description: string;
    prerelease?: boolean;
  }): Promise<{ releaseLink: string }> {
    const release = await this.octokit.repos.createRelease({
      owner: options.owner,
      repo: options.repo,
      tag_name: options.tag,
      name: options.name,
      body: options.description,
      prerelease: options.prerelease,
    });

    return { releaseLink: release.data.html_url };
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
  }): Promise<PullRequest | undefined> {
    const pr = await this.octokit.repos.listPullRequestsAssociatedWithCommit({
      owner: options.owner,
      repo: options.repo,
      commit_sha: options.commitHash,
    });

    if (pr.data.length === 0) {
      return undefined;
    }

    return {
      number: pr.data[0].number,
      title: pr.data[0].title,
      description: pr.data[0].body || "",
      author: pr.data[0].user?.login || "",
      labels: pr.data[0].labels.map((label) => label.name),
    };
  }

  async getPullRequest(options: {
    owner: string;
    repo: string;
    sourceBranch: string;
    targetBranch: string;
  }): Promise<PullRequest | undefined> {
    const pullRequests = await this.octokit.pulls.list({
      owner: options.owner,
      repo: options.repo,
      head: `${options.owner}:${options.sourceBranch}`,
    });

    if (pullRequests.data.length > 1) {
      throw new Error(
        "Found more than one pull request to release. Please close all but one.",
      );
    }

    if (pullRequests.data.length === 0) {
      return undefined;
    }

    const pr = pullRequests.data[0];

    return {
      number: pr.number,
      title: pr.title,
      description: pr.body || "",
      author: pr.user?.login || "",
      labels: pr.labels.map((label) => label.name),
    };
  }

  async addCommentToPullRequest(options: {
    owner: string;
    repo: string;
    pullRequestNumber: number;
    comment: string;
  }): Promise<void> {
    await this.octokit.issues.createComment({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.pullRequestNumber,
      body: options.comment,
    });
  }

  getRepoUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}`;
  }

  getCommitUrl(owner: string, repo: string, commitHash: string): string {
    return `https://github.com/${owner}/${repo}/commit/${commitHash}`;
  }

  getIssueUrl(
    owner: string,
    repo: string,
    issueNumber: string | number,
  ): string {
    return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  }

  getPullRequestUrl(
    owner: string,
    repo: string,
    pullRequestNumber: string | number,
  ): string {
    return `https://github.com/${owner}/${repo}/pull/${pullRequestNumber}`;
  }

  getReleaseUrl(owner: string, repo: string, release: string): string {
    return `https://github.com/${owner}/${repo}/releases/tag/${release}`;
  }

  async getPullRequestComments(
    owner: string,
    repo: string,
    pullRequestNumber: number,
  ): Promise<Comment[]> {
    const comments = await this.octokit.paginate(
      this.octokit.issues.listComments,
      {
        owner,
        repo,
        issue_number: pullRequestNumber,
      },
    );

    return comments.map((comment) => ({
      id: comment.id.toString(),
      body: comment.body!,
      author: comment.user?.login!,
      createdAt: comment.created_at,
    }));
  }
}
