---
name: Release Helper
icon: https://woodpecker-ci.org/img/logo.svg

description: Plugin for semi-automated releases.
authors: Woodpecker Authors
tags: [git, release]
containerImage: woodpeckerci/plugin-ready-release-go
containerImageUrl: https://hub.docker.com/r/woodpeckerci/plugin-ready-release-go
url: https://github.com/woodpecker-ci/plugin-ready-release-go
---

# Introduction

This plugin aims to help with git-based releases.
It should be run on every commit of the default branch to execute it's necessary actions.

A Woodpecker workflow file could look like this:

```yaml
steps:
  release-helper:
    image: woodpeckerci/plugin-ready-release-go
    settings:
      # release_branch: 'custom-release-branch' # default: CI_REPO_DEFAULT_BRANCH
      git_email: <email>
      github_token:
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
| `GITHUB_TOKEN`               | _none_                 | The GitHub token to use for the GitHub API        |
| `GIT_EMAIL`                  | _none_                 | The email to use for git commits                  |
| `RELEASE_BRANCH`             | CI_REPO_DEFAULT_BRANCH | The branch used to merge the changelog to         |
| `PULL_REQUEST_BRANCH_PREFIX` | `next-release/`        | The prefix used for release pull-request branches |
| `DEBUG`                      | `false`                | Enable debug logging                              |

### 2. Using a `release-config.ts` file in your repository

Add a `release-config.ts` file to the root of your repository. Have a look at the [UserConfig](https://github.com/woodpecker-ci/plugin-ready-release-go/blob/main/src/utils/types.ts) type for all available options.

```ts
export default {
  commentOnReleasedPullRequests: false,
};
````

The plugin also supports executing custom hooks which can e.g. help to perform additional actions during a release (e.g. updating a helm chart's `appVersion` field):

```ts
export default {
  beforePrepare: async ({ exec, nextVersion }) => {
    await exec(`sed -i "s/^version:.*$/version: ${nextVersion}/g" Chart.yaml`);
  },
};
```
