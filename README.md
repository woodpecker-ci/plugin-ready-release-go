# Ready release go :rocket:

This plugin can be executed on every push to your release branch (e.g. default branch) and will create a new release pull-request with an updated changelog as preparation for the next release. After merging the "release"-pull-request, a new release / tag will be created for you.

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
      forge_token:
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
};
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
  - [x] Github
  - [x] Gitea
  - [x] Forgejo _(via gitea api client)_
  - [ ] Gitlab
  - [ ] Bitbucket

## Credits

This plugin is inspired by [release-please](https://github.com/googleapis/release-please), [release-drafter](https://github.com/release-drafter/release-drafter) and [shipjs](https://github.com/algolia/shipjs). Thanks for the great work! Compared to the mentioned tools `ready-release-go` is not requiring a npm package and can be used with any kind of programming language, changelog tool and commit style.
