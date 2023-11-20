import c from "picocolors";
import { run } from "./index";
import { getConfig } from "./utils/config";
import { getForge } from "./forges";
import simpleGit from "simple-git";

async function main() {
  try {
    const config = await getConfig();
    const forge = await getForge(config);
    const git = simpleGit();

    await run({ git, forge, config });
  } catch (error) {
    console.error(c.red((error as Error).message));
    process.exit(1);
  }
}

main();
