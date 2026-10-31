import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

describe('getConfig', () => {
  let repoDir: string;

  beforeEach(async () => {
    repoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ready-release-go-'));
    await fs.writeFile(path.join(repoDir, 'my-release.ts'), `export default { skipLabels: ['custom'] };\n`);
    vi.resetModules();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(repoDir, { recursive: true, force: true });
  });

  it.each(['my-release.ts', './my-release.ts'])('loads relative config file %s from the repository', async (file) => {
    vi.stubEnv('PLUGIN_CONFIG_FILE', file);
    const { getConfig } = await import('./config');

    const config = await getConfig(repoDir);

    expect(config.user.skipLabels).toEqual(['custom']);
  });

  it('loads absolute config file', async () => {
    vi.stubEnv('PLUGIN_CONFIG_FILE', path.join(repoDir, 'my-release.ts'));
    const { getConfig } = await import('./config');

    const config = await getConfig(os.tmpdir());

    expect(config.user.skipLabels).toEqual(['custom']);
  });
});
