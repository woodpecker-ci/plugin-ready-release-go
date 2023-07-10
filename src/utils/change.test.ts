import { describe, it, expect } from "vitest";
import { getChangeLog, getNextVersionFromLabels } from "./change";
import { UserConfig } from "./types";
import { Change } from "./types";
import { defaultUserConfig } from "./config";

const changes: Change[] = [
  {
    commit: "123",
    labels: ["bug", "ui"],
    title: "Fix random UI bug",
    pullRequestNumber: 1337,
  },
  {
    commit: "456",
    labels: ["feature"],
    title: "Add new feature",
    pullRequestNumber: 1338,
  },
  {
    commit: "789",
    labels: ["breaking"],
    title: "Break everything",
    pullRequestNumber: 1339,
  },
  {
    commit: "abc",
    labels: ["bug"],
    title: "Fix another bug",
  },
  {
    commit: "def",
    labels: [],
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
    const changelog = getChangeLog("1.0.0", config, changes);

    console.log(changelog);

    expect(changelog).toMatchSnapshot();
  });
});
