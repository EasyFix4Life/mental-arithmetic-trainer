# Mental Arithmetic 1.1.0 verification — 24 October 2026

This release implements complete instructions for **all six** operation/digit-length combinations, random worked examples, vertical addition, the preserved 12 × 12 and 18 × 18 examples, and unchanged ten-question automatic Practice with round timing. Original requirements and acceptance fixtures remain unchanged. Later owner requests and method/layout corrections have separate provenance records.

## Completed shared checks

| Check | Actual result |
| --- | --- |
| TypeScript typecheck | Passed |
| Production Vite build | Passed |
| Shared unit suite | **196 passed**, 8 files |
| Browser suite | **54 passed**, desktop Chrome and mobile-width Chromium, no skipped/flaky/failed cases |
| Native Electron source suite | **5 passed** with final frontend |
| Native Swift core via macOS SwiftPM/XCTest | **34 passed**, exact app core/test files; explicitly not an iOS UI test |
| Native UIKit integrations, iPhone iOS 26.5 | **8 passed** |
| Native UIKit integrations, iPhone iOS 27 beta | **8 passed** |
| Native UIKit integrations, iPad iPadOS 26.5 | **7 passed, 1 skipped**; programmatic orientation request not applied |

The 54 browser cases include all six Learn categories, random ranges and immediate unordered-repeat avoidance, complete instructions and final answers, stacked/place-aligned addition, exact fixed traces, digit highlights, carry progression, keyboard accessibility, independent Learn/Practice state, all six Practice configurations, score/manual restart, atomic invalid/overlong input and exact min/max/raw-mean timing. Deterministic rendered traces cover **58 above 67 → 125** and **123 × 456 → 56088**. Addition final-result geometry compares the right edge of the operands with the wider result.

## Arithmetic and input evidence

The original supplied test vectors cover **23 arithmetic cases and 11 input cases**. The shared suite also checks every ordered single-digit arithmetic pair, all **8,100 two-digit multiplication pairs**, all **8,100 two-digit addition pairs**, **9,000 three-digit addition cases** and **2,100 boundary/deterministically varied three-digit multiplication cases**. It verifies products/sums, group values, result fragments, carry destinations and complete final answers.

The original two-digit engine still drives both fixed and random two-digit multiplication. Three-digit groups preserve the owner's stated order, including first/last, last/first and middle/middle in the central group. Generated examples are computed applications of the described method, not individually owner-authored scripts.

Practice still waits for the expected number of ASCII decimal digits and submits exactly once per accepted transaction. Wrong answers advance immediately. Invalid characters reject the whole transaction, leading zeros remain significant, an overlong paste is wrong once with no spill, and a later separate physical key belongs to the next active problem under the isolated provisional policy. Ten unordered pairs are unique, including reversed duplicates, with bounded generation. The average uses all ten full-resolution durations, including incorrect answers, before truncating the display to tenths.

## Native package evidence

- **macOS:** the delivered final DMG app is launched from a separate read-only mount and tested with the five Electron cases. Signature, disk-image/ZIP integrity and exact bundled frontend/shell bytes are verified. See [MACOS_TEST_RESULTS.md](MACOS_TEST_RESULTS.md) and `macos-artifacts.json`.
- **Windows 10/11 x64:** actual setup EXE/ZIP integrity, PE architecture, NSIS payload and frontend/shell equality are verified. Native install/run/uninstall and display scaling are untested on this Mac. See [WINDOWS_TEST_RESULTS.md](WINDOWS_TEST_RESULTS.md) and `windows-artifacts.json`.
- **Android:** the signed release APK passes **eight native Android 17 acceptance cases**, archive CRC, signature, alignment and exact bundled frontend checks. The actual numeric keyboard, native input events, rotation, all six Practice configurations, timing, six lessons and wider addition-result alignment are covered. See [ANDROID_TEST_RESULTS.md](ANDROID_TEST_RESULTS.md).
- **iPhone/iPad:** Xcode beta builds both the native app and the unsigned generic device archive. Portable core tests and actual UIKit simulator integrations are recorded separately. The Xcode test service fails before XCTest/XCUITest execution; it is not reported as passing. Simulator/rotation/keyboard limits and the actual screenshot review are in [IOS_TEST_RESULTS.md](IOS_TEST_RESULTS.md). The Release archive is checked for absence of the DEBUG review harness and test bundles.

## Evidence and limits

Machine-readable shared results are `unit-results.json` and `browser-results.json`. Platform reports contain exact executable/archive hashes and device/toolchain details. The earlier Practice baseline remains in `PRACTICE_V1_TEST_RESULTS.md`; historical 1.0.2 documentation is preserved in `historical-1.0.2/` and Android's separate historical folder.

Browser mobile emulation is not Safari or a physical phone test. Android's declared minimum is API 26; actual native runtime verification is API 37. iOS's declared minimum is 17.0; actual simulator runtime checks are named in its report. The macOS build is ad-hoc signed, not notarized, and Windows is unsigned. iOS is unsigned until Apple Developer enrollment and a team identity are assigned. No physical iPhone/iPad test, App Store acceptance or store submission is claimed. The owner has authorized a new private GitHub repository upload; that is separate from website deployment and store publishing.
