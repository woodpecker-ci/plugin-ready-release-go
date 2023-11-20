import shelljs from "shelljs";
import c from "picocolors";
import { simpleGit } from "simple-git";
import semver from "semver";

import { prepare } from "./cmd/prepare";
import { release } from "./cmd/release";
import { getForge } from "./forges";
import { getConfig } from "./utils/config";
import { Change, CommandContext, HookContext } from "./utils/types";
import {
  extractVersionFromCommitMessage,
  getNextVersionFromLabels,
} from "./utils/change";
import { getReleaseOptions } from "./utils/pr";

async function run() {
  const config = await getConfig();
  const forge = await getForge(config);

  if (config.ci.debug) {
    process.env.DEBUG = "simple-git";
  }

  const git = simpleGit();
  const hookCtx: HookContext = {
    exec: shelljs.exec,
  };

  if (config.ci.isCI) {
    console.log("# CI detected 🤖");
  }

  console.log("# Event type:", c.green(config.ci.eventType));
  console.log("# Commit message was:", c.green(config.ci.commitMessage));

  // check if event is push
  if (config.ci.eventType !== "push") {
    console.log(c.yellow("# Not a push event, skipping."));
    return;
  }

  const credentials = await forge.getGitCredentials();
  await git.addConfig("user.name", credentials.username);
  await git.addConfig("user.email", credentials.email);

  const remotes = await git.getRemotes(true);
  if (remotes.length < 1) {
    console.log(c.yellow("# No remotes found, skipping."));
    return;
  }

  if (!remotes[0].refs.push.includes("@")) {
    const remote = remotes[0].refs.push.replace(
      "://",
      `://${credentials.username}:${credentials.password}@`
    );
    await git.removeRemote(remotes[0].name);
    await git.addRemote(remotes[0].name, remote);
  }

  const { releaseBranch } = config.ci;

  await git.fetch(["--unshallow", "--tags"]);
  await git.checkout(releaseBranch);
  await git.branch(["--set-upstream-to", `origin/${releaseBranch}`]);
  await git.pull();

  const isReleaseCommit = config.ci.commitMessage?.startsWith(
    config.ci.releasePrefix
  );

  const pullRequestBranch = `${config.ci.pullRequestBranchPrefix}${releaseBranch}`;

  let shouldBeRC = false;
  let nextVersion: string | null = config.user.getNextVersion
    ? await config.user.getNextVersion(hookCtx)
    : null;

  if (isReleaseCommit) {
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

  const tags = await git.tags();

  if (!tags.latest && tags.all.length > 0) {
    console.log(c.yellow("# Latest tag not found, but tags exist, skipping."));
    return;
  }

  const latestTag = tags.latest || "0.0.0";
  if (tags.latest) {
    console.log("# Lastest tag is:", c.green(latestTag));
  } else {
    console.log(
      c.green(`# No tags found. Starting with first tag: ${latestTag}`)
    );
  }

  let unTaggedCommits = await git.log(
    latestTag === "0.0.0"
      ? [releaseBranch] // use all commits of release branch if first release
      : {
          from: latestTag,
          symmetric: false,
          to: releaseBranch,
        }
  );

  // if the lastest tag is an RC and the next version should be the actual release,
  // we need to include the commits between the first RC and the release branch
  if (latestTag.includes("-") && !shouldBeRC) {
    const versionWithoutRc = latestTag.replace(/-\w+.\d+/, "");
    let latestTags = await git.tags(["--sort=-creatordate"]);
    const latestRCTags = latestTags.all
      .filter((t) => t.includes("-"))
      .filter((t) => t.includes(versionWithoutRc))
      .sort(semver.compare);

    if (latestRCTags.length > 0) {
      const firstRCTag = latestRCTags[0];
      console.log(
        "# First pre-release tag is:",
        c.green(firstRCTag),
        "adding commits between",
        c.green(firstRCTag),
        "and",
        c.green(releaseBranch)
      );

      unTaggedCommits = await git.log({
        from: firstRCTag,
        symmetric: false,
        to: releaseBranch,
      });
    }
  }

  if (unTaggedCommits.total === 0) {
    console.log(c.yellow("# No untagged commits found, skipping."));
    return;
  }

  console.log("# Found", c.green(unTaggedCommits.total), "untagged commits");

  const useVersionPrefixV =
    config.user.useVersionPrefixV === undefined
      ? latestTag.startsWith("v")
      : config.user.useVersionPrefixV;
  const latestVersion = latestTag.replace(/^v/, "");
  const changes: Change[] = [];

  for await (const commit of unTaggedCommits.all) {
    if (commit.message.startsWith(config.ci.releasePrefix)) {
      continue;
    }

    const pr = await forge.getPullRequestFromCommit({
      owner: config.ci.repoOwner!,
      repo: config.ci.repoName!,
      commitHash: commit.hash,
    });

    if (config.user.skipCommitsWithoutPullRequest && !pr) {
      console.log(
        c.yellow("# No pull-request found for commit, skipping."),
        `${commit.hash}: "${commit.message}"`
      );
      continue;
    }

    if (pr?.labels.some((l) => config.user.skipLabels?.includes(l))) {
      console.log(
        c.yellow("# Skipping commit / PR by label:"),
        `${commit.hash}: "${commit.message}"`
      );
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

  if (config.ci.debug) {
    console.log(c.yellow("changes"), changes);
  }

  if (!isReleaseCommit) {
    nextVersion = getNextVersionFromLabels(
      latestVersion,
      config.user,
      changes,
      shouldBeRC
    );
  }

  if (!nextVersion) {
    console.log(c.yellow("# No changes or unable to bump semver version."));
    return;
  }

  console.log("# Next version will be:", c.green(nextVersion));

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
  if (isReleaseCommit) {
    console.log(c.green("# Release commit detected."));
    console.log("# Now releasing version:", c.green(nextVersion));

    await release(commandCtx);

    console.log("# Successfully released version:", c.green(nextVersion));

    return;
  }

  // is "normal" push to release branch
  console.log("# Push to release branch detected.");
  await prepare(commandCtx);
}

async function main() {
  try {
    await run();
  } catch (error) {
    console.error(c.red((error as Error).message));
    process.exit(1);
  }
}

main();
