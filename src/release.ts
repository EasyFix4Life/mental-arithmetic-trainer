import packageInfo from '../package.json';

/** The installed build label and public assets always use the package version. */
export const APP_VERSION = packageInfo.version;
export const RELEASES_URL = 'https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases';

export function releaseFile(suffix: string): string {
  return `${RELEASES_URL}/download/v${APP_VERSION}/Mental-Arithmetic-${APP_VERSION}-${suffix}`;
}
