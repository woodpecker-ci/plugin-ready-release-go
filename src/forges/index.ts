import { Config } from '../utils/config.ts';
import { Forge } from './forge.ts';
import { GithubForge } from './github.ts';
import { GiteaForge } from './gitea.ts';

export async function getForge(config: Config): Promise<Forge> {
  if (!config.ci.gitEmail) {
    throw new Error('Please provide a `git_email`');
  }

  if (config.ci.forgeType === 'github') {
    if (!config.ci.forgeToken) {
      throw new Error('Please provide a `forge_token`');
    }

    return new GithubForge(config.ci.forgeToken, config.ci.gitEmail);
  }

  if (config.ci.forgeType === 'gitea' || config.ci.forgeType === 'forgejo') {
    if (!config.ci.forgeToken) {
      throw new Error('Please provide a `forge_token`');
    }

    if (!config.ci.forgeURL) {
      throw new Error('Please provide the `forge_url` to your Gitea instance');
    }

    return new GiteaForge(config.ci.forgeURL, config.ci.forgeToken, config.ci.gitEmail);
  }

  throw new Error('Forge type not supported: ' + config.ci.forgeType);
}
