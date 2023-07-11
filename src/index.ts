import shelljs from "shelljs";
import c from "picocolors";
import { simpleGit } from "simple-git";

import { prepare } from "./cmd/prepare";
import { release } from "./cmd/release";
import { getForge } from "./forges";
import { getConfig } from "./utils/config";
import { Change, CommandContext } from "./utils/types";
import { getNextVersionFromLabels } from "./utils/change";

async function run() {
  const config = await getConfig();
  const forge = await getForge(config);
  const git = simpleGit();
  const hookCtx = {
    exec: shelljs.exec,
  };

  if (config.ci.isCI) {
    console.log("# CI detected 🤖");
  }

  console.log("# Event type:", c.green(config.ci.eventType));
  console.log("# Running on branch:", c.green(config.ci.branch));
  console.log("# Commit message was:", c.green(config.ci.commitMessage));

  // check if event is push
  if (config.ci.eventType !== "push") {
    console.log(c.yellow("# Not a push event, skipping."));
    return;
  }

  const credentials = await forge.getGitCredentials();
  await git.addConfig("user.name", credentials.username);
  await git.addConfig("user.email", credentials.email);

  const releaseBranch = config.user.getReleaseBranch
    ? await config.user.getReleaseBranch(hookCtx)
    : "main";

  await git.checkout(releaseBranch);
  const tags = await git.tags();

  if (!tags.latest) {
    console.log(c.yellow("# Latest tag not found, skipping."));
    return;
  }

  const lastestTag = tags.latest;
  console.log("# Lastest tag is:", c.green(lastestTag));

  const unTaggedCommits = await git.log({
    from: lastestTag,
    to: releaseBranch,
  });

  if (unTaggedCommits.total === 0) {
    console.log(c.yellow("# No untagged commits found, skipping."));
    return;
  }

  console.log("# Found", c.green(unTaggedCommits.total), "untagged commits");

  const latestVersion = lastestTag.replace("v", "");
  const changes = await Promise.all(
    unTaggedCommits.all.map(async (commit) => {
      const pr = await forge.getPullRequestFromCommit({
        owner: config.ci.repoOwner!,
        repo: config.ci.repoName!,
        commit: commit.refs,
      });

      return <Change>{
        commit: commit.refs,
        title: pr?.title || commit.message,
        labels: pr?.labels || [],
        pullRequestNumber: pr?.number,
      };
    })
  );

  const nextVersion = config.user.getNextVersion
    ? await config.user.getNextVersion(hookCtx)
    : getNextVersionFromLabels(latestVersion, config.user, changes);

  if (!nextVersion) {
    console.log(c.yellow("# No changes found, skipping."));
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
    exec: shelljs.exec,
  };

  // is "release" commit
  if (config.ci.commitMessage?.startsWith("🎉 Release")) {
    console.log(c.green("# Release commit detected."));
    console.log("# Now releasing version:", c.green(nextVersion));

    await release(commandCtx);

    console.log("# Successfully released version:", c.green(nextVersion));

    return;
  }

  // is "normal" push to release branch
  console.log("# Push to release branch detected.");
  console.log(
    "# Now preparing release pull-request for version:",
    c.green(nextVersion)
  );
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
