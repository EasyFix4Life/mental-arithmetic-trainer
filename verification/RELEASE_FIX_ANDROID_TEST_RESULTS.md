# Android 1.1.3 release identity and upgrade verification

The Android 1.1.3 APK shows **Version 1.1.3** in the interface, exposes four Learn categories, and limits Addition to two digits in Practice. Multiplication retains one-, two- and three-digit options. The built release passed all **nine native acceptance cases** on Android 17 / API 37 after an upgrade from the actual public 1.1.2 APK.

## Independent investigation of the reported Android discrepancy

Both previous APKs were downloaded anonymously from the public GitHub release URLs into a fresh temporary folder. Their bundled frontend files and ZIP integrity were inspected before installation. The actual downloaded files were installed on a disposable Android emulator, rather than substituting a local build or relying on the preceding release report.

| Actual installed artifact or upgrade | Learn catalog observed | Addition options observed | JavaScript executed |
| --- | --- | --- | --- |
| Public 1.1.1 baseline | Six categories, including one- and three-digit Addition | 1, 2, 3 | `index-Bycc7fRe.js` |
| Public 1.1.2 installed directly | Four categories; only two-digit Addition | 2 | `index-CIxu1Qxd.js` |
| Public 1.1.1 → public 1.1.2, retaining WebView data | Four categories; only two-digit Addition | 2 | `index-CIxu1Qxd.js` |

The public 1.1.2 upgrade also passed the complete nine-case native suite. Both public releases reported `WebSettings.LOAD_NO_CACHE` from the actual running WebView. The current native shell already sends `Cache-Control: no-store` on bundled asset responses.

**The reported discrepancy was not reproduced on this emulator.** These observations do not establish which version or WebView state was present on the reporting physical device, and they do not prove a cached-HTML cause. The raw public-artifact hashes, installed versions, option lists, screenshots and complete upgrade results are preserved in [release-fix-android-public112-diagnosis/summary.json](release-fix-android-public112-diagnosis/summary.json).

## Changes in 1.1.3

- The shared interface displays **Version 1.1.3**, allowing the running frontend to be identified directly.
- The native Android version is `1.1.3`, with version code `10103` and the existing application ID `local.jeff.mentalarithmetic`.
- On a change in installed application version, the native shell clears this application's WebView resource cache before loading its bundled document. The existing `LOAD_NO_CACHE` setting and `no-store` response header remain in place.
- The local URL allowlist, content-security policy, blocked network access and absence of native JavaScript bridges remain unchanged. No additional URL queries or external navigation were permitted.

The cache clear is an additional upgrade safeguard. It is not presented as a demonstrated fix for a reproduced caching defect.

## Package verification

| Property | Verified result |
| --- | --- |
| Delivered file | `Mental-Arithmetic-1.1.3-Android.apk` in the parent `outputs/` folder |
| Size | 666,885 bytes |
| SHA-256 | `2ec50d38dc2461ec561c3140aef2637af72703406fe4daf2147192faeefe6e1e` |
| Version / version code | `1.1.3` / `10103` |
| Minimum / target SDK | Android 8 / API 26; Android 17 / API 37 |
| Signature | Verified APK v2 signature; original persistent release certificate preserved |
| Certificate SHA-256 | `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc` |
| Permissions / native CPU libraries | None / none |
| APK CRC and alignment | All 19 members passed; no duplicate or unsafe member paths; alignment passed |
| Bundled production frontend | All four `dist/` files match byte-for-byte |
| Release lint | 0 errors, 5 nonblocking native-shell/toolchain warnings |

The production JavaScript is `index-BgzoV_mc.js`, SHA-256 `5ed19479a5719b5c4cd927bc839aa8798282cc1afb8071c0ea188f9f7b07194f`. The stylesheet is `index-Cr3j_8aO.css`, SHA-256 `3eda5cd9126e3897b32675871b32d99d61a532084d68699d7cbd829c56c069d4`. The web hosting `_headers` file is also copied as an unused APK asset; it is not an allowed native document URL.

Detailed package evidence is [release-fix-android-artifacts.json](release-fix-android-artifacts.json); underlying signature, manifest, CRC and alignment output is [release-fix-android-package-verification.txt](release-fix-android-package-verification.txt). Build and lint records use the same `release-fix-android` prefix.

## Native upgrade and acceptance

The actual public 1.1.2 APK was installed and given a test-only DOM-storage marker. A cold relaunch first confirmed that the marker had committed to storage. The built 1.1.3 APK was then installed as an update with the same signing certificate. The next launch showed **Version 1.1.3**, four Learn categories, Addition `[2]`, Multiplication `[1, 2, 3]`, and the preserved marker. This verifies that the upgrade safeguard did not delete that stored DOM data.

The initial marker attempt ended instrumentation before Chromium's delayed storage write completed. A single cold-relaunch control with time for the write resolved that test limitation; no application persistence feature was introduced. The marker exists only in this disposable test profile and is supplied by the separate instrumentation APK.

The complete native suite then passed:

1. Offline shell, sepia presentation, visible version, Addition default 2, browser restrictions and disabled WebView HTTP cache.
2. Prominent lesson-help button, accessible label, dimensions and real native tap.
3. Exactly four Learn categories, excluded Addition lengths absent, random examples and complete walkthroughs.
4. Vertical two-digit Addition, carries, column alignment and `58 + 67 = 125`.
5. Two-digit Multiplication, asymmetric random calculation and confirmed `18 × 18 = 324`.
6. Three-digit Multiplication groups, full-value carries and `123 × 456 = 56088`.
7. Native numeric keyboard, visible answer and timer, rotation preserving active input, and native key-event submission.
8. Ten submissions, immediate advancement, incorrect feedback, score and exact minimum/maximum/average timing.
9. All four Practice configurations, 40 accepted answers, unique problem pairs and normalizing Multiplication 1/3 to Addition 2.

The test device was a disposable arm64 Android 17 / API 37 emulator using Android System WebView `145.0.7632.218`. No physical device was modified.

- [Native acceptance results](release-fix-android-runtime/android-runtime-results.json) and [environment summary](release-fix-android-runtime-environment.json).
- [Actual 1.1.2 → built 1.1.3 upgrade](release-fix-android-upgrade112-to113/built113-upgraded-from112/android-runtime-results.json) and [storage-marker control](release-fix-android-upgrade112-to113/storage-marker-control.json).
- [Version 1.1.3 and two-digit Addition setup](release-fix-android-runtime/android-setup.png).
- [Four-category Learn screen](release-fix-android-upgrade112-to113/built113-upgraded-from112/android-installed-learn.png).
- [Native keyboard](release-fix-android-runtime/android-practice-keyboard.png) and [round timing](release-fix-android-runtime/android-round-timing.png).

This source snapshot records the local build and emulator checks before publication. The publication-stage check downloads the released 1.1.3 APK again and runs upgrades from public 1.1.1 and 1.1.2; its results are recorded separately outside the committed source snapshot. The emulator evidence and minimum SDK declaration do not establish runtime compatibility with every physical Android device or keyboard. No Google Play submission was performed.
