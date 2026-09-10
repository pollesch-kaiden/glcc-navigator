export function parseVersionNumbers(version: string | null | undefined): number[] {
  if (!version) {
    return [];
  }

  const matches = version.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

export function isRemoteVersionNewer(
  currentVersion: string | null | undefined,
  nextVersion: string | null | undefined
): boolean {
  if (!nextVersion || !nextVersion.trim()) {
    return false;
  }

  if (!currentVersion || !currentVersion.trim()) {
    return true;
  }

  const currentTokens = parseVersionNumbers(currentVersion);
  const nextTokens = parseVersionNumbers(nextVersion);

  if (currentTokens.length === 0 || nextTokens.length === 0) {
    return nextVersion.trim() !== currentVersion.trim();
  }

  const maxLength = Math.max(currentTokens.length, nextTokens.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentValue = currentTokens[index] ?? 0;
    const nextValue = nextTokens[index] ?? 0;

    if (nextValue !== currentValue) {
      return nextValue > currentValue;
    }
  }

  return false;
}

export function hasValidRemoteManifest(
  manifest: { version?: string; poiFile?: string; pathFile?: string } | null | undefined
): manifest is { version: string; poiFile?: string; pathFile?: string } {
  if (!manifest || typeof manifest !== 'object') {
    return false;
  }

  if (typeof manifest.version !== 'string' || !manifest.version.trim()) {
    return false;
  }

  if (manifest.poiFile !== undefined && (typeof manifest.poiFile !== 'string' || !manifest.poiFile.trim())) {
    return false;
  }

  if (manifest.pathFile !== undefined && (typeof manifest.pathFile !== 'string' || !manifest.pathFile.trim())) {
    return false;
  }

  return true;
}
