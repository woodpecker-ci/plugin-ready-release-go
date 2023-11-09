import { Forge, PullRequest } from "../forges/forge";
import { Config } from "./config";

export async function getOptionsFromPullRequest(forge: Forge, config: Config) {
  if (!config.ci.repoOwner || !config.ci.repoName) {
    throw new Error("Missing repoOwner or repoName");
  }

  const pr = await forge.getPullRequest({
    owner: config.ci.repoOwner,
    repo: config.ci.repoName,
    sourceBranch: `next-release/${config.ci.releaseBranch}`,
    targetBranch: config.ci.releaseBranch,
  });

  const nextVersionShouldBeRC = pr
    ? getCheckboxValueFromString(pr.description, "Release this version as RC")
    : false;

  return {
    nextVersionShouldBeRC,
  };
}

export function getCheckboxValueFromString(description: string, label: string) {
  return description.match(new RegExp(`-\s\[(.)\]\s${label}`))?.[1] === "x";
}

export function getReleaseOptions(releasePullRequest?: PullRequest): {
  nextVersionShouldBeRC: boolean;
} {
  if (!releasePullRequest) {
    return {
      nextVersionShouldBeRC: false,
    };
  }

  const nextVersionShouldBeRC = getCheckboxValueFromString(
    releasePullRequest.description,
    "Release this version as RC"
  );

  return {
    nextVersionShouldBeRC,
  };
}
