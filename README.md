# plugin-ready-release-go :rocket:

[![Build status](https://ci.woodpecker-ci.org/api/badges/woodpecker-ci/plugin-ready-release-go/status.svg)](https://ci.woodpecker-ci.org/woodpecker-ci/plugin-ready-release-go)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/woodpeckerci/plugin-ready-release-go?label=DockerHub%20latest%20version&sort=semver)](https://hub.docker.com/r/woodpeckerci/plugin-ready-release-go/tags)

Woodpecker plugin that can be executed on every push to your release branch (e.g. default branch) and will create a new release pull-request with an updated changelog as preparation for the next release. After merging the "release"-pull-request, a new release / tag will be created for you.

## Workflow

1. Setup ready-release-go on your repository by adding a config file and a workflow file
1. On every push to your default branch a pull-request will be created and updated
1. You can review the pull-request and merge it when you are ready
1. The plugin will create a new release

## Internal workflow

- get latest release => tag
- get all commits since commit of last tag
- get all prs of those commits (if they have a pr associated)
- get all labels of those prs
- get next version based on labels of PRs
- get changelog based on labels of PRs

## Build

Build the Docker image with the following command:

```sh
docker build -f Dockerfile -t woodpeckerci/plugin-ready-release-go:next .
```

## Roadmap

- [x] Automatically create release pull-request
- [x] Automatically update release pull-request
- [x] Create a release / tag after "release"-pull-request got merged
- [x] Handle -rc versions
- [x] Support first release (no previous tags)
- [x] Support defining next version manually (can be done by changing the version on the release pull-request title / commit message)
- [ ] Support more forges:
  - [x] Github
  - [x] Gitea
  - [x] Forgejo _(via gitea api client)_
  - [ ] Gitlab
  - [ ] Bitbucket

## Credits

This plugin is inspired by [release-please](https://github.com/googleapis/release-please), [release-drafter](https://github.com/release-drafter/release-drafter) and [shipjs](https://github.com/algolia/shipjs). Thanks for the great work! Compared to the mentioned tools `ready-release-go` is not requiring a npm package and can be used with any kind of programming language, changelog tool and commit style.
