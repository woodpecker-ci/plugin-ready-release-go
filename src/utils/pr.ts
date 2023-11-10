import { PullRequest } from "../forges/forge";

export function getCheckboxValueFromString(description: string, label: string) {
  return (
    description.match(new RegExp(`-\\s\\[(.)\\]\\s${label}`, "i"))?.[1] === "x"
  );
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
    "Mark this version as a release candidate (RC)"
  );

  return {
    nextVersionShouldBeRC,
  };
}
