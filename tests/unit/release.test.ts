import { describe, expect, it } from 'vitest';
import packageInfo from '../../package.json';
import { APP_VERSION, releaseFile } from '../../src/release';

describe('release identity', () => {
  it('identifies the installed build using the application package version', () => {
    expect(APP_VERSION).toBe(packageInfo.version);
  });

  it.each([
    'Android.apk', 'macOS-arm64.dmg', 'macOS-arm64.zip', 'Windows-x64-Setup.exe',
    'Windows-x64.zip', 'iOS-unsigned-archive.zip', 'iOS-Simulator-app.zip',
    'all-platforms-source.zip', 'Web.zip',
  ])('keeps the release tag and filename aligned for %s', (suffix) => {
    expect(releaseFile(suffix)).toBe(
      `https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v${packageInfo.version}/Mental-Arithmetic-${packageInfo.version}-${suffix}`,
    );
  });
});
