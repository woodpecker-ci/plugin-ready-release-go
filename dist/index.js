"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_shelljs = __toESM(require("shelljs"));
var import_picocolors3 = __toESM(require("picocolors"));
var import_simple_git = require("simple-git");

// src/cmd/prepare.ts
var import_picocolors = __toESM(require("picocolors"));

// src/utils/change.ts
var import_semver = __toESM(require("semver"));
function getNextVersionFromLabels(lastVersion, config, changes) {
  if (changes.length === 0) {
    return null;
  }
  const changeLabels = config.changeTypes.reduce(
    (acc, c4) => {
      acc[c4.bump].push(...c4.labels);
      return acc;
    },
    { minor: [], major: [], patch: [] }
  );
  const labels = changes.reduce(
    (acc, change) => [...acc, ...change.labels],
    []
  );
  if (changeLabels["major"].some((l) => labels.includes(l))) {
    return import_semver.default.inc(lastVersion, "major");
  }
  if (changeLabels["minor"].some((l) => labels.includes(l))) {
    return import_semver.default.inc(lastVersion, "minor");
  }
  return import_semver.default.inc(lastVersion, "patch");
}
function getChangeLogSection(nextVersion, config, changes, forge, includeContributors) {
  const defaultChangeType = config.user.changeTypes.find((c4) => c4.default);
  const changeSections = changes.reduce((acc, change) => {
    var _a, _b, _c;
    const changeType = config.user.changeTypes.find(
      (c4) => c4.labels.some((l) => change.labels.includes(l))
    ) || defaultChangeType;
    if (!changeType) {
      return acc;
    }
    if (!acc.has(changeType.title)) {
      acc.set(changeType.title, { default: false, ...changeType, changes: [] });
    }
    const commitLink = forge.getCommitUrl(
      config.ci.repoOwner,
      config.ci.repoName,
      change.commitHash
    );
    if (change.pullRequestNumber) {
      const prLink = forge.getPullRequestUrl(
        config.ci.repoOwner,
        config.ci.repoName,
        change.pullRequestNumber
      );
      const entry = `- ${change.title} [[#${change.pullRequestNumber}](${prLink})]`;
      (_a = acc.get(changeType.title)) == null ? void 0 : _a.changes.push(entry);
    } else {
      const entry = `- ${change.title} ([${change.commitHash.substring(
        0,
        7
      )}](${commitLink}))`;
      (_b = acc.get(changeType.title)) == null ? void 0 : _b.changes.push(entry);
    }
    (_c = acc.get(changeType.title)) == null ? void 0 : _c.changes.push();
    return acc;
  }, /* @__PURE__ */ new Map());
  const changeLog = Array.from(changeSections.values()).sort(
    (a, b) => (b.weight || (b.default ? -1 : 0)) - (a.weight || (a.default ? -1 : 0))
  ).map((changeSection) => {
    return `### ${changeSection.title}

${changeSection.changes.filter((c4) => c4 !== "").join("\n")}`;
  }).join("\n\n");
  const releaseLink = forge.getReleaseUrl(
    config.ci.repoOwner,
    config.ci.repoName,
    nextVersion
  );
  const contributors = `### \u2764\uFE0F Thanks to all contributors! \u2764\uFE0F

${changes.map((change) => `@${change.author}`).filter((v, i, a) => a.indexOf(v) === i).join(", ")}`;
  const releaseDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let section = `## [${nextVersion}](${releaseLink}) - ${releaseDate}

`;
  if (includeContributors) {
    section += `${contributors}

`;
  }
  section += `${changeLog}`;
  return section;
}
function updateChangelogSection(latestVersion, nextVersion, _oldChangelog, newSection) {
  var _a;
  let oldChangelog = _oldChangelog.replace("# Changelog\n\n", "");
  let sections = [];
  const sectionBegin = `## [`;
  while (oldChangelog.includes(sectionBegin)) {
    const start = oldChangelog.indexOf(sectionBegin);
    let end = oldChangelog.indexOf(sectionBegin, start + 1);
    if (end === -1) {
      end = oldChangelog.length;
    }
    const section = oldChangelog.slice(start, end).trim();
    const version = (_a = section.match(/\[(.*?)\]/)) == null ? void 0 : _a[1];
    if (!version) {
      throw new Error("Could not find version in changelog section");
    }
    sections.push({ version, section });
    oldChangelog = oldChangelog.slice(end);
  }
  sections = sections.filter((s) => s.version !== nextVersion).filter((s) => import_semver.default.compare(s.version, latestVersion) !== 1);
  sections.push({ version: nextVersion, section: newSection });
  sections = sections.sort((a, b) => import_semver.default.compare(b.version, a.version));
  return `# Changelog

${sections.map((s) => s.section).join("\n\n")}
`;
}

