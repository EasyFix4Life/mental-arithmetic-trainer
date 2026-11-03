# Mental Arithmetic 1.2.0

This production release publishes the interface and options approved from preview 4 on 3 November 2026. Version/download metadata is updated consistently across Web, macOS, Windows, Android and native iPhone/iPad development packages. The approved teaching methods and app behavior are preserved.

## Current options

| Mode | Available configurations | Default |
| --- | --- | --- |
| Learn | **1-digit × 1-digit**, **2-digit × 2-digit** | 1-digit multiplication |
| Practice | **2-digit + 2-digit**, **1-digit × 1-digit**, **2-digit × 2-digit** | 2-digit addition |

Addition is Practice-only. Three-digit multiplication is absent from both modes. Historical methods and fixtures remain in source, separate from app availability. The two-digit lesson retains the owner-confirmed Inside/Outside digit pairings and the visual arrangement **[First & [Inside + Outside] & Last] = [Final Answer]**. Light ivory, scholarly typography, equal colored Learn boxes, pair/carry diagrams and monochrome timed Practice are preserved. Each Practice round has ten unique problems, expected-digit automatic submission, immediate advancement, a score out of ten and minimum/maximum/average timing. New rounds start manually.

## Website and downloads

- [Open whoami.school](https://whoami.school/)
- [Website app downloads](https://whoami.school/#app-downloads)
- [GitHub 1.2.0 release](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/tag/v1.2.0)

| Platform/content | Release file |
| --- | --- |
| macOS Apple silicon, macOS13+ | [DMG](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-macOS-arm64.dmg) · [App ZIP](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-macOS-arm64.zip) |
| Windows10/11 x64 | [Installer](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-Windows-x64-Setup.exe) · [App ZIP](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-Windows-x64.zip) |
| Android8+ | [Signed APK](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-Android.apk) |
| iPhone/iPad development files | [Simulator app](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-iOS-Simulator-app.zip) · [Unsigned device archive](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-iOS-unsigned-archive.zip) · [Preparation files](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-iOS-submission-files.zip) |
| Web production files | [Web ZIP](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-Web.zip) |
| Complete editable source | [All-platform source ZIP](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-all-platforms-source.zip) |
| Integrity | [SHA-256 checksums](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-SHA256.txt) |

Android uses **version1.2.0/code10204** with the original signing certificate, so it can update the approved preview4/code10203. The native Apple project uses **1.2.0/build10**, built with the requested Xcode beta. iOS/iPadOS minimum is17; the simulator archive runs on a Mac simulator. The unsigned device archive is **not an installable IPA**, and the preparation files are not an App Store listing/submission. Device distribution requires the owner's Apple development team/signing. Mac is ad hoc signed; Windows is unsigned. Extract a complete app ZIP before launching it, or use the normal DMG/installer.

## Verification and provenance

[RELEASE_1_2_0_RESULTS.md](verification/RELEASE_1_2_0_RESULTS.md) records current builds and acceptance evidence. Production packaging changes only version/download metadata and publication documentation relative to approved preview4 commit `2cd3f1e6f15c0709fe444ff9cf32585d41ac89e2`. Original requirements, all earlier preview/release files and historical evidence remain preserved. The existing Cloudflare Pages project builds main with `npm run build` into `dist`; no DNS, registrar or TLS change is required.

## Launch from source

```bash
npm ci
npm run dev
```

Open the printed localhost URL. For a production build, run `npm run build`, then `npm run preview`. Platform build instructions remain in [MACOS_APP.md](MACOS_APP.md), [WINDOWS_APP.md](WINDOWS_APP.md), [ANDROID_APP.md](ANDROID_APP.md) and [IOS_APP.md](IOS_APP.md).
