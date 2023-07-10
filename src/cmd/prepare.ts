import c from "picocolors";

import { CommandContext, HookContext } from "../utils/types";
import { getChangeLog } from "../utils/change";

export async function prepare({
  config,
  forge,
  git,
  exec,
  changes,
  nextVersion,
}: CommandContext) {
  console.log("# Preparing release pull-request ...");

  const hookCtx: HookContext = {
    exec(...args) {
      console.log(c.gray("$"), c.cyan(args[0]));
      return exec.apply(null, args);
    },
    nextVersion,
  };

  hookCtx.nextVersion = nextVersion;
  console.log("# Next version will be:", c.green(nextVersion));

  const pullRequestBranch = config.user.getPullRequestBranch
    ? await config.user.getPullRequestBranch(hookCtx)
    : `next-release/${nextVersion}`;

  const releaseBranch = config.user.getReleaseBranch
    ? await config.user.getReleaseBranch(hookCtx)
    : "main";

  try {
    await git.fetch(pullRequestBranch);
  } catch (e) {
    console.log(
      c.yellow(
        `Error fetching "${pullRequestBranch}" branch. Maybe it does not exist yet?`
      ),
      e
    );
  }

  await git.checkout(pullRequestBranch);

  try {
    await git.pull(pullRequestBranch);
  } catch (e) {
    console.log(
      c.yellow(
        `Error pulling "${pullRequestBranch}" branch. Maybe it does not exist yet?`
      ),
      e
    );
  }

  await git.fetch(`origin/${releaseBranch}`);
  await git.mergeFromTo(`origin/${releaseBranch}`, pullRequestBranch);

  if (config.user.beforePrepare) {
    console.log("# Running beforePrepare hook");
    const hookResult = await config.user.beforePrepare(hookCtx);
    if (hookResult === false) {
      console.log("# beforePrepare hook returned false, skipping prepare.");
      return;
    }
  }

  await git.commit(`Release ${nextVersion}`);

  await git.push(pullRequestBranch);

  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }

  const releaseDescription = config.user.getReleaseDescription
    ? await config.user.getReleaseDescription(hookCtx)
    : getChangeLog(nextVersion, config.user, changes);

  console.log("# Creating release pull-request");
  const pullRequestLink = await forge.createOrUpdatePullRequest({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    title: `🎉 Release ${nextVersion}`,
    description: releaseDescription,
    draft: true,
    sourceBranch: pullRequestBranch,
    targetBranch: releaseBranch,
  });

  if (config.user.afterPrepare) {
    console.log("# Running afterPrepare hook");
    await config.user.afterPrepare(hookCtx);
  }

  console.log(
    "# Successfully prepared release pull-request: ",
    pullRequestLink
  );

  console.log("# Pull-request created");
  return;
}
