import c from "picocolors";

import { CommandContext, HookContext } from "../utils/types";

export async function prepare({ config, forge, git, exec }: CommandContext) {
  console.log("# Preparing release pull-request ...");

  const hookCtx: HookContext = {
    exec(...args) {
      console.log(c.gray("$"), c.cyan(args[0]));
      return exec(...args);
    },
    nextVersion: "",
  };
  const nextVersion = await config.user.getNextVersion(hookCtx);
  hookCtx.nextVersion = nextVersion;
  console.log("# Next version will be:", c.green(nextVersion));

  const pullRequestBranch = await config.user.getPullRequestBranch({
    version: nextVersion,
  });

  const releaseBranch = await config.user.getReleaseBranch(hookCtx);

  try {
    await git.fetch(pullRequestBranch);
  } catch (e) {
    console.log(c.red(`Error fetching "${pullRequestBranch}" branch`), e);
  }

  await git.checkout(pullRequestBranch);
  await git.pull(pullRequestBranch);

  await git.fetch(releaseBranch);
  await git.merge(`origin/${releaseBranch}`);

  console.log("# Running beforePrepare hook");
  if ((await config.user.beforePrepare(hookCtx)) === false) {
    return;
  }

  await git.commitChanges({
    message: `Release ${nextVersion}`,
  });

  await git.push(pullRequestBranch);

  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }

  const releaseDescription = await config.user.getReleaseDescription(hookCtx);

  console.log("# Creating release pull-request");
  await forge.createOrUpdatePullRequest({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    title: `Release ${nextVersion}`,
    description: releaseDescription,
    draft: true,
    sourceBranch: pullRequestBranch,
    targetBranch: releaseBranch,
  });

  console.log("# Running afterPrepare hook");
  await config.user.afterPrepare(hookCtx);
  console.log("# Pull-request created");
}
