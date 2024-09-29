import c from 'picocolors';
import { run } from './index.ts';
import { getConfig } from './utils/config.ts';
import { getForge } from './forges/index.ts';
import { simpleGit } from './utils/git.ts';

async function main() {
  try {
    const config = await getConfig();
    const forge = await getForge(config);
    const git = simpleGit();

    await run({ git, forge, config });
  } catch (_error) {
    const error = _error as Error;
    console.error(
      c.red(
        `Error: ${error.name}` +
          (error.message ? `\n\t${error.message}` : '') +
          (error.stack ? `\n\t${error.stack}` : ''),
      ),
    );
    Deno.exit(1);
  }
}

main();
