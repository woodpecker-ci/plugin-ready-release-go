import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  getChangeLogSection,
  getNextVersionFromLabels,
  updateChangelogSection,
} from "./change";
import { Change } from "./types";
import { Config, defaultUserConfig } from "./config";
import { GithubForge } from "../forges/github";

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
    branch: "main",
    commitMessage: "chore(release): 1.0.0 [skip ci]",
    configFile: "ready-go-release.config.ts",
    eventType: "push",
    gitEmail: "ci@woodpecker-ci.org",
    repoOwner: "woodpecker-ci",
    repoName: "woodpecker",
    forgeType: "github",
    githubToken: "123",
    isCI: true,
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
    );

    expect(nextVersion).toBe("1.0.1");
  });

  it("should generate a changelog", () => {
    const forge = new GithubForge("", "");
    const changelog = getChangeLogSection("1.0.0", config, changes, forge);

    expect(changelog).toMatchSnapshot();
  });

  it("should update changelog section", () => {
    const oldChangelog = `# Changelog

## [1.0.0](https://github.com/woodpecker-ci/woodpecker/releases/tag/1.0.0) - 2023-07-11

### ✨ Features

- Add new feature [#1338](https://github.com/woodpecker-ci/woodpecker/pull/1338) ([456](https://github.com/woodpecker-ci/woodpecker/commit/456))

## [0.0.2](https://github.com/woodpecker-ci/woodpecker/releases/tag/0.0.1) - 2020-01-01

### 🐛 Bug Fixes

- Fix random UI bug [#1337](https://github.com/woodpecker-ci/woodpecker/pull/1337) ([123](https://github.com/woodpecker-ci/woodpecker/commit/123))
- Fix another bug [#43](https://github.com/woodpecker-ci/woodpecker/pull/43) ([456](https://github.com/woodpecker-ci/woodpecker/commit/456))

## [0.0.1](https://github.com/woodpecker-ci/woodpecker/releases/tag/0.0.1) - 2020-01-01

### ✨ Features

- Add new feature (#1338) @Alice Wonderland
    `;
    const forge = new GithubForge("", "");
    const nextVersion = "1.0.0";
    const newSection = getChangeLogSection(nextVersion, config, changes, forge);
    const changelog = updateChangelogSection(
      nextVersion,
      oldChangelog,
      newSection
    );

    expect(changelog).toMatchSnapshot();
  });
});
