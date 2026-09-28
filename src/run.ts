import c from 'picocolors';
import { inspect } from 'node:util';
import { run } from './index';
import { getConfig } from './utils/config';
import { getForge } from './forges';
import simpleGit from 'simple-git';

async function main() {
  const basePath = process.env.BASE; // Can be used for testing

  try {
    const config = await getConfig(basePath);
    const forge = await getForge(config);
    const git = simpleGit(basePath);

    await run({ git, forge, config });
  } catch (_error) {
    if (!(_error instanceof Error)) {
      console.error(c.red(`Error: ${inspect(_error)}`));
      process.exit(1);
    }
    const error = _error;
    console.error(
      c.red(
        `Error: ${error.name}` +
          (error.message ? `\n\t${error.message}` : '') +
          (error.stack ? `\n\t${error.stack}` : ''),
      ),
    );
    process.exit(1);
  }
}

main();
