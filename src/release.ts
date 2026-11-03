import packageInfo from '../package.json';

/** Application identity and release download filenames share the configured published version. */
export const APP_VERSION = packageInfo.version;
export const DOWNLOAD_VERSION = packageInfo.config.downloadVersion;
export const RELEASES_URL = 'https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases';

export function releaseFile(suffix: string): string {
  return `${RELEASES_URL}/download/v${DOWNLOAD_VERSION}/Mental-Arithmetic-${DOWNLOAD_VERSION}-${suffix}`;
}
