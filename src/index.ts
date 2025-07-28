import shelljs from 'shelljs';
import c from 'picocolors';
import type { SimpleGit } from 'simple-git';
import semver from 'semver';

import { prepare } from './cmd/prepare';
import { release } from './cmd/release';
import type { Config } from './utils/config';
import type { CommandContext, HookContext } from './utils/types';
import { extractVersionFromCommitMessage, getNextVersionFromLabels } from './utils/change';
import { getReleaseOptions } from './utils/pr';
import { Forge } from './forges/forge';
import { PRLabelAnalyser } from './utils/analyser/pr_labels';

function isReleaseCommit(config: Config): boolean {
  if (!config.ci.commitMessage) return false;

  let normalizedCommitMessage = config.ci.commitMessage
    .replace(/['"]/g, '') // remove quotes
    .replace(/[\n\r]/g, ' ') // replace newlines with spaces
    .trim();

  if (config.ci.forgeType === 'github') {
    normalizedCommitMessage = normalizedCommitMessage.replace(/^Merge pull request #\d+ from [^\s]+/, '');
  }

  if (config.ci.forgeType === 'gitea' || config.ci.forgeType === 'forgejo') {
    normalizedCommitMessage = normalizedCommitMessage.replace(/^Merge pull request/, '').trim();
  }

  return normalizedCommitMessage.trim().startsWith(config.ci.releasePrefix);
}

export async function run({ git, forge, config }: { git: SimpleGit; forge: Forge; config: Config }) {
  if (config.ci.debug) {
    process.env.DEBUG = 'simple-git';
  }

  const hookCtx: HookContext = {
    exec: shelljs.exec,
  };

  if (config.ci.isCI) {
    console.log('# CI detected 🤖');
  }

  console.log('# Event type:', c.green(config.ci.eventType));
  console.log('# Commit message was:', c.green(config.ci.commitMessage));

  // check if event is push
  if (config.ci.eventType !== 'push') {
    console.log(c.yellow('# Not a push event, skipping.'));
    return;
  }

  const credentials = await forge.getGitCredentials();
  await git.addConfig('user.name', credentials.username);
  await git.addConfig('user.email', credentials.email);

  const remotes = await git.getRemotes(true);
  if (remotes.length < 1) {
    console.log(c.yellow('# No remotes found, skipping.'));
    return;
  }

  if (!remotes[0].refs.push.includes('@')) {
    const remote = remotes[0].refs.push.replace('://', `://${credentials.username}:${credentials.password}@`);
    await git.removeRemote(remotes[0].name);
    await git.addRemote(remotes[0].name, remote);
  }

  const { releaseBranch } = config.ci;

  try {
    await git.fetch(['--unshallow', '--tags']);
  } catch (error) {
    console.error(c.yellow('# Error doing unshallow fetch'), error);
    await git.fetch(['--tags']);
  }
  await git.checkout(releaseBranch);
  await git.branch(['--set-upstream-to', `origin/${releaseBranch}`]);
  await git.pull();

  const _isReleaseCommit = isReleaseCommit(config);

  const pullRequestBranch = `${config.ci.pullRequestBranchPrefix}${releaseBranch}`;

  let shouldBeRC = false;
  let nextVersion: string | null = null;

  if (_isReleaseCommit) {
    // use commit message for release runs as the pull-request is not available (closed)
    nextVersion = extractVersionFromCommitMessage(config.ci.commitMessage!);
    shouldBeRC = semver.prerelease(nextVersion) !== null;
  } else {
    const releasePullRequest = await forge.getPullRequest({
      owner: config.ci.repoOwner!,
      repo: config.ci.repoName!,
      sourceBranch: pullRequestBranch,
      targetBranch: releaseBranch,
    });
    shouldBeRC = getReleaseOptions(releasePullRequest).nextVersionShouldBeRC;
  }

  console.log('# Should next version be a release candidate:', c.green(shouldBeRC ? 'yes' : 'no'));

  const tags = await git.tags(['--sort=-creatordate']);
  let latestTag = config.user.getLatestTag ? await config.user.getLatestTag(hookCtx) : tags.latest;

  if (tags.all.length > 0 && !config.user.getLatestTag) {
    const sortedTags = semver.rsort(tags.all.filter((tag) => semver.valid(tag)));
    latestTag = sortedTags[0];
  }

  if (!latestTag && tags.all.length > 0) {
    console.log(c.yellow('# Latest tag not found, but tags exist, skipping.'));
    return;
  }

  latestTag = latestTag || '0.0.0';
  if (latestTag) {
    console.log('# Lastest tag is:', c.green(latestTag));
  } else {
    console.log(c.green(`# No tags found. Starting with first tag: ${latestTag}`));
  }

  let unTaggedCommits = await git.log(
    latestTag === '0.0.0'
      ? [releaseBranch] // use all commits of release branch if first release
      : {
          from: latestTag,
          to: releaseBranch,
          symmetric: false,
        },
  );

  // if the latest tag is an RC and the next version should be the actual release,
  // we need to include all commits since the last non RC version and the release branch
  if (semver.prerelease(latestTag) !== null && !shouldBeRC) {
    const latestNonRCTags = tags.all
      .filter((t) => semver.valid(t) && semver.prerelease(t) === null)
      .sort(semver.rcompare);

    if (latestNonRCTags.length > 0) {
      const firstNonRCTag = latestNonRCTags[0];
      console.log('# Adding commits since last none rc tag:', c.green(firstNonRCTag), 'and', c.green(releaseBranch));

      unTaggedCommits = await git.log({
        from: firstNonRCTag,
        to: releaseBranch,
        symmetric: false,
      });
    }
  }

  if (unTaggedCommits.total === 0) {
    console.log(c.yellow('# No untagged commits found, skipping.'));
    return;
  }

  console.log('# Found', c.green(unTaggedCommits.total), 'untagged commits');

  const useVersionPrefixV =
    config.user.useVersionPrefixV === undefined ? latestTag.startsWith('v') : config.user.useVersionPrefixV;
  const latestVersion = latestTag.replace(/^v/, '');

  // TODO: support additional analysers
  const analyser = new PRLabelAnalyser(forge, config);
  const changes = await analyser.getChangesFromCommits([...unTaggedCommits.all]);

  if (config.ci.debug) {
    console.log(c.yellow('changes'), changes);
  }

  if (!_isReleaseCommit) {
    nextVersion = config.user.getNextVersion
      ? await config.user.getNextVersion(hookCtx)
      : getNextVersionFromLabels(latestVersion, config.user, changes, shouldBeRC);
  }

  if (!nextVersion) {
    console.log(c.yellow('# No changes or unable to bump semver version.'));
    return;
  }

  console.log('# Next version will be:', c.green(nextVersion));

  const commandCtx: CommandContext = {
    config,
    forge,
    git,
    changes,
    nextVersion,
    latestVersion,
    useVersionPrefixV,
    pullRequestBranch,
    shouldBeRC,
    exec: shelljs.exec,
  };

  // is "release" commit
  if (_isReleaseCommit) {
    console.log(c.green('# Release commit detected.'));
    console.log('# Now releasing version:', c.green(nextVersion));

    await release(commandCtx);

    console.log('# Successfully released version:', c.green(nextVersion));

    return;
  }

  // is "normal" push to release branch
  console.log('# Push to release branch detected.');
  await prepare(commandCtx);
}
