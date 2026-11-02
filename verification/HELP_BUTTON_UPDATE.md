# Prominent lesson-help button — 1.1.1

Requested on November 2, 2026: make the question-mark help control more prominent and put the exact phrase **“Click Here to Learn How!”** inside the button across macOS, Web, Android and iOS. The owner also explicitly requested the Windows version during the work; its shared interface and installer/app ZIP receive the same update.

## Implemented change

The Web/Electron/Android button combines a circled question mark with bold 20px text, a stronger sepia fill and border, and a minimum height of 64 CSS pixels. It sits beside the operands where space allows and fills a separate row on narrow screens. The native iPhone/iPad control uses the same phrase, a prominent circled-question icon, a highlighted sepia fill and a full-width target of at least 64 points. Its position above the operands keeps it visible without squeezing the numbers.

The existing `lesson-help` identifier, walkthrough action, keyboard activation, focus return and expanded/collapsed state are preserved. The visible phrase supplies the accessible name. Lesson arithmetic, digit selections, carries, random examples, automatic Practice submission, immediate advancement, timing statistics and manual round starts are unchanged.

## Verification

| Check | Result |
| --- | --- |
| TypeScript checking and Vite production build | Passed |
| Shared arithmetic/state unit tests | 196 passed |
| Desktop/mobile browser suite | 56 passed; no failures, skips or flaky cases |
| Responsive CTA geometry | All six lessons at 280, 320 and 390 CSS pixels; no overlap or horizontal overflow |
| Native iPhone iOS 26.5 integration | 8 passed; 131 assertions, including 42 CTA checks |
| Native iPadOS 26.5 integration | 7 passed, 1 existing rotation scenario skipped; 126 assertions |
| iOS unsigned device archive and Release simulator app | Passed; 1.1.1 build 2, title/icon present, DEBUG harness absent, ZIP CRC passed |
| macOS package and native checks | 5 passed against the final DMG app; signature, DMG/ZIP integrity, version and bundled frontend checks passed |
| Android release package and native checks | 9 passed on Android 17; signed APK, alignment, ZIP integrity and all bundled frontend bytes verified |
| Windows package checks | Passed: all 72 ZIP files match the installer payload; seven x64 executable/DLL headers and bundled frontend match; Windows runtime execution not performed |

The native iOS checks use the existing Debug-only UIKit control/delegate integration harness. They are not physical-device or external XCUITest results. The iPad rotation scenario remains skipped. External XCTest/XCUITest was not rerun for this presentation-only patch; the 1.1.0 report records the earlier local test-service startup issue. iOS is built with the requested Xcode beta and remains unsigned for device distribution. No App Store or Play Store submission is part of this change.

Current evidence uses the `verification/help-button-*` prefix. The earlier detailed platform reports and their generic screenshots are retained as the 1.1.0 baseline. New CTA previews include:

- `help-button-desktop-1280.png`
- `help-button-mobile-390.png`
- `help-button-ios/iphone26/07-prominent-learn-help.png`
- `help-button-ios/ipad26/07-prominent-learn-help.png`

## Deployment and release scope

The supplied WhoAmI.school handoff was read first as a dated deployment record. Current GitHub main was independently confirmed as `6286055e3d1179c1a6d82ece00775015e55e1047`, with only the existing deployment document added since the 1.1.0 application baseline. That document is preserved byte for byte. The runtime update was published as `4f7dfbe3ef47a9fa4d41883ecfd6d3c4b4290311` through the existing main branch. Cloudflare Pages reported a successful deployment (`2b01a2f2-5154-4091-b294-0212ddce7514`). The live website returns HTTP 200 with normal TLS validation, and its HTML, JavaScript and CSS match the local production build byte for byte. Live browser checks opened and closed the new button on all six lessons; a 390-pixel check found no horizontal overflow. The HTTPS www redirect remains 301 to the apex. Registrar, DNS, redirects, certificate-validation exceptions, TLS settings, hosting project and repository privacy are unchanged.

Version 1.1.1 packages use distinct filenames and preserve previous release files. Android retains its existing release certificate. The source archive and repository exclude signing keys, passwords, SDKs and build caches. Final live-domain and release-asset verification is recorded separately from the source snapshot to avoid self-referential commit/archive hashes.
