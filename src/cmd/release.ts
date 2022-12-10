import { CommandContext } from "../utils/types";

export async function release({ config, exec }: CommandContext) {
  if (config.user.beforeRelease) {
    if ((await config.user.beforeRelease({ exec })) === false) {
      return;
    }
  }

  // TODO: create release

  if (config.user.afterRelease) {
    if ((await config.user.afterRelease({ exec })) === false) {
      return;
    }
  }
}
