import semver from 'semver';
import { Change, UserConfig } from './types';
import { Config } from './config';
import { Forge } from '../forges/forge';

export function getNextVersionFromLabels(
  lastVersion: string,
  config: UserConfig,
  changes: Change[],
  shouldBeRC: boolean,
) {
  if (changes.length === 0) {
    return null;
  }

  const changeLabels = config.changeTypes!.reduce(
    (acc, c) => {
      acc[c.bump].push(...c.labels);
      return acc;
    },
    { minor: [] as string[], major: [] as string[], patch: [] as string[] },
  );

  const labels = changes.reduce((acc, change) => [...acc, ...change.labels], [] as string[]);

  if (changeLabels['major'].some((l) => labels.includes(l))) {
    if (shouldBeRC) {
      return semver.inc(lastVersion, 'premajor', 'rc');
    }

    return semver.inc(lastVersion, 'major');
  }

  if (changeLabels['minor'].some((l) => labels.includes(l))) {
    if (shouldBeRC) {
      return semver.inc(lastVersion, 'preminor', 'rc');
    }

    return semver.inc(lastVersion, 'minor');
  }

  if (shouldBeRC) {
    return semver.inc(lastVersion, 'prepatch', 'rc');
  }

  return semver.inc(lastVersion, 'patch');
}

export function getChangeLogSection(
  nextVersion: string,
  tag: string,
  config: Config,
  changes: Change[],
  forge: Forge,
  includeContributors: boolean,
) {
  const defaultChangeType = config.user.changeTypes!.find((c) => c.default);

  const changeSections = changes.reduce((acc, change) => {
    let changeType = config.user.changeTypes!.find((c) => c.labels.some((l) => change.labels.includes(l)));

    if (!changeType && config.user.groupByCommitMessage) {
      changeType = config.user.changeTypes!.find((c) => c.commitMessage.some((msg) => change.title.startsWith(msg)));
    }

    // If still no match, use default change type
    if (!changeType) {
      changeType = defaultChangeType;
    }

    if (!changeType) {
      return acc;
    }

    if (!acc.has(changeType.title)) {
      acc.set(changeType.title, { default: false, ...changeType, changes: [] });
    }

    const commitLink = forge.getCommitUrl(config.ci.repoOwner!, config.ci.repoName!, change.commitHash);
    if (change.pullRequestNumber) {
      const prLink = forge.getPullRequestUrl(config.ci.repoOwner!, config.ci.repoName!, change.pullRequestNumber);
      const entry = `- ${change.title} [[#${change.pullRequestNumber}](${prLink})]`;
      acc.get(changeType.title)?.changes.push(entry);
    } else {
      const entry = `- ${change.title} ([${change.commitHash.substring(0, 7)}](${commitLink}))`;
      acc.get(changeType.title)?.changes.push(entry);
    }

    return acc;
  }, new Map<string, { title: string; weight?: number; changes: string[]; default: boolean }>());

  const changeLog = Array.from(changeSections.values())
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .map((changeSection) => {
      return `### ${changeSection.title}\n\n${changeSection.changes.filter((c) => c !== '').join('\n')}`;
    })
    .join('\n\n');

  const releaseLink = forge.getReleaseUrl(config.ci.repoOwner!, config.ci.repoName!, tag);

  const releaseDate = new Date().toISOString().split('T')[0];

  let section = `## [${nextVersion}](${releaseLink}) - ${releaseDate}\n\n`;

  if (includeContributors) {
    const authors = changes
      .map((change) => `@${change.author}`)
      .sort()
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter((c) => !c.endsWith('[bot]'));
    if (authors.length > 0) {
      const contributors = `### ❤️ Thanks to all contributors! ❤️\n\n${authors.join(', ')}`;
      section += `${contributors}\n\n`;
    }
  }

  section += `${changeLog}`;

  return section;
}

export function extractVersionFromCommitMessage(commitMessage: string) {
  const semverRegex =
    /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/;

  const match = commitMessage.match(semverRegex);

  if (!match) {
    throw new Error(`Could not extract version from commit message: ${commitMessage}`);
  }

  return match[0];
}
