import { getChangeLogSection } from '../utils/change';
import { CommandContext, HookContext } from '../utils/types';
import c from 'picocolors';

export async function release({
  config,
  exec,
  forge,
  changes,
  useVersionPrefixV,
  latestVersion,
  nextVersion,
  shouldBeRC,
}: CommandContext) {
  const hookCtx: HookContext = {
    exec,
    latestVersion,
    nextVersion,
    changes,
  };

  if (config.user.beforeRelease) {
    console.log('# Running beforeRelease hook');
    if ((await config.user.beforeRelease(hookCtx)) === false) {
      return;
    }
  }

  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error('Missing repoOwner or repoName');
  }

  const tag = useVersionPrefixV && !nextVersion.startsWith('v') ? `v${nextVersion}` : nextVersion;

  const newChangelogSection = getChangeLogSection(nextVersion, tag, config, changes, forge, config.user.includeContributors);

  const releaseDescription = config.user.getReleaseDescription
    ? await config.user.getReleaseDescription(hookCtx)
    : newChangelogSection;

  const isLatest = config.user.useLatestRelease ? await config.user.useLatestRelease(hookCtx) : true;

  console.log('# Creating release');
  const { releaseLink } = await forge.createRelease({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    tag,
    description: releaseDescription,
    name: nextVersion,
    prerelease: shouldBeRC,
    target: config.ci.releaseBranch,
    isLatest,
  });

  console.log(c.green('# Successfully created release:'), releaseLink);

  if (config.user.commentOnReleasedPullRequests) {
    console.log('# Adding release comments to pull-requests');
    for await (const { pullRequestNumber } of changes) {
      if (!pullRequestNumber) {
        continue;
      }

      const comment = `🎉 This PR is included in version ${nextVersion} 🎉

The release is now available [here](${releaseLink})

Thank you for your contribution. ❤️📦🚀`;

      await forge.addCommentToPullRequest({
        owner: config.ci.repoOwner,
        repo: config.ci.repoName,
        pullRequestNumber,
        comment,
      });
    }
  }

  if (config.user.afterRelease) {
    console.log('# Running afterRelease hook');
    await config.user.afterRelease(hookCtx);
  }
}
