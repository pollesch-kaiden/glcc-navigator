import { describe, expect, it } from 'vitest';

import { hasValidRemoteManifest, isRemoteVersionNewer } from '../../src/utils/remoteContentVersion';

describe('remote content version checks', () => {
  it('accepts a newer remote version', () => {
    expect(isRemoteVersionNewer('2026-09-10-1', '2026-09-10-2')).toBe(true);
    expect(isRemoteVersionNewer('2026-09-09-5', '2026-09-10-1')).toBe(true);
  });

  it('ignores equal and older versions', () => {
    expect(isRemoteVersionNewer('2026-09-10-2', '2026-09-10-2')).toBe(false);
    expect(isRemoteVersionNewer('2026-09-10-2', '2026-09-10-1')).toBe(false);
  });

  it('treats a missing current version as a valid first install', () => {
    expect(isRemoteVersionNewer(null, '2026-09-10-1')).toBe(true);
  });

  it('validates expected manifest shape', () => {
    expect(
      hasValidRemoteManifest({
        version: '2026-09-10-1',
        poiFile: 'assets/map/glcc-pois-custom.json',
        pathFile: 'assets/map/glcc-paths-custom.json',
      })
    ).toBe(true);

    expect(hasValidRemoteManifest({ version: '' })).toBe(false);
    expect(hasValidRemoteManifest(null)).toBe(false);
  });
});
