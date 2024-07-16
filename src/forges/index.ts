import { Config } from '../utils/config';
import { Forge } from './forge';
import { GithubForge } from './github';

export async function getForge(config: Config): Promise<Forge> {
  if (config.ci.forgeType === 'github') {
    if (!config.ci.githubToken) {
      throw new Error('Please provide a Github token');
    }

    if (!config.ci.gitEmail) {
      throw new Error('Please provide a Git email');
    }

    return new GithubForge(config.ci.githubToken, config.ci.gitEmail);
  }

  throw new Error('Forge type not supported: ' + config.ci.forgeType);
}
