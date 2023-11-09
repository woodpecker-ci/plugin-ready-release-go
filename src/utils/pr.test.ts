import { describe, it, expect } from "vitest";
import { getCheckboxValueFromString } from "./pr";

describe("pr", () => {
  it("should check for the correct checkbox value", () => {
    const prDescription = `
This PR was opened by the [ready-release-go](https://github.com/woodpecker-ci/plugin-ready-release-go) plugin.
When you're ready to do a release, you can merge this and a release and tag with version
will be created automatically.If you're not ready to do a release yet, that's fine,
whenever you add more changes to this PR will be updated.

## Options

- [x] Release this version as RC
- [ ] Some random option

## [0.8.0](https://github.com/woodpecker-ci/plugin-ready-release-go/releases/tag/0.8.0) - 2023-11-09

### 📈 Enhancement

- Add debug option [[#45](https://github.com/woodpecker-ci/plugin-ready-release-go/pull/45)]
`;

    const releaseThisVersionAsRC = getCheckboxValueFromString(
      prDescription,
      "release this version as rc"
    );
    expect(releaseThisVersionAsRC).toBe(true);

    const someRandomOption = getCheckboxValueFromString(
      prDescription,
      "Some random option"
    );
    expect(someRandomOption).toBe(false);
  });
});
