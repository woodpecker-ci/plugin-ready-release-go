import c from "picocolors";

import { CommandContext, HookContext } from "../utils/types";
import { updateChangelogSection, getChangeLogSection } from "../utils/change";
import { promises as fs } from "fs";

export async function prepare({
  config,
  forge,
  git,
  exec,
  changes,
  latestVersion,
  nextVersion,
}: CommandContext) {
  console.log(
    "# Preparing release pull-request for version:",
    c.green(nextVersion),
    "..."
  );

  const hookCtx: HookContext = {
    // exec(...args) {
    //   console.log(c.gray("$"), c.cyan(args[0]));
    //   return exec.apply(null, args);
    // }
    exec,
    nextVersion,
  };

  const pullRequestBranch = config.user.getPullRequestBranch
    ? await config.user.getPullRequestBranch(hookCtx)
    : `next-release/${latestVersion}`;

  const releaseBranch = config.user.getReleaseBranch
    ? await config.user.getReleaseBranch(hookCtx)
    : "main";

  const branches = await git.branch();
  if (branches.all.includes(`remotes/origin/${pullRequestBranch}`)) {
    console.log(
      c.yellow(`Branch "${pullRequestBranch}" already exists, checking it out.`)
    );

    await git.checkout([pullRequestBranch]);

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

    await git.merge([
      `origin/${releaseBranch}`,
      "-m",
      `Merge branch 'origin/${releaseBranch}' into '${pullRequestBranch}'`,
      "--no-edit",
    ]);
  } else {
    console.log(
      c.yellow(`Branch "${pullRequestBranch}" does not exist yet, creating it.`)
    );

    await git.checkout(["-B", pullRequestBranch, "--track"]);
  }

  if (config.user.beforePrepare) {
    console.log("# Running beforePrepare hook");
    const hookResult = await config.user.beforePrepare(hookCtx);
    if (hookResult === false) {
      console.log("# beforePrepare hook returned false, skipping prepare.");
      return;
    }
  }

  let oldChangelog = "";
  if (await fs.stat("CHANGELOG.md").catch(() => false)) {
    oldChangelog = await fs.readFile("CHANGELOG.md", "utf-8");
  }
  const newChangelogSection = getChangeLogSection(
    nextVersion,
    config,
    changes,
    forge
  );
  const changelog = updateChangelogSection(
    nextVersion,
    oldChangelog,
    newChangelogSection
  );

  console.log("# Updating CHANGELOG.md");
  await fs.writeFile("CHANGELOG.md", changelog);

  const { isClean } = await git.status();
  if (!isClean()) {
    await git.add(".");
    await git.commit(`🎉 Release ${nextVersion}`);
    await git.push(["-u", "origin", pullRequestBranch]);
  }

  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }

  const releaseDescription = config.user.getReleaseDescription
    ? await config.user.getReleaseDescription(hookCtx)
    : newChangelogSection;

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
