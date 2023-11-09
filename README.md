# Ready release go :rocket:

This plugin can be executed on every push to your release branch (e.g. main) and will create a new release pull-request with all of your custom adjustments like an updated changelog as preparation for the next release. After you have merged the "release"-pull-request with all your desired changes, a new release / tag will be created for you.

## Workflow

1. Setup ready-release-go on your repository by adding a config file and a workflow file
1. On every push to your default branch a pull-request will be created and updated
1. You can review the pull-request and merge it when you are ready
1. The plugin will create a new release

## Interal workflow

- get latest release => tag
- get all commits since commit of last tag
- get all prs of those commits (if they have a pr associated)
- get all labels of those prs
- get next version based on labels of PRs
- get changelog based on labels of PRs

## Roadmap

- [x] Automatically create release pull-request
- [x] Automatically update release pull-request
- [x] Create a release / tag after "release"-pull-request got merged
- [ ] Support more forges: (Gitea, Gitlab, ...)
- [x] Support first release (no previous tags)
- [ ] Support defining next version manually
- [ ] Handle -rc versions

## Usage

### Woodpecker CI

Create a new workflow like `.woodpecker/release-helper.yml`:


```yaml
when:
  event: push
  branch: ${CI_REPO_DEFAULT_BRANCH}

steps:
  release-helper:
    image: woodpeckerci/plugin-ready-release-go:latest
    settings:
      # release_branch: 'custom-release-branch' # default: main
      git_email: woodpecker-bot@obermui.de
      github_token:
        from_secret: GITHUB_TOKEN
```

### Github Actions

Create a new workflow like `.github/workflows/release-helper.yml`:

```yaml
name: Release helper

on:
  push:
    branches:
      - main

jobs:
  release-helper:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Release helper
        uses: woodpeckerci/plugin-ready-release-go@v1
        with:
          # release_branch: 'custom-release-branch' # default: main
          git_email:
```

## Credits

This plugin is heavily inspired by [release-drafter](https://github.com/release-drafter/release-drafter) and [shipjs](https://github.com/algolia/shipjs). Thanks for the great work! Compared to the mentioned tools `ready-release-go` is not requiring a npm package and can be used with any kind of programming language, changelog tool and commit style.
