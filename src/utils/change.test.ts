import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  getChangeLogSection,
  getNextVersionFromLabels,
  updateChangelogSection,
} from "./change";
import { Change } from "./types";
import { Config, defaultUserConfig } from "./config";
import { GithubForge } from "../forges/github";
import { promises as fs } from "fs";
import path from "path";

const changes: Change[] = [
  {
    commitHash: "123",
    author: "John Doe",
    labels: ["bug", "ui"],
    title: "Fix random UI bug",
    pullRequestNumber: 1337,
  },
  {
    commitHash: "456",
    author: "Alice Wonderland",
    labels: ["feature"],
    title: "Add new feature",
    pullRequestNumber: 1338,
  },
  {
    commitHash: "789",
    author: "John Doe",
    labels: ["breaking"],
    title: "Break everything",
    pullRequestNumber: 1339,
  },
  {
    commitHash: "abc",
    author: "Alice Wonderland",
    labels: ["bug"],
    title: "Fix another bug",
  },
  {
    commitHash: "def",
    author: "Alice Wonderland",
    labels: [],
    title: "Update README",
  },
  {
    commitHash: "def",
    author: "Alice Wonderland",
    labels: ["enhancement"],
    title: "Update README",
  },
];
const config: Config = {
  ci: {
    releaseBranch: "main",
    commitMessage: "chore(release): 1.0.0 [skip ci]",
    configFile: "ready-go-release.config.ts",
    eventType: "push",
    gitEmail: "ci@woodpecker-ci.org",
    repoOwner: "woodpecker-ci",
    repoName: "woodpecker",
    forgeType: "github",
    githubToken: "123",
    isCI: true,
    releasePrefix: "🎉 Release",
    debug: false,
  },
  user: defaultUserConfig,
};

describe("change", () => {
  beforeAll(() => {
    const date = new Date(2000, 1, 1, 13);
    vi.setSystemTime(date);
  });

  it("should get the correct major bump", () => {
    const nextVersion = getNextVersionFromLabels("1.0.0", config.user, changes);
    expect(nextVersion).toBe("2.0.0");
  });

  it("should get the correct minor bump", () => {
    const nextVersion = getNextVersionFromLabels(
      "1.0.0",
      config.user,
      changes.filter((change) => !change.labels.includes("breaking"))
    );

    expect(nextVersion).toBe("1.1.0");
  });

  it("should get the correct patch bump", () => {
    const nextVersion = getNextVersionFromLabels(
      "1.0.0",
      config.user,
      changes
        .filter((change) => !change.labels.includes("breaking"))
        .filter((change) => !change.labels.includes("feature"))
        .filter((change) => !change.labels.includes("enhancement"))
    );

    expect(nextVersion).toBe("1.0.1");
  });

  it("should generate a changelog", () => {
    const forge = new GithubForge("", "");
    const changelog = getChangeLogSection(
      "1.0.0",
      config,
      changes,
      forge,
      true
    );

    expect(changelog).toMatchSnapshot();
  });

  const changelogFiles = [
    {
      name: "should add new section",
      file: "__fixtures__/CHANGELOG_1.md",
      latestVersion: "1.0.0",
      nextVersion: "1.0.1",
    },
    {
      name: "should update existing changelog section",
      file: "__fixtures__/CHANGELOG_2.md",
      latestVersion: "2.0.1",
      nextVersion: "2.0.3",
    },
    {
      name: "should remove versions newer than the latest released version",
      // this happens if we bump the version in an existing release PR
      file: "__fixtures__/CHANGELOG_3.md",
      latestVersion: "2.0.1",
      nextVersion: "2.0.4",
    },
  ];
  it.each(changelogFiles)(
    "$name",
    async ({ file, nextVersion, latestVersion }) => {
      const oldChangelog = await fs.readFile(
        path.join(__dirname, file),
        "utf8"
      );

      const forge = new GithubForge("", "");
      const newSection = getChangeLogSection(
        nextVersion,
        config,
        changes,
        forge,
        true
      );
      const changelog = updateChangelogSection(
        latestVersion,
        nextVersion,
        oldChangelog,
        newSection
      );

      expect(changelog).toMatchSnapshot();
    }
  );
});
