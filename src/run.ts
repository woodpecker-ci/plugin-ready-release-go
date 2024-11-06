import c from 'picocolors';
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
    const error = _error as Error;
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
