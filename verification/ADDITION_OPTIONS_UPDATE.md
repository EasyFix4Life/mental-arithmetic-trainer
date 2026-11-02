# Version 1.1.2 — available addition options

The owner requested removal of one-digit and three-digit addition from all app platforms and the website. Both Learn and Practice now offer exactly these four combinations:

| Operation | Digits per operand |
| --- | --- |
| Addition | 2 |
| Multiplication | 1, 2, 3 |

Practice and initial Learn selection default to two-digit addition. Switching from one- or three-digit multiplication to Addition selects two digits and removes unavailable choices. Learn retains the original relative order of the four remaining categories. The shared TypeScript controller and native Swift Practice engine reject unavailable Addition settings before changing a round; the arithmetic generators and original supplied fixtures remain intact.

The owner-described instruction method, vertical addition arrangement, confirmed 12×12 and 18×18 examples, random examples, prominent Learn button, automatic submission, immediate advancement, ten unique problems, final score and minimum/maximum/average round timing remain in place. Native shells remain offline and omit website download controls.

## Verification

| Check | Actual result |
| --- | --- |
| TypeScript and production Vite build | Passed |
| Shared unit tests | 203 passed |
| Desktop/mobile browser tests | 64 passed, 0 failed/skipped/flaky |
| Final macOS DMG runtime tests | 5 passed |
| macOS ZIP/DMG and signature | ZIP CRC passed; app.asar identical; deep/strict ad hoc signature valid; version 1.1.2 |
| Windows x64 packages | ZIP/installer/payload CRC passed; all 72 ZIP application files match installer payload; 7 executable/DLL headers verified x64 |
| Native Android 17 | 9 acceptance cases passed; release build/lint/package verification passed; original signing certificate retained |
| Native iOS/iPadOS | 35 Swift core tests passed; actual UIKit: 8 iPhone scenarios passed, 7 iPad scenarios passed and 1 rotation case explicitly skipped; final simulator/device builds passed using Xcode 27 beta |

The macOS DMG, Windows installer/ZIP and Android APK contain the same frozen production HTML/JS/CSS bytes. Packaged native macOS testing loads the final read-only DMG through app:// with no development server. Windows runtime execution on Windows 10/11 is not available on this Mac; package integrity and payload checks are distinct from native execution. iOS device archives remain unsigned development files, with no installable App Store listing. Xcode test targets compile, but the external XCTest runner still cannot connect to DTServiceHub on this host; the separate real-UIKit in-app acceptance runner supplies the recorded native scenario results.

The shared browser runner and native builds used verified identical temporary local copies after iCloud offloaded files in the original Documents workspace. The healthy browser mirror's 33 source/test file hashes are recorded in addition-options-runner.json; the production bundle stayed frozen throughout packaging. Only reproducible old packaging stages were removed; prior releases and supplied requirements were preserved.

## Evidence

New files use the addition-options- prefix. The unit, browser, macOS runtime/payload, Windows package, Android and iOS records sit beside this report. Prior baseline reports are historical and remain unchanged. The public release is v1.1.2, and the website download links select its matching packages. The original app/source artifacts remain available under earlier release tags.
