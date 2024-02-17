# Ready release go :rocket:

This plugin can be executed on every push to your release branch (e.g. main) and will create a new release pull-request with all of your custom adjustments like an updated changelog as preparation for the next release. After you have merged the "release"-pull-request with all your desired changes, a new release / tag will be created for you.

## Usage

### Woodpecker CI

Create a new workflow like `.woodpecker/release-helper.yml`:

```yaml
when:
  event: push
  branch: ${CI_REPO_DEFAULT_BRANCH}

steps:
  release-helper:
    image: woodpeckerci/plugin-ready-release-go:<version>
    settings:
      git_email: my-email@example.org
      github_token:
        from_secret: GITHUB_TOKEN
      # release_branch: 'custom-release-branch' # default: main
      # pull_request_branch_prefix: 'next-release/'
      # debug: true
```

## Configuring PR label categorization

The plugin automatically categorizes every pull-request based on it's labels.
The default labels are defined [here](https://github.com/woodpecker-ci/plugin-ready-release-go/blob/main/src/utils/config.ts#L25).
To change it, create a `release-config.ts` at the repository root and overwrite the `changeTypes` property:

```ts
export default {
  changeTypes: [{
    // CUSTOM LABEL CONFIG HERE
  }]
}
```

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

## Roadmap

- [x] Automatically create release pull-request
- [x] Automatically update release pull-request
- [x] Create a release / tag after "release"-pull-request got merged
- [x] Handle -rc versions
- [x] Support first release (no previous tags)
- [x] Support defining next version manually (can be done by changing the version on the release pull-request title / commit message)
- [ ] Support more forges:
  - [ ] Gitea
  - [ ] Gitlab

## Building

The easiest way is to run `make build` which will invoke

```sh
corepack enable
pnpm build
```

The output will go to `node_modules` where the respective binaries will be available in `.bin`.
The app startup is handled via `node_modules/.bin/tsx"` which invokes `src/run.ts`.

Startup within the app is handled via `src/startup.sh` which will invoke the command described above.

## Credits

This plugin is heavily inspired by [release-drafter](https://github.com/release-drafter/release-drafter) and [shipjs](https://github.com/algolia/shipjs). Thanks for the great work! Compared to the mentioned tools `ready-release-go` is not requiring a npm package and can be used with any kind of programming language, changelog tool and commit style.
