import semver from "semver";
import { Change, UserConfig } from "./types";

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

export function getChangeLog(
  nextVersion: string,
  config: UserConfig,
  changes: Change[]
) {
  const repo = `woodpecker-ci/woodpecker`;

  config.changeTypes!.sort((a, b) => (a.weight || 0) - (b.weight || 0));

  const defaultChangeType = config.changeTypes!.find((c) => c.default);

  const changeSections = changes.reduce((acc, change) => {
    const changeType =
      config.changeTypes!.find((c) =>
        c.labels.some((l) => change.labels.includes(l))
      ) || defaultChangeType;

    if (!changeType) {
      return acc;
    }

    if (!acc.has(changeType.title)) {
      acc.set(changeType.title, { ...changeType, changes: [] });
    }

    const commitLink = `https://github.com/${repo}/commit/${change.commit}`;
    if (change.pullRequestNumber) {
      const prLink = `https://github.com/${repo}/pull/${change.pullRequestNumber}`;
      const entry = `- ${change.title} [#${change.pullRequestNumber}](${prLink}) ([${change.commit}](${commitLink}))`;
      acc.get(changeType.title)?.changes.push(entry);
    } else {
      const entry = `- ${change.title} ([${change.commit}](${commitLink}))`;
      acc.get(changeType.title)?.changes.push(entry);
    }

    acc.get(changeType.title)?.changes.push();
    return acc;
  }, new Map<string, { title: string; weight?: number; changes: string[] }>());

  const changeLog = Array.from(changeSections.values())
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .map((changeSection) => {
      return `### ${changeSection.title}\n\n${changeSection.changes
        .filter((c) => c !== "")
        .join("\n")}`;
    })
    .join("\n\n");

  // TODO: get release link from config / forge
  const releaseLink = `https://github.com/${repo}/releases/tag/${nextVersion}`;

  return `## [${nextVersion}](${releaseLink}) - ${
    new Date().toISOString().split("T")[0]
  }\n\n${changeLog}`;
}
