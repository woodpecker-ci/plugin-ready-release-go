import { Forge, PullRequest } from './forge';
import { giteaApi, Api } from 'gitea-js';

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

  async handleApiErrors<T>(promise: Promise<T>, ignoreErrors = [404]): Promise<T | undefined> {
    return promise.catch((error) => {
      const status = (error as Response)?.status;
      if (ignoreErrors.includes(status)) {
        console.error('gitea error', error);
      }

      return undefined;
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
    const pullRequest = await this.handleApiErrors(
      this.api.repos.repoGetPullRequestByBaseHead(
        options.owner,
        options.repo,
        options.targetBranch,
        options.sourceBranch,
      ),
    );

    if (pullRequest?.data) {
      const pr = await this.api.repos.repoEditPullRequest(options.owner, options.repo, pullRequest.data.number!, {
        title: options.title,
        body: options.description,
      });

      return { pullRequestLink: pr.data.html_url! };
    }

    const pr = await this.api.repos.repoCreatePullRequest(options.owner, options.repo, {
      title: options.title,
      head: options.sourceBranch,
      base: options.targetBranch,
      body: options.description,
    });

    return { pullRequestLink: pr.data.html_url! };
  }

  async createRelease(options: {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    description: string;
    prerelease?: boolean;
    target: string;
  }): Promise<{ releaseLink: string }> {
    const release = await this.api.repos.repoCreateRelease(options.owner, options.repo, {
      tag_name: options.tag,
      name: options.name,
      body: options.description,
      prerelease: options.prerelease,
      target_commitish: options.target,
    });

    return { releaseLink: release.data.html_url! };
  }

  async getGitCredentials(): Promise<{
    email: string;
    username: string;
    password: string;
  }> {
    return {
      email: this.email,
      username: 'oauth',
      password: this.accessToken,
    };
  }

  async getPullRequest(options: {
    owner: string;
    repo: string;
    sourceBranch: string;
    targetBranch: string;
  }): Promise<PullRequest | undefined> {
    const pullRequest = await this.handleApiErrors(
      this.api.repos.repoGetPullRequestByBaseHead(
        options.owner,
        options.repo,
        options.targetBranch,
        options.sourceBranch,
      ),
    );

    if (!pullRequest?.data) {
      return undefined;
    }

    return {
      // TODO: check if those fields are always present and we can safely use ! here
      title: pullRequest.data.title!,
      author: pullRequest.data.user?.login!,
      number: pullRequest.data.number!,
      labels: pullRequest.data.labels?.map((label) => label.name!) ?? [],
      description: pullRequest.data.body!,
    };
  }

  async getPullRequestFromCommit(options: {
    owner: string;
    repo: string;
    commitHash: string;
  }): Promise<PullRequest | undefined> {
    const pullRequest = await this.handleApiErrors(
      this.api.repos.repoGetCommitPullRequest(options.owner, options.repo, options.commitHash),
    );

    if (!pullRequest?.data) {
      return undefined;
    }

    return {
      // TODO: check if those fields are always present and we can safely use ! here
      title: pullRequest.data.title!,
      author: pullRequest.data.user?.login!,
      number: pullRequest.data.number!,
      labels: pullRequest.data.labels?.map((label) => label.name!) ?? [],
      description: pullRequest.data.body!,
    };
  }

  async addCommentToPullRequest(options: {
    owner: string;
    repo: string;
    pullRequestNumber: number;
    comment: string;
  }): Promise<void> {
    await this.api.repos.issueCreateComment(options.owner, options.repo, options.pullRequestNumber, {
      body: options.comment,
    });
  }

  getRepoUrl(owner: string, repo: string): string {
    return `${this.url}/${owner}/${repo}`;
  }

  getCommitUrl(owner: string, repo: string, commitHash: string): string {
    return `${this.url}/${owner}/${repo}/src/commit/${commitHash}`;
  }

  getIssueUrl(owner: string, repo: string, issueNumber: string | number): string {
    return `${this.url}/${owner}/${repo}/issues/${issueNumber}`;
  }

  getPullRequestUrl(owner: string, repo: string, pullRequestNumber: string | number): string {
    return `${this.url}/${owner}/${repo}/pulls/${pullRequestNumber}`;
  }

  getReleaseUrl(owner: string, repo: string, release: string): string {
    return `${this.url}/${owner}/${repo}/releases/tag/${release}`;
  }
}