// src/cmd/prepare.ts
var import_fs = require("fs");
async function prepare({
  config,
  forge,
  git,
  exec,
  changes,
  latestVersion,
  nextVersion
}) {
  console.log(
    "# Preparing release pull-request for version:",
    import_picocolors.default.green(nextVersion),
    "..."
  );
  const hookCtx = {
    exec,
    latestVersion,
    nextVersion,
    changes
  };
  const pullRequestBranch = config.user.getPullRequestBranch ? await config.user.getPullRequestBranch(hookCtx) : `next-release/${latestVersion}`;
  const releaseBranch = config.user.getReleaseBranch ? await config.user.getReleaseBranch(hookCtx) : "main";
  const branches = await git.branch();
  if (branches.all.includes(`remotes/origin/${pullRequestBranch}`)) {
    console.log(
      import_picocolors.default.yellow(`Branch "${pullRequestBranch}" already exists, checking it out.`)
    );
    await git.checkout([pullRequestBranch]);
    try {
      await git.pull(pullRequestBranch);
    } catch (e) {
      console.log(
        import_picocolors.default.yellow(
          `Error pulling "${pullRequestBranch}" branch. Maybe it does not exist yet?`
        ),
        e
      );
    }
    await git.merge([
      `origin/${releaseBranch}`,
      "-m",
      `Merge branch 'origin/${releaseBranch}' into '${pullRequestBranch}'`,
      "--no-edit"
    ]);
  } else {
    console.log(
      import_picocolors.default.yellow(`Branch "${pullRequestBranch}" does not exist yet, creating it.`)
    );
    await git.checkout(["-B", pullRequestBranch, "--track"]);
  }
  if (config.user.beforePrepare) {
    console.log("# Running beforePrepare hook");
    const hookResult = await config.user.beforePrepare(hookCtx);
    if (hookResult === false) {
      console.log("# beforePrepare hook returned false, skipping prepare.");
      return;
    }
  }
  let oldChangelog = "";
  if (await import_fs.promises.stat("CHANGELOG.md").catch(() => false)) {
    oldChangelog = await import_fs.promises.readFile("CHANGELOG.md", "utf-8");
  }
  const newChangelogSection = getChangeLogSection(
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
    newChangelogSection
  );
  console.log("# Updating CHANGELOG.md");
  await import_fs.promises.writeFile("CHANGELOG.md", changelog);
  const { isClean } = await git.status();
  if (!isClean()) {
    await git.add(".");
    await git.commit(`${config.ci.releasePrefix} ${nextVersion}`);
    await git.push(["-u", "origin", pullRequestBranch]);
  }
  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }
  const releaseDescription = config.user.getReleaseDescription ? await config.user.getReleaseDescription(hookCtx) : `This PR was opened by the [ready-release-go](https://github.com/woodpecker-ci/plugin-ready-release-go) plugin.When you're ready to do a release, you can merge this and a release and tag with version \`${nextVersion}\` will be created automatically.If you're not ready to do a release yet, that's fine, whenever you add more changes to \`${releaseBranch}\`this PR will be updated.

` + getChangeLogSection(nextVersion, config, changes, forge, false);
  console.log("# Creating release pull-request");
  const pullRequestLink = await forge.createOrUpdatePullRequest({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    title: `${config.ci.releasePrefix} ${nextVersion}`,
    description: releaseDescription,
    draft: true,
    sourceBranch: pullRequestBranch,
    targetBranch: releaseBranch
  });
  if (config.user.afterPrepare) {
    console.log("# Running afterPrepare hook");
    await config.user.afterPrepare(hookCtx);
  }
  console.log(
    "# Successfully prepared release pull-request: ",
    pullRequestLink
  );
  console.log("# Pull-request created");
}

