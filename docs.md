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
    image: woodpeckerci/plugin-ready-release-go:0.6.1
    settings:
      release_branch: ${CI_REPO_DEFAULT_BRANCH}
      forge_type: github
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
- Automatically determines the next version
- Supports any kind of programming language, changelog tool and commit style
- Execute custom pre-release hooks

## Overriding Settings

To override the default settings, add a `release-config.ts` file to your repository.

```ts
export default {
  commentOnReleasedPullRequests: false,
};
```

The plugin also supports executing custom prepare hooks before the plugin execution which can e.g. help to perform additional actions during a release (e.g. updating a helm chart's `appVersion` field):

```ts
export default {
  beforePrepare: async ({ exec, nextVersion }) => {
    await exec(`sed -i "s/^version:.*$/version: ${nextVersion}/g" Chart.yaml`);
  }
};
```

## Settings

| Settings Name             | Default                             | Description                                                                                                                            |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `depth`                   | _none_                              | If specified, uses git's `--depth` option to create a shallow clone with a limited number of commits, overwritten by partial           |
| `lfs`                     | `true`                              | Set this to `false` to disable retrieval of LFS files                                                                                  |
| `recursive`               | `false`                             | Clones submodules recursively                                                                                                          |
| `skip_verify`             | `false`                             | Skips the SSL verification                                                                                                             |
| `tags`                    | `false` (except on tag event)       | Fetches tags when set to true, default is false if event is not tag else true                                                          |
| `submodule_overrides`     | _none_                              | Override submodule urls                                                                                                                |
| `submodule_update_remote` | `false`                             | Pass the --remote flag to git submodule update                                                                                         |
| `custom_ssl_path`         | _none_                              | Set path to custom cert                                                                                                                |
| `custom_ssl_url`          | _none_                              | Set url to custom cert                                                                                                                 |
| `backoff`                 | `5sec`                              | Change backoff duration                                                                                                                |
| `attempts`                | `5`                                 | Change backoff attempts                                                                                                                |
| `branch`                  | $CI_COMMIT_BRANCH                   | Change branch name to checkout to                                                                                                      |
| `partial`                 | `true` (except if tags are fetched) | Only fetch the one commit and it's blob objects to resolve all files, overwrite depth with 1                                           |
| `home`                    |                                     | Change HOME var for commands executed, fail if it does not exist                                                                       |
| `remote`                  | $CI_REPO_CLONE_URL                  | Set the git remote url                                                                                                                 |
| `sha`                     | $CI_COMMIT_SHA                      | git commit hash to retrieve (use `sha: ''` to clone the `ref`)                                                                         |
| `ref`                     | $CI_COMMIT_REF                      | Set the git reference to retrieve (use `ref: refs/head/a_branch` and `sha: ''` to retrieve the head commit from the "a_branch" branch) |
| `path`                    | $CI_WORKSPACE                       | Set destination path to clone to                                                                                                       |
