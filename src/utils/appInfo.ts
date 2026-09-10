/**
 * appInfo.ts
 * ─────────────────────────────────────────────────────────
 * Single source of truth for app metadata like version number.
 *
 * The actual version lives in app.json and is read at build
 * time by Expo. Reading it here via expo-constants means the
 * ONLY place you ever need to update the version number when
 * publishing a new release is app.json — every place in the
 * app that displays the version (Settings, bug reports, etc.)
 * automatically reflects the same value.
 *
 * Used by: SettingsScreen.tsx, and anywhere else the app
 * version needs to be displayed or included (e.g. bug reports,
 * support emails, future about screens).
 * ─────────────────────────────────────────────────────────
 */

import Constants from 'expo-constants';

export function getAppVersion(): string {
    return Constants.expoConfig?.version ?? 'Unknown';
}

export function getBuildNumber(): string | null {
    const ios = Constants.expoConfig?.ios?.buildNumber;
    const android = Constants.expoConfig?.android?.versionCode;
    return ios ?? (android ? String(android) : null);
}

export function getFullVersionString(): string {
    const version = getAppVersion();
    const build = getBuildNumber();
    return build ? `${version} (${build})` : version;
}