// src/cmd/release.ts
var import_picocolors2 = __toESM(require("picocolors"));
async function release({
  config,
  exec,
  forge,
  changes,
  useVersionPrefixV,
  latestVersion,
  nextVersion
}) {
  const hookCtx = {
    exec,
    latestVersion,
    nextVersion,
    changes
  };
  if (config.user.beforeRelease) {
    console.log("# Running beforeRelease hook");
    if (await config.user.beforeRelease(hookCtx) === false) {
      return;
    }
  }
  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }
  const newChangelogSection = getChangeLogSection(
    nextVersion,
    config,
    changes,
    forge,
    true
  );
  const releaseDescription = config.user.getReleaseDescription ? await config.user.getReleaseDescription(hookCtx) : newChangelogSection;
  console.log("# Creating release");
  const tag = useVersionPrefixV && !nextVersion.startsWith("v") ? `v${nextVersion}` : nextVersion;
  const { releaseLink } = await forge.createRelease({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    tag,
    description: releaseDescription,
    name: nextVersion
  });
  console.log(import_picocolors2.default.green("# Successfully created release:"), releaseLink);
  if (config.user.commentOnReleasedPullRequests) {
    console.log("# Adding release comments to pull-requests");
    for await (const { pullRequestNumber } of changes) {
      if (!pullRequestNumber) {
        continue;
      }
      const comment = `\u{1F389} This PR is included in version ${nextVersion} \u{1F389}

The release is now available [here](${releaseLink})

Thank you for your contribution. \u2764\uFE0F\u{1F4E6}\u{1F680}`;
      await forge.addCommentToPullRequest({
        owner: config.ci.repoOwner,
        repo: config.ci.repoName,
        pullRequestNumber,
        comment
      });
    }
  }
  if (config.user.afterRelease) {
    console.log("# Running afterRelease hook");
    await config.user.afterRelease(hookCtx);
  }
}

// src/forges/forge.ts
var Forge = class {
};

// src/forges/github.ts
var import_rest = require("@octokit/rest");
var GithubForge = class extends Forge {
  accessToken;
  email;
  octokit;
  constructor(accessToken, email) {
    super();
    this.email = email;
    this.accessToken = accessToken;
    this.octokit = new import_rest.Octokit({
      auth: accessToken
    });
  }
  async createOrUpdatePullRequest(options) {
    const pullRequests = await this.octokit.pulls.list({
      owner: options.owner,
      repo: options.repo,
      head: `${options.owner}:${options.sourceBranch}`
    });
    if (pullRequests.data.length > 0) {
      const pr2 = await this.octokit.pulls.update({
        owner: options.owner,
        repo: options.repo,
        pull_number: pullRequests.data[0].number,
        title: options.title,
        draft: options.draft,
        head: options.sourceBranch,
        base: options.targetBranch,
        body: options.description
      });
      return { pullRequestLink: pr2.data._links.html.href };
    }
    const pr = await this.octokit.pulls.create({
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      draft: options.draft,
      head: options.sourceBranch,
      base: options.targetBranch,
      body: options.description
    });
    return { pullRequestLink: pr.data._links.html.href };
  }
  async createRelease(options) {
    const release2 = await this.octokit.repos.createRelease({
      owner: options.owner,
      repo: options.repo,
      tag_name: options.tag,
      name: options.name,
      body: options.description,
      prerelease: options.prerelease
    });
    return { releaseLink: release2.data.html_url };
  }
  async getGitCredentials() {
    return {
      email: this.email,
      username: "oauth",
      password: this.accessToken
    };
  }
  async getPullRequestFromCommit(options) {
    var _a;
    const pr = await this.octokit.repos.listPullRequestsAssociatedWithCommit({
      owner: options.owner,
      repo: options.repo,
      commit_sha: options.commitHash
    });
    if (pr.data.length === 0) {
      return void 0;
    }
    return {
      title: pr.data[0].title,
      author: (_a = pr.data[0].user) == null ? void 0 : _a.login,
      number: pr.data[0].number,
      labels: pr.data[0].labels.map((label) => label.name)
    };
  }
  async addCommentToPullRequest(options) {
    await this.octokit.issues.createComment({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.pullRequestNumber,
      body: options.comment
    });
  }
  getRepoUrl(owner, repo) {
    return `https://github.com/${owner}/${repo}`;
  }
  getCommitUrl(owner, repo, commitHash) {
    return `https://github.com/${owner}/${repo}/commit/${commitHash}`;
  }
  getIssueUrl(owner, repo, issueNumber) {
    return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  }
  getPullRequestUrl(owner, repo, pullRequestNumber) {
    return `https://github.com/${owner}/${repo}/pull/${pullRequestNumber}`;
  }
  getReleaseUrl(owner, repo, release2) {
    return `https://github.com/${owner}/${repo}/releases/tag/${release2}`;
  }
};

