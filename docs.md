---
name: Ready release go 🚀
description: Plugin for semi-automated releases.
author: Woodpecker Authors
tags: [git, release]
containerImage: woodpeckerci/plugin-ready-release-go
containerImageUrl: https://hub.docker.com/r/woodpeckerci/plugin-ready-release-go
url: https://github.com/woodpecker-ci/plugin-ready-release-go
---

# Introduction

This plugin can be executed on every push to your release branch (e.g. default branch) and will create a new release pull-request with an updated changelog
as preparation for the next release.
After merging the "release"-pull-request, a new release / tag will be created for you.

A Woodpecker workflow file could look like this:

```yaml
steps:
  release-helper:
    image: woodpeckerci/plugin-ready-release-go
    settings:
      # release_branch: 'custom-release-branch' # default: CI_REPO_DEFAULT_BRANCH
      git_email: <email>
      forge_token:
        from_secret: GITHUB_TOKEN

when:
  event: push
  branch: ${CI_REPO_DEFAULT_BRANCH}
```

## Features

- Create automated changelog based on PRs which updates itself after each merge to the default branch
- Auto-categorization of PRs based on labels
- Automatically determines the next semver version using the PR labels
- Supports any kind of programming language, changelog tool and commit style
- Allows to execute custom hooks like pre, post-release

## Settings

There are two parts to configure the plugin:

### 1. Most basic options can be configured via plugin settings

| Settings                     | Default                | Description                                       |
| ---------------------------- | ---------------------- | ------------------------------------------------- |
| `FORGE_TYPE`                 | CI_FORGE_TYPE          | The forge type we connect to (github, gitea, ...) |
| `FORGE_URL`                  | CI_FORGE_URL           | The url of the forge                              |
| `FORGE_TOKEN`                | _none_                 | The token to connect to the forge                 |
| `GIT_EMAIL`                  | _none_                 | The email to use for git commits                  |
| `RELEASE_BRANCH`             | CI_REPO_DEFAULT_BRANCH | The branch used to merge the changelog to         |
| `PULL_REQUEST_BRANCH_PREFIX` | `next-release/`        | The prefix used for release pull-request branches |
| `DEBUG`                      | `false`                | Enable debug logging                              |
| `RELEASE_PREFIX`             | 🎉 Release             | Prefix of the PR title                            |

### 2. Using a `release-config.ts` file in your repository

Add a `release-config.ts` file to the root of your repository. Have a look at the [UserConfig](https://github.com/woodpecker-ci/plugin-ready-release-go/blob/main/src/utils/types.ts) type for all available options.

```ts
export default {
  changeTypes: [
    {
      title: '💥 Breaking changes',
      labels: ['breaking'],
      bump: 'major',
      weight: 3,
    },
    {
      title: '🔒 Security',
      labels: ['security'],
      bump: 'patch',
      weight: 2,
    },
    {
      title: '✨ Features',
      labels: ['feature', 'feature 🚀️'],
      bump: 'minor',
      weight: 1,
    },
    {
      title: '📈 Enhancement',
      labels: ['enhancement', 'refactor', 'enhancement 👆️'],
      bump: 'minor',
    },
    {
      title: '🐛 Bug Fixes',
      labels: ['bug', 'bug 🐛️'],
      bump: 'patch',
    },
    {
      title: '📚 Documentation',
      labels: ['docs', 'documentation', 'documentation 📖️'],
      bump: 'patch',
    },
    {
      title: '📦️ Dependency',
      labels: ['dependency', 'dependencies'],
      bump: 'patch',
      weight: -1,
    },
    {
      title: 'Misc',
      labels: ['misc', 'chore 🧰'],
      bump: 'patch',
      default: true,
      weight: -2,
    },
  ],
  skipLabels: ['skip-release', 'skip-changelog', 'regression'],
  skipCommitsWithoutPullRequest: true,
  commentOnReleasedPullRequests: false,
};
```

The plugin also supports executing custom hooks which can e.g. help to perform additional actions during a release (e.g. updating a helm chart's `appVersion` field):

```ts
export default {
  beforePrepare: async ({ exec, nextVersion }) => {
    await exec(`sed -i "s/^version:.*$/version: ${nextVersion}/g" Chart.yaml`);
  },
};
```

To avoid Woodpecker workflow runs you should also consider adding an exclude condition. Otherwise the pull requests created and updates by this plugin triggers a workflow run itself. This could cause issues if your
workflow contains plubishing steps based on your pull requests.

To prevent this behavior you can add this evaluation condition in your steps or a complete workflow:

```yml
evaluate: 'not (CI_COMMIT_SOURCE_BRANCH contains "next-release/")'
```
