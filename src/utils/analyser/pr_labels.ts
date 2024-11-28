import c from 'picocolors';

import { Forge } from '../../forges/forge';
import { Config } from '../config';
import { Analyser, Change, Commit } from '../types';

export class PRLabelAnalyser implements Analyser {
  forge: Forge;
  config: Config;

  constructor(forge: Forge, config: Config) {
    this.forge = forge;
    this.config = config;
  }

  async getChangesFromCommits(commits: Commit[]): Promise<Change[]> {
    const changes: Change[] = [];

    for await (const commit of commits) {
      if (commit.message.startsWith(this.config.ci.releasePrefix)) {
        continue;
      }

      const pr = await this.forge.getPullRequestFromCommit({
        owner: this.config.ci.repoOwner!,
        repo: this.config.ci.repoName!,
        commitHash: commit.hash,
      });

      if (this.config.user.skipCommitsWithoutPullRequest && !pr) {
        console.log(c.yellow('# No pull-request found for commit, skipping.'), `${commit.hash}: "${commit.message}"`);
        continue;
      }

      if (pr?.labels.some((l) => this.config.user.skipLabels?.includes(l))) {
        console.log(c.yellow('# Skipping commit / PR by label:'), `${commit.hash}: "${commit.message}"`);
        continue;
      }

      changes.push({
        commitHash: commit.hash,
        author: pr?.author || commit.author_name,
        title: pr?.title || commit.message,
        labels: pr?.labels || [],
        pullRequestNumber: pr?.number,
      });
    }

    return changes;
  }
}