// src/forges/index.ts
async function getForge(config) {
  if (config.ci.forgeType === "github") {
    if (!config.ci.githubToken) {
      throw new Error("Please provide a Github token");
    }
    if (!config.ci.gitEmail) {
      throw new Error("Please provide a Git email");
    }
    return new GithubForge(config.ci.githubToken, config.ci.gitEmail);
  }
  throw new Error("Forge type not supported: " + config.ci.forgeType);
}

// src/utils/config.ts
var import_path = __toESM(require("path"));
var import_fs2 = require("fs");
var ciConfig = {
  configFile: process.env.PLUGIN_CONFIG_FILE,
  isCI: process.env.CI === "woodpecker",
  eventType: process.env.PLUGIN_EVENT_TYPE || process.env.CI_PIPELINE_EVENT,
  releaseBranch: process.env.PLUGIN_RELEASE_BRANCH || process.env.CI_REPO_DEFAULT_BRANCH || "main",
  commitMessage: process.env.PLUGIN_COMMIT_MESSAGE || process.env.CI_COMMIT_MESSAGE,
  forgeType: process.env.PLUGIN_FORGE_TYPE || process.env.CI_FORGE_TYPE,
  githubToken: process.env.PLUGIN_GITHUB_TOKEN,
  gitEmail: process.env.PLUGIN_GIT_EMAIL,
  repoOwner: process.env.PLUGIN_REPO_OWNER || process.env.CI_REPO_OWNER,
  repoName: process.env.PLUGIN_REPO_NAME || process.env.CI_REPO_NAME,
  releasePrefix: "\u{1F389} Release"
};
var defaultUserConfig = {
  changeTypes: [
    {
      title: "\u{1F4A5} Breaking changes",
      labels: ["breaking"],
      bump: "major",
      weight: 3
    },
    {
      title: "\u{1F512} Security",
      labels: ["security"],
      bump: "patch",
      weight: 2
    },
    {
      title: "\u2728 Features",
      labels: ["feature", "feature \u{1F680}\uFE0F"],
      bump: "minor",
      weight: 1
    },
    {
      title: "\u{1F4C8} Enhancement",
      labels: ["enhancement", "refactor", "enhancement \u{1F446}\uFE0F"],
      bump: "minor"
    },
    {
      title: "\u{1F41B} Bug Fixes",
      labels: ["bug", "bug \u{1F41B}\uFE0F"],
      bump: "patch"
    },
    {
      title: "\u{1F4DA} Documentation",
      labels: ["docs", "documentation", "documentation \u{1F4D6}\uFE0F"],
      bump: "patch"
    },
    {
      title: "Misc",
      labels: ["misc", "chore \u{1F9F0}"],
      bump: "patch",
      default: true
    }
  ],
  skipLabels: ["skip-release", "skip-changelog", "regression"],
  skipCommitsWithoutPullRequest: true,
  commentOnReleasedPullRequests: true
};
async function getConfig() {
  const userConfig = {};
  const configFilePath = ciConfig.configFile || import_path.default.join(process.cwd(), "release-config.ts");
  if (await import_fs2.promises.stat(configFilePath).then(() => true).catch(() => false)) {
    console.log("# Loading config from", configFilePath, "...");
    const _userConfig = await import(configFilePath);
    Object.assign(userConfig, _userConfig.default);
    console.log("# Loaded config from", configFilePath);
  }
  return {
    user: { ...defaultUserConfig, ...userConfig },
    ci: ciConfig
  };
}

