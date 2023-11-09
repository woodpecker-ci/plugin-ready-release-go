import c from "picocolors";

import { CommandContext, HookContext } from "../utils/types";
import { updateChangelogSection, getChangeLogSection } from "../utils/change";
import { promises as fs } from "fs";
import { getReleaseOptions } from "../utils/pr";

export async function prepare(cmdCtx: CommandContext) {
  const {
    config,
    forge,
    git,
    exec,
    changes,
    latestVersion,
    nextVersion,
    releasePullRequest,
    releasePullRequestBranch,
    shouldBeRC,
  } = cmdCtx;

  console.log(
    "# Preparing release pull-request for version:",
    c.green(nextVersion),
    "..."
  );

  const hookCtx: HookContext = {
    exec,
    latestVersion,
    nextVersion,
    changes,
  };

  const branches = await git.branch();
  if (branches.all.includes(`remotes/origin/${releasePullRequestBranch}`)) {
    console.log(
      c.yellow(
        `Branch "${releasePullRequestBranch}" already exists, checking it out.`
      )
    );

    await git.checkout([releasePullRequestBranch]);

    try {
      await git.pull(releasePullRequestBranch);
    } catch (e) {
      console.log(
        c.yellow(
          `Error pulling "${releasePullRequestBranch}" branch. Maybe it does not exist yet?`
        ),
        e
      );
    }

    await git.merge([
      `origin/${config.ci.releaseBranch}`,
      "-m",
      `Merge branch 'origin/${config.ci.releaseBranch}' into '${releasePullRequestBranch}'`,
      "--no-edit",
    ]);
  } else {
    console.log(
      c.yellow(
        `Branch "${releasePullRequestBranch}" does not exist yet, creating it.`
      )
    );

    await git.checkout(["-B", releasePullRequestBranch, "--track"]);
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
    forge,
    true
  );
  const changelog = updateChangelogSection(
    latestVersion,
    nextVersion,
    oldChangelog,
    newChangelogSection
  );

  console.log("# Updating CHANGELOG.md");
  await fs.writeFile("CHANGELOG.md", changelog);

  const { isClean } = await git.status();
  if (!isClean()) {
    await git.add(".");
    await git.commit(`${config.ci.releasePrefix} ${nextVersion}`);
    await git.push(["-u", "origin", releasePullRequestBranch]);
  }

  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }

  const releaseDescription = config.user.getReleaseDescription
    ? await config.user.getReleaseDescription(hookCtx)
    : `This PR was opened by the ` +
      `[ready-release-go](https://github.com/woodpecker-ci/plugin-ready-release-go) plugin. ` +
      `When you're ready to do a release, you can merge this and a release and tag with ` +
      `version \`${nextVersion}\` will be created automatically. ` +
      `If you're not ready to do a release yet, that's fine, ` +
      `whenever you add more changes to \`${config.ci.releaseBranch}\` ` +
      `this PR will be updated.\n\n` +
      `## Options\n\n` +
      `- [${shouldBeRC ? "x" : " "}] Release this version as RC\n\n` +
      getChangeLogSection(nextVersion, config, changes, forge, false);

  console.log("# Creating release pull-request");
  const pullRequestLink = await forge.createOrUpdatePullRequest({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    title: `${config.ci.releasePrefix} ${nextVersion}`,
    description: releaseDescription,
    draft: true,
    sourceBranch: releasePullRequestBranch,
    targetBranch: config.ci.releaseBranch,
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
}
