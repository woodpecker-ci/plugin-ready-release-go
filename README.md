# Ready release go :rocket:

This plugin can be executed on every push to your release branch (e.g. main) and will create a new release pull-request with all of your custom adjustments like an updated changelog as preparation for the next release. After you have merged the "release"-pull-request with all your desired changes, a new release / tag will be created for you.

## Roadmap

- [x] Automatically create release pull-request
- [x] Automatically update release pull-request
- [ ] Create a release / tag after "release"-pull-request got merged
- [ ] Support more forges: (Gitea, Gitlab, ...)

# Credits

This plugin is heavily inspired by [release-drafter](https://github.com/release-drafter/release-drafter) and [shipjs](https://github.com/algolia/shipjs). Thanks for the great work! Compared to the mentioned tools `ready-release-go` is not requiring a npm package and can be used with any kind of programming language, changelog tool and commit style.
