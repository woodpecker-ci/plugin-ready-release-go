import { execa } from "execa";
import c from "picocolors";

export class Git {
  async getCurrentBranch() {
    const { stdout } = await execa("git", [
      "rev-parse",
      "--abbrev-ref",
      "HEAD",
    ]);
    return stdout;
  }

  async hasChanges() {
    const { stdout } = await execa("git", ["status", "--porcelain"]);
    return stdout.length > 0;
  }

  async getRemoteUrl() {
    const { stdout } = await execa("git", [
      "config",
      "--get",
      "remote.origin.url",
    ]);
    return stdout;
  }

  async setup() {
    await execa("git", ["config", "pull.rebase", "false"]);
  }

  async setUser({
    username,
    email,
    password,
  }: {
    email: string;
    username: string;
    password: string;
  }) {
    console.log("# Setting git user:", c.green(username), c.green(email));
    await execa("git", ["config", "--local", "user.name", `"${username}"`]);
    await execa("git", ["config", "--local", "user.email", `"${email}"`]);

    const remoteUrl = await this.getRemoteUrl();
    console.log("# Setting git credentials for", c.green(remoteUrl));
    await execa("git", [
      "config",
      "--local",
      "credential.helper",
      "cache --timeout=60",
    ]);

    await execa("git", ["credential", "approve"], {
      input: `url=${remoteUrl}\nusername=${username}\npassword=${password}`,
    });
  }

  async fetch(branch: string) {
    console.log("# Fetching branch:", c.green(`origin/${branch}`));
    await execa("git", ["fetch", "origin", `${branch}`]);
  }

  async checkout(branch: string) {
    console.log("# Checking out branch:", c.green(branch));
    await execa("git", ["checkout", "-B", `${branch}`]);
  }

  async commitChanges({ message }: { message: string }) {
    if ((await this.hasChanges()) === false) {
      console.log("# No changes to commit");
      return;
    }

    console.log("# Adding all untracked & updated files to stage");
    await execa("git", ["add", "."]);

    console.log("# Creating new commit with message:", c.green(message));
    await execa("git", ["commit", "-m", `"${message}"`]);
  }

  async merge(branch: string) {
    const currentBranch = await this.getCurrentBranch();

    console.log(
      "# Merging",
      c.green(branch),
      "branch into",
      c.green(currentBranch)
    );
    const { stdout } = await execa("git", [
      "merge",
      `${branch}`,
      "-m",
      `"Merge ${branch}"`,
      "--no-edit",
    ]);
    console.log(stdout);
  }

  async push(branch: string) {
    console.log("# Pushing changes to:", c.green("origin/" + branch));
    await execa("git", ["push", "-u", "origin", `${branch}`]);
  }

  async pull(branch: string) {
    console.log("# Pulling changes from:", c.green("origin/" + branch));
    await execa("git", ["pull", "origin", `${branch}`]);
  }
}
