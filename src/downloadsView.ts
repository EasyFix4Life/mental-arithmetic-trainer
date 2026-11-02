const releaseBase = 'https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.1.1/';
const sourceUrl = `${releaseBase}Mental-Arithmetic-1.1.1-all-platforms-source.zip`;

/** Native bundles use the same views but should never show the website's downloads. */
export function shouldShowWebsiteDownloads(location: { protocol: string; hostname: string }): boolean {
  return (location.protocol === 'http:' || location.protocol === 'https:')
    && location.hostname !== 'appassets.androidplatform.net';
}

/** Fixed release URLs keep each platform paired with the tested 1.1.1 download. */
export function renderDownloadsSection(): string {
  return `
    <section id="app-downloads" class="app-downloads" aria-labelledby="app-downloads-title" tabindex="-1">
      <h2 id="app-downloads-title">Download Apps</h2>
      <p class="downloads-intro">Choose your platform to use Mental Arithmetic on your device.</p>
      <div class="download-cards">
        <article class="download-card" aria-labelledby="download-macos-title">
          <h3 id="download-macos-title">macOS</h3>
          <p>Apple silicon · macOS 13 or later</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseBase}Mental-Arithmetic-1.1.1-macOS-arm64.dmg">Download macOS app (.dmg)</a>
            <a class="download-alternative" href="${releaseBase}Mental-Arithmetic-1.1.1-macOS-arm64.zip">macOS app ZIP alternative</a>
          </div>
        </article>
        <article class="download-card" aria-labelledby="download-windows-title">
          <h3 id="download-windows-title">Windows</h3>
          <p>Windows 10 and 11 · 64-bit (x64)</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseBase}Mental-Arithmetic-1.1.1-Windows-x64-Setup.exe">Download Windows installer (.exe)</a>
            <a class="download-alternative" href="${releaseBase}Mental-Arithmetic-1.1.1-Windows-x64.zip">Windows app ZIP alternative</a>
          </div>
        </article>
        <article class="download-card" aria-labelledby="download-android-title">
          <h3 id="download-android-title">Android</h3>
          <p>Android 8 or later</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseBase}Mental-Arithmetic-1.1.1-Android.apk">Download Android app (.apk)</a>
          </div>
        </article>
        <article class="download-card" aria-labelledby="download-ios-title">
          <h3 id="download-ios-title">iPhone &amp; iPad</h3>
          <p class="download-status">Development files for Xcode on a Mac</p>
          <p>The device archive is unsigned and cannot be installed directly. An App Store download is not available yet.</p>
          <div class="download-actions">
            <a class="download-button" href="${releaseBase}Mental-Arithmetic-1.1.1-iOS-unsigned-archive.zip">Download iOS unsigned Xcode archive</a>
            <a class="download-alternative" href="${releaseBase}Mental-Arithmetic-1.1.1-iOS-Simulator-app.zip">Download iOS simulator app</a>
            <a class="download-alternative" href="${sourceUrl}">Download iOS source (all-platforms ZIP)</a>
          </div>
        </article>
      </div>
      <div class="download-utilities" aria-label="More downloads">
        <a href="${releaseBase}Mental-Arithmetic-1.1.1-Web.zip">Download Web files (.zip)</a>
        <a href="${sourceUrl}">Download all-platforms source (.zip)</a>
        <a href="https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases">View all releases</a>
      </div>
    </section>
  `;
}
