import { describe, it, expect, vi, beforeAll } from "vitest";
import { run } from "./index";
import { Config, defaultUserConfig } from "./utils/config";
import { GithubForge } from "./forges/github";
import { SimpleGit, simpleGit } from "simple-git";

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
    pullRequestBranchPrefix: "next-release/",
    isCI: true,
    releasePrefix: "🎉 Release",
    debug: false,
  },
  user: defaultUserConfig,
};

describe("index", () => {
  beforeAll(() => {
    const date = new Date(2000, 1, 1, 13);
    vi.setSystemTime(date);

    // vi.mock("./cmd/prepare");
    vi.mock("./cmd/release");
  });

  it("should prepare a new release", async () => {
    const git = getMockedGit();
    const forge = getMockedForged();

    const latestTag = "2.0.1";
    const tags = ["1.0.3", latestTag];
    vi.spyOn(git, "tags").mockImplementation(() =>
      mockSimpleGitResponse({ all: tags, latest: latestTag })
    );
    const commits = [
      {
        hash: "",
        date: "",
        message: "fix sth on the backend",
        refs: "",
        body: "",
        author_name: "",
        author_email: "",
        diff: undefined,
      },
      {
        hash: "",
        date: "",
        message: "add some nice feature to the ui",
        refs: "",
        body: "",
        author_name: "",
        author_email: "",
        diff: undefined,
      },
    ];
    vi.spyOn(git, "log").mockImplementation(() =>
      mockSimpleGitResponse({
        all: commits,
        total: commits.length,
        latest: commits[0],
      })
    );
    vi.spyOn(git, "tags").mockImplementation(() =>
      mockSimpleGitResponse({ all: tags, latest: latestTag })
    );

    // TODO: mock prepare / release command

    await run({
      git,
      forge,
      config,
    });
  });

  it.todo("should prepare a new rc release");

  it.todo("should prepare a new release after an rc release");

  it.todo("should release a new release");
  it.todo("should release a new rc release");
});

type SimpleGitResponse<T> = SimpleGit & Promise<T>;

const mockSimpleGitResponse = <T>(value: T): SimpleGitResponse<T> => {
  return Promise.resolve(value) as SimpleGitResponse<T>;
};

function getMockedGit(): SimpleGit {
  const git = simpleGit();
  vi.spyOn(git, "addConfig").mockImplementation(() =>
    mockSimpleGitResponse("")
  );
  vi.spyOn(git, "getRemotes").mockImplementation(() =>
    mockSimpleGitResponse([
      {
        name: "origin",
        refs: {
          fetch: "",
          push: "https://oauth:token123@github.com/woodpecker-ci/woodpecker",
        },
      },
    ])
  );

  vi.spyOn(git, "fetch").mockImplementation(() =>
    mockSimpleGitResponse({
      raw: "",
      remote: null,
      branches: [],
      tags: [],
      updated: [],
      deleted: [],
    })
  );
  vi.spyOn(git, "checkout").mockImplementation(() => mockSimpleGitResponse(""));
  vi.spyOn(git, "branch").mockImplementation(() =>
    mockSimpleGitResponse({
      detached: false,
      current: "",
      all: [],
      branches: {},
    })
  );
  vi.spyOn(git, "pull").mockImplementation(() =>
    mockSimpleGitResponse({
      files: [],
      insertions: {},
      deletions: {},
      summary: {
        changes: 0,
        insertions: 0,
        deletions: 0,
      },
      created: [],
      deleted: [],
      remoteMessages: {
        all: [],
      },
    })
  );

  return git;
}

function getMockedForged() {
  const forge = new GithubForge("", "");

  vi.spyOn(forge, "createOrUpdatePullRequest").mockImplementation(() => {});
  vi.spyOn(forge, "getPullRequestFromCommit").mockImplementation(
    (o: { owner: string; repo: string; commitHash: string }) => {
      return Promise.resolve({
        number: 1,
        title: "",
        author: "anbraten",
        description: "fixes are so cool",
        labels: ["bug"],
      });
    }
  );

  return forge;
}
