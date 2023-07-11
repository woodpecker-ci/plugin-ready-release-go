import semver from "semver";
import { Change, UserConfig } from "./types";
import { Config } from "./config";
import { Forge } from "../forges/forge";

export function getNextVersionFromLabels(
  lastVersion: string,
  config: UserConfig,
  changes: Change[]
) {
  if (changes.length === 0) {
    return null;
  }

  const changeLabels = config.changeTypes!.reduce(
    (acc, c) => {
      acc[c.bump].push(...c.labels);
      return acc;
    },
    { minor: [] as string[], major: [] as string[], patch: [] as string[] }
  );

  const labels = changes.reduce(
    (acc, change) => [...acc, ...change.labels],
    [] as string[]
  );

  if (changeLabels["major"].some((l) => labels.includes(l))) {
    return semver.inc(lastVersion, "major");
  }

  if (changeLabels["minor"].some((l) => labels.includes(l))) {
    return semver.inc(lastVersion, "minor");
  }

  return semver.inc(lastVersion, "patch");
}

export function getChangeLogSection(
  nextVersion: string,
  config: Config,
  changes: Change[],
  forge: Forge
) {
  const defaultChangeType = config.user.changeTypes!.find((c) => c.default);

  const changeSections = changes.reduce((acc, change) => {
    const changeType =
      config.user.changeTypes!.find((c) =>
        c.labels.some((l) => change.labels.includes(l))
      ) || defaultChangeType;

    if (!changeType) {
      return acc;
    }

    if (!acc.has(changeType.title)) {
      acc.set(changeType.title, { default: false, ...changeType, changes: [] });
    }

    const commitLink = forge.getCommitUrl(
      config.ci.repoOwner!,
      config.ci.repoName!,
      change.commitHash
    );
    if (change.pullRequestNumber) {
      const prLink = forge.getPullRequestUrl(
        config.ci.repoOwner!,
        config.ci.repoName!,
        change.pullRequestNumber
      );
      const entry = `- ${change.title} [[#${change.pullRequestNumber}](${prLink})]`;
      acc.get(changeType.title)?.changes.push(entry);
    } else {
      const entry = `- ${change.title} ([${change.commitHash.substring(
        0,
        7
      )}](${commitLink}))`;
      acc.get(changeType.title)?.changes.push(entry);
    }

    acc.get(changeType.title)?.changes.push();
    return acc;
  }, new Map<string, { title: string; weight?: number; changes: string[]; default: boolean }>());

  const changeLog = Array.from(changeSections.values())
    .sort(
      (a, b) =>
        (b.weight || (b.default ? -1 : 0)) - (a.weight || (a.default ? -1 : 0))
    )
    .map((changeSection) => {
      return `### ${changeSection.title}\n\n${changeSection.changes
        .filter((c) => c !== "")
        .join("\n")}`;
    })
    .join("\n\n");

  const releaseLink = forge.getReleaseUrl(
    config.ci.repoOwner!,
    config.ci.repoName!,
    nextVersion
  );

  return `## [${nextVersion}](${releaseLink}) - ${
    new Date().toISOString().split("T")[0]
  }\n\n${changeLog}`;
}

export function updateChangelogSection(
  nextVersion: string,
  _oldChangelog: string,
  newSection: string
) {
  let oldChangelog = _oldChangelog.replace("# Changelog\n\n", "");

  let sections: { version: string; section: string }[] = [];

  const sectionBegin = `## [`;
  while (oldChangelog.includes(sectionBegin)) {
    const start = oldChangelog.indexOf(sectionBegin);
    const end =
      oldChangelog.indexOf(sectionBegin, start + 1) || oldChangelog.length;

    const section = oldChangelog.slice(start, end).trim();
    const version = section.match(/\[(.*?)\]/)?.[1];
    if (!version) {
      throw new Error("Could not find version in changelog section");
    }
    sections.push({ version, section });

    oldChangelog = oldChangelog.slice(end);
  }

  sections = sections.filter((s) => s.version !== nextVersion);
  sections.push({ version: nextVersion, section: newSection });

  sections = sections.sort((a, b) => semver.compare(a.version, b.version));

  return `# Changelog\n\n${sections.map((s) => s.section).join("\n\n")}`;
}
