import shelljs from "shelljs";
import c from "picocolors";

import { prepare } from "./cmd/prepare";
import { release } from "./cmd/release";
import { getForge } from "./forges";
import { getConfig } from "./utils/config";
import { Git } from "./utils/git";

async function run() {
  const config = await getConfig();
  const forge = await getForge(config);
  const git = new Git();

  if (config.ci.isCI) {
    console.log("# CI detected");
  }

  console.log("# Event type:", c.green(config.ci.eventType));
  console.log("# Running on branch:", c.green(config.ci.branch));
  console.log("# Commit message was:", c.green(config.ci.commitMessage));

  // check if event is push
  if (config.ci.eventType === "push") {
    await git.setup();

    const credentials = await forge.getGitCredentials();
    await git.setUser(credentials);

    // is "release" commit
    if (config.ci.commitMessage?.startsWith("Release")) {
      console.log("# Release commit detected.");

      await release({
        config,
        forge,
        git,
        exec: shelljs.exec,
      });
      return;
    }

    // is "normal" push to release branch
    console.log("# Push to release branch detected.");
    await prepare({
      config,
      forge,
      git,
      exec: shelljs.exec,
    });
  }
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
