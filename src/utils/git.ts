export interface SimpleGit {
  addConfig(key: string, value: string): Promise<void>;
  getRemotes(verbose: boolean): Promise<any>;
  removeRemote(name: string): Promise<void>;
  addRemote(name: string, url: string): Promise<void>;
  fetch(args: string[]): Promise<void>;
  checkout(branch: string | string[]): Promise<void>;
  branch(args?: string[]): Promise<any>;
  pull(remote?: string, branch?: string): Promise<void>;
  tags(options: string[]): Promise<any>;
  log(options: any): Promise<any>;
  merge(args: string[]): Promise<void>;
  status(): Promise<{ isClean: () => boolean }>;
  add(files: string | string[]): Promise<void>;
  commit(message: string): Promise<void>;
  push(args: string[]): Promise<void>;
}

export function simpleGit(): SimpleGit {
  const runGitCommand = async (args: string[]): Promise<string> => {
    const process = Deno.run({
      cmd: ['git', ...args],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code } = await process.status();
    const rawOutput = await process.output();
    const rawError = await process.stderrOutput();

    if (code === 0) {
      return new TextDecoder().decode(rawOutput);
    } else {
      throw new Error(new TextDecoder().decode(rawError));
    }
  };

  return {
    addConfig: async (key: string, value: string) => {
      await runGitCommand(['config', key, value]);
    },
    getRemotes: async (verbose: boolean) => {
      const output = await runGitCommand(['remote', verbose ? '-v' : '']);
      return output.split('\n').map((line) => {
        const [name, url] = line.split('\t');
        return { name, refs: { fetch: url, push: url } };
      });
    },
    removeRemote: async (name: string) => {
      await runGitCommand(['remote', 'remove', name]);
    },
    addRemote: async (name: string, url: string) => {
      await runGitCommand(['remote', 'add', name, url]);
    },
    fetch: async (args: string[]) => {
      await runGitCommand(['fetch', ...args]);
    },
    checkout: async (branch: string | string[]) => {
      if (Array.isArray(branch)) {
        await runGitCommand(['checkout', ...branch]);
      } else {
        await runGitCommand(['checkout', branch]);
      }
    },
    branch: async (args: string[] = []) => {
      const output = await runGitCommand(['branch', ...args]);
      return {
        all: output.split('\n'),
        current: output
          .split('\n')
          .find((branch) => branch.startsWith('*'))
          ?.substring(2),
      };
    },
    pull: async (remote?: string, branch?: string) => {
      const args = ['pull'];
      if (remote) args.push(remote);
      if (branch) args.push(branch);
      await runGitCommand(args);
    },
    tags: async (options: string[]) => {
      const output = await runGitCommand(['tag', ...options]);
      return {
        all: output.split('\n'),
        latest: output.split('\n')[0],
      };
    },
    log: async (options: any) => {
      let args = ['log', '--pretty=format:%H%n%an%n%ae%n%B%n==END=='];
      if (typeof options === 'object') {
        if (options.from && options.to) {
          args.push(`${options.from}..${options.to}`);
        }
      } else if (typeof options === 'string') {
        args.push(options);
      }
      const output = await runGitCommand(args);
      const commits = output
        .split('==END==\n')
        .filter(Boolean)
        .map((commit) => {
          const [hash, authorName, authorEmail, ...messageLines] = commit.split('\n');
          return {
            hash,
            author_name: authorName,
            author_email: authorEmail,
            message: messageLines.join('\n').trim(),
          };
        });
      return {
        all: commits,
        total: commits.length,
        latest: commits[0],
      };
    },
    merge: async (args: string[]) => {
      await runGitCommand(['merge', ...args]);
    },
    status: async () => {
      const output = await runGitCommand(['status', '--porcelain']);
      return {
        isClean: () => output.trim() === '',
      };
    },
    add: async (files: string | string[]) => {
      if (Array.isArray(files)) {
        await runGitCommand(['add', ...files]);
      } else {
        await runGitCommand(['add', files]);
      }
    },
    commit: async (message: string) => {
      await runGitCommand(['commit', '-m', message]);
    },
    push: async (args: string[]) => {
      await runGitCommand(['push', ...args]);
    },
  };
}
