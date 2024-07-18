import { Config } from '../utils/config';
import { Forge } from './forge';
import { GithubForge } from './github';
import { GiteaForge } from './gitea';

export async function getForge(config: Config): Promise<Forge> {
  if (!config.ci.gitEmail) {
    throw new Error('Please provide a `git_email`');
  }

  if (config.ci.forgeType === 'github') {
    if (!config.ci.githubToken) {
      throw new Error('Please provide a `github_token`');
    }

    return new GithubForge(config.ci.githubToken, config.ci.gitEmail);
  }

  if (config.ci.forgeType === 'gitea' || config.ci.forgeType === 'forgejo') {
    if (!config.ci.giteaToken) {
      throw new Error('Please provide a `gitea_token`');
    }

    if (!config.ci.giteaUrl) {
      throw new Error('Please provide the `gitea_url` to your Gitea instance');
    }

    return new GiteaForge(config.ci.giteaUrl, config.ci.giteaToken, config.ci.gitEmail);
  }

  throw new Error('Forge type not supported: ' + config.ci.forgeType);
}