// src/index.ts
async function run() {
  var _a;
  const config = await getConfig();
  const forge = await getForge(config);
  const git = (0, import_simple_git.simpleGit)();
  const hookCtx = {
    exec: import_shelljs.default.exec
  };
  if (config.ci.isCI) {
    console.log("# CI detected \u{1F916}");
  }
  console.log("# Event type:", import_picocolors3.default.green(config.ci.eventType));
  console.log("# Commit message was:", import_picocolors3.default.green(config.ci.commitMessage));
  if (config.ci.eventType !== "push") {
    console.log(import_picocolors3.default.yellow("# Not a push event, skipping."));
    return;
  }
  const credentials = await forge.getGitCredentials();
  await git.addConfig("user.name", credentials.username);
  await git.addConfig("user.email", credentials.email);
  const remotes = await git.getRemotes(true);
  if (remotes.length < 1) {
    console.log(import_picocolors3.default.yellow("# No remotes found, skipping."));
    return;
  }
  if (!remotes[0].refs.push.includes("@")) {
    const remote = remotes[0].refs.push.replace(
      "://",
      `://${credentials.username}:${credentials.password}@`
    );
    await git.removeRemote(remotes[0].name);
    await git.addRemote(remotes[0].name, remote);
  }
  const releaseBranch = config.user.getReleaseBranch ? await config.user.getReleaseBranch(hookCtx) : config.ci.releaseBranch;
  await git.fetch(["--unshallow", "--tags"]);
  await git.checkout(releaseBranch);
  await git.branch(["--set-upstream-to", `origin/${releaseBranch}`]);
  await git.pull();
  const tags = await git.tags();
  if (!tags.latest && tags.all.length > 0) {
    console.log(import_picocolors3.default.yellow("# Latest tag not found, but tags exist, skipping."));
    return;
  }
  const lastestTag = tags.latest || "0.0.0";
  if (tags.latest) {
    console.log("# Lastest tag is:", import_picocolors3.default.green(lastestTag));
  } else {
    console.log(
      import_picocolors3.default.green(`# No tags found. Starting with first tag: ${lastestTag}`)
    );
  }
  const unTaggedCommits = await git.log(
    lastestTag === "0.0.0" ? [releaseBranch] : {
      from: lastestTag,
      symmetric: false,
      to: releaseBranch
    }
  );
  if (unTaggedCommits.total === 0) {
    console.log(import_picocolors3.default.yellow("# No untagged commits found, skipping."));
    return;
  }
  console.log("# Found", import_picocolors3.default.green(unTaggedCommits.total), "untagged commits");
  const useVersionPrefixV = config.user.useVersionPrefixV === void 0 ? lastestTag.startsWith("v") : config.user.useVersionPrefixV;
  const latestVersion = lastestTag.replace("v", "");
  const changes = [];
  for await (const commit of unTaggedCommits.all) {
    if (commit.message.startsWith(config.ci.releasePrefix)) {
      continue;
    }
    const pr = await forge.getPullRequestFromCommit({
      owner: config.ci.repoOwner,
      repo: config.ci.repoName,
      commitHash: commit.hash
    });
    if (config.user.skipCommitsWithoutPullRequest && !pr) {
      console.log(
        import_picocolors3.default.yellow("# No pull-request found for commit, skipping."),
        `${commit.hash}: "${commit.message}"`
      );
      continue;
    }
    if (pr == null ? void 0 : pr.labels.some((l) => {
      var _a2;
      return (_a2 = config.user.skipLabels) == null ? void 0 : _a2.includes(l);
    })) {
      console.log(
        import_picocolors3.default.yellow("# Skipping commit / PR by label:"),
        `${commit.hash}: "${commit.message}"`
      );
      continue;
    }
    changes.push({
      commitHash: commit.hash,
      author: (pr == null ? void 0 : pr.author) || commit.author_name,
      title: (pr == null ? void 0 : pr.title) || commit.message,
      labels: (pr == null ? void 0 : pr.labels) || [],
      pullRequestNumber: pr == null ? void 0 : pr.number
    });
  }
  console.log(import_picocolors3.default.yellow("changes"), changes);
  const nextVersion = config.user.getNextVersion ? await config.user.getNextVersion(hookCtx) : getNextVersionFromLabels(latestVersion, config.user, changes);
  if (!nextVersion) {
    console.log(import_picocolors3.default.yellow("# No changes found, skipping."));
    return;
  }
  console.log("# Next version will be:", import_picocolors3.default.green(nextVersion));
  const commandCtx = {
    config,
    forge,
    git,
    changes,
    nextVersion,
    latestVersion,
    useVersionPrefixV,
    exec: import_shelljs.default.exec
  };
  if ((_a = config.ci.commitMessage) == null ? void 0 : _a.startsWith(config.ci.releasePrefix)) {
    console.log(import_picocolors3.default.green("# Release commit detected."));
    console.log("# Now releasing version:", import_picocolors3.default.green(nextVersion));
    await release(commandCtx);
    console.log("# Successfully released version:", import_picocolors3.default.green(nextVersion));
    return;
  }
  console.log("# Push to release branch detected.");
  await prepare(commandCtx);
}
async function main() {
  try {
    await run();
  } catch (error) {
    console.error(import_picocolors3.default.red(error.message));
    process.exit(1);
  }
}
main();
