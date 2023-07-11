import { describe, it, expect } from "vitest";
import {
  getChangeLogSection,
  getNextVersionFromLabels,
  updateChangelogSection,
} from "./change";
import { UserConfig } from "./types";
import { Change } from "./types";
import { defaultUserConfig } from "./config";

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
const config: UserConfig = defaultUserConfig;

describe("change", () => {
  it("should get the correct major bump", () => {
    const nextVersion = getNextVersionFromLabels("1.0.0", config, changes);
    expect(nextVersion).toBe("2.0.0");
  });

  it("should get the correct minor bump", () => {
    const nextVersion = getNextVersionFromLabels(
      "1.0.0",
      config,
      changes.filter((change) => !change.labels.includes("breaking"))
    );

    expect(nextVersion).toBe("1.1.0");
  });

  it("should get the correct patch bump", () => {
    const nextVersion = getNextVersionFromLabels(
      "1.0.0",
      config,
      changes
        .filter((change) => !change.labels.includes("breaking"))
        .filter((change) => !change.labels.includes("feature"))
    );

    expect(nextVersion).toBe("1.0.1");
  });

  it("should generate a changelog", () => {
    const changelog = getChangeLogSection("1.0.0", config, changes);

    console.log(changelog);

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

    const nextVersion = "1.0.0";
    const newSection = getChangeLogSection(nextVersion, config, changes);
    const changelog = updateChangelogSection(
      nextVersion,
      oldChangelog,
      newSection
    );

    expect(changelog).toMatchSnapshot();
  });
});
