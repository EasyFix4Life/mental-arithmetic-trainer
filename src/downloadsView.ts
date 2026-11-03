import { DOWNLOAD_VERSION, RELEASES_URL, releaseFile } from './release';

const sourceUrl = releaseFile('all-platforms-source.zip');

/** Native bundles use the same views but should never show the website's downloads. */
export function shouldShowWebsiteDownloads(location: { protocol: string; hostname: string }): boolean {
  return (location.protocol === 'http:' || location.protocol === 'https:')
    && location.hostname !== 'appassets.androidplatform.net';
}

/** Platform download labels and URLs follow the configured published release. */
export function renderDownloadsSection(): string {
  return `
    <section id="app-downloads" class="app-downloads" aria-labelledby="app-downloads-title" tabindex="-1">
      <h2 id="app-downloads-title">Download Apps</h2>
      <p class="downloads-intro">Choose your platform to download the current published version of Mental Arithmetic.</p>
      <div class="download-cards">
        <article class="download-card" aria-labelledby="download-macos-title">
          <h3 id="download-macos-title">macOS</h3>
          <p class="download-version">Version ${DOWNLOAD_VERSION}</p>
          <p>Apple silicon · macOS 13 or later</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseFile('macOS-arm64.dmg')}">Download macOS app ${DOWNLOAD_VERSION} (.dmg)</a>
            <a class="download-alternative" href="${releaseFile('macOS-arm64.zip')}">macOS app ${DOWNLOAD_VERSION} ZIP alternative</a>
          </div>
        </article>
        <article class="download-card" aria-labelledby="download-windows-title">
          <h3 id="download-windows-title">Windows</h3>
          <p class="download-version">Version ${DOWNLOAD_VERSION}</p>
          <p>Windows 10 and 11 · 64-bit (x64)</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseFile('Windows-x64-Setup.exe')}">Download Windows installer ${DOWNLOAD_VERSION} (.exe)</a>
            <a class="download-alternative" href="${releaseFile('Windows-x64.zip')}">Windows app ${DOWNLOAD_VERSION} ZIP alternative</a>
          </div>
        </article>
        <article class="download-card" aria-labelledby="download-android-title">
          <h3 id="download-android-title">Android</h3>
          <p class="download-version">Version ${DOWNLOAD_VERSION}</p>
          <p>Android 8 or later</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseFile('Android.apk')}">Download Android app ${DOWNLOAD_VERSION} (.apk)</a>
          </div>
        </article>
        <article class="download-card" aria-labelledby="download-ios-title">
          <h3 id="download-ios-title">iPhone &amp; iPad</h3>
          <p class="download-version">Version ${DOWNLOAD_VERSION}</p>
          <p class="download-status">Development files for Xcode on a Mac</p>
          <p>The device archive is unsigned and cannot be installed directly. An App Store download is not available yet.</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseFile('iOS-unsigned-archive.zip')}">Download iOS unsigned Xcode archive ${DOWNLOAD_VERSION}</a>
            <a class="download-alternative" href="${releaseFile('iOS-Simulator-app.zip')}">Download iOS simulator app ${DOWNLOAD_VERSION}</a>
            <a class="download-alternative" href="${sourceUrl}">Download iOS source ${DOWNLOAD_VERSION} (all-platforms ZIP)</a>
          </div>
        </article>
      </div>
      <div class="download-utilities" aria-label="More downloads">
        <a href="${releaseFile('Web.zip')}">Download Web files ${DOWNLOAD_VERSION} (.zip)</a>
        <a href="${sourceUrl}">Download all-platforms source ${DOWNLOAD_VERSION} (.zip)</a>
        <a href="${RELEASES_URL}">View all releases</a>
      </div>
    </section>
  `;
}
