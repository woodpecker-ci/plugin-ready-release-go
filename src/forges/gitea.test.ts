import { describe, it, expect, vi } from 'vitest';
import { GiteaForge, formatGiteaError } from './gitea';

// gitea-js rejects with the fetch Response itself, the parsed JSON body in `error`.
function giteaResponse(status: number, statusText: string, url: string, message?: string) {
  return { ok: false, status, statusText, url, error: message ? { message } : null };
}

const releaseUrl = 'https://codeberg.org/api/v1/repos/owner/repo/releases';

describe('formatGiteaError', () => {
  it('includes status, url and forge message', () => {
    const err = formatGiteaError(
      'create release',
      giteaResponse(404, 'Not Found', releaseUrl, "The target couldn't be found."),
    );

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('create release');
    expect(err.message).toContain('404 Not Found');
    expect(err.message).toContain(releaseUrl);
    expect(err.message).toContain("The target couldn't be found.");
  });

  it.each([
    [401, 'forge_token'],
    [403, 'write:repository'],
    [404, 'disabled'],
    [409, 'already exists'],
  ])('adds a hint for status %i', (status, hint) => {
    const err = formatGiteaError('create release', giteaResponse(status, '', releaseUrl));
    expect(err.message).toContain('Hint:');
    expect(err.message).toContain(hint);
  });

  it('adds no hint for unknown status', () => {
    const err = formatGiteaError('create release', giteaResponse(500, 'Internal Server Error', releaseUrl));
    expect(err.message).not.toContain('Hint:');
  });

  it('keeps the message of a thrown Error (e.g. network failure)', () => {
    const cause = new TypeError('fetch failed');
    const err = formatGiteaError('create release', cause);
    expect(err.message).toContain('fetch failed');
    expect(err.cause).toBe(cause);
  });
});

describe('GiteaForge', () => {
  it('createRelease rejects with a descriptive error', async () => {
    const forge = new GiteaForge('https://codeberg.org', 'token', 'ci@example.com');
    forge.api.repos.repoCreateRelease = vi
      .fn()
      .mockRejectedValue(giteaResponse(404, 'Not Found', releaseUrl, "The target couldn't be found."));

    await expect(
      forge.createRelease({
        owner: 'owner',
        repo: 'repo',
        tag: 'v1.0.0',
        name: '1.0.0',
        description: '',
        target: 'main',
      }),
    ).rejects.toThrow(/404 Not Found.*releases/s);
  });

  it('non-ignored api errors show the forge message instead of a stream', async () => {
    const forge = new GiteaForge('https://codeberg.org', 'token', 'ci@example.com');

    await expect(
      forge.handleApiErrors(Promise.reject(giteaResponse(403, 'Forbidden', releaseUrl, 'token does not have scope'))),
    ).rejects.toThrow(/403 Forbidden.*token does not have scope/s);
  });
});

describe('GiteaForge.createRelease 404 diagnosis', () => {
  function forgeWith(repoGet: GiteaForge['api']['repos']['repoGet']) {
    const forge = new GiteaForge('https://codeberg.org', 'token', 'ci@example.com');
    forge.api.repos.repoCreateRelease = vi.fn().mockRejectedValue(giteaResponse(404, 'Not Found', releaseUrl));
    forge.api.repos.repoGet = repoGet;
    return forge;
  }
  const createRelease = (forge: GiteaForge) =>
    forge.createRelease({
      owner: 'owner',
      repo: 'repo',
      tag: 'v1.0.0',
      name: '1.0.0',
      description: '',
      target: 'main',
    });

  it('names the disabled Releases unit and where to enable it', async () => {
    const forge = forgeWith(vi.fn().mockResolvedValue({ data: { has_releases: false } }));

    await expect(createRelease(forge)).rejects.toThrow(
      /Releases unit is disabled.*https:\/\/codeberg\.org\/owner\/repo\/settings/s,
    );
  });

  it('falls back to the generic hint when releases are enabled', async () => {
    const forge = forgeWith(vi.fn().mockResolvedValue({ data: { has_releases: true } }));

    await expect(createRelease(forge)).rejects.toThrow(/404 Not Found.*Hint:/s);
  });

  it('falls back to the generic hint when the repository lookup fails', async () => {
    const forge = forgeWith(vi.fn().mockRejectedValue(giteaResponse(404, 'Not Found', 'x')));

    await expect(createRelease(forge)).rejects.toThrow(`404 Not Found (${releaseUrl})`);
  });

  it('does not look up the repository for other statuses', async () => {
    const repoGet = vi.fn();
    const forge = forgeWith(repoGet);
    forge.api.repos.repoCreateRelease = vi.fn().mockRejectedValue(giteaResponse(409, 'Conflict', releaseUrl));

    await expect(createRelease(forge)).rejects.toThrow(/409/);
    expect(repoGet).not.toHaveBeenCalled();
  });
});
