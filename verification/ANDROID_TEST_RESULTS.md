# Android 1.1.0 verification — 24 October 2026

The delivered **Mental Arithmetic 1.1.0** APK passes **eight native Android acceptance cases, with zero failures**, on the disposable Android 17 / API 37 arm64 emulator. The release build, Android lint, archive CRC checks, metadata, signature, ZIP alignment and exact production-asset comparisons also pass. The tests ran against the actual signed, non-debuggable release application.

## Delivered artifact and platform

| Item | Verified value |
| --- | --- |
| APK | `Mental-Arithmetic-1.1.0-Android.apk` |
| Bytes | 664,576 |
| Application ID | `local.jeff.mentalarithmetic` |
| Version name / code | `1.1.0` / `10100` |
| Compile / target SDK | Android 17 / API 37 |
| Minimum declared SDK | Android 8.0 / API 26 |
| Android permissions | None, including no `INTERNET` permission |
| Native libraries | None; universal APK using the installed System WebView |
| Signing | Persistent project release key; same public certificate as 1.0.2 |
| Runtime device | Disposable `emulator-5556`, `sdk_gphone64_arm64` |
| Runtime OS | Android 17 / API 37 |
| WebView | `com.google.android.webview` 145.0.7632.218 |
| Screen | 1080 × 2400 pixels, 420 dpi |

SHA-256 of both the delivered APK and the release copy installed for testing:

```text
216e3fc745c76a3a575389f1ae66de5d4b584d0d7cf47c29ac3fccb5fbaadd31
```

The public signing-certificate SHA-256 remains `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`. Private signing material was reused locally and is not included in the APK, source tree or verification report.

## Package and build checks

`scripts/verify-android.mjs` verifies the actual top-level delivered APK. All **18 ZIP members** pass CRC checks. The compiled package identity, semantic version and derived Android version code, minimum/target SDK, launcher, non-debuggable flag and absence of permissions all match their expected values. The verifier checks duplicate/unsafe archive entries, the Dalvik header and required resources. Android SDK Build Tools 37.0.0 confirm a valid whole-APK v2 signature and ZIP alignment (`zipalign -c -P 16 -v 4`).

All **3 production frontend files** are byte-for-byte identical to `dist/`, including its final six-category lesson renderer. The package contains no bundled native libraries. The release build and instrumentation APK build succeeded; release lint reports **0 errors and 5 warnings**, retained in the lint reports. These warnings concern API-specific manifest/icon attributes and do not block the declared minimum SDK.

`android-artifacts.json` and `android-package-verification.txt` record static checks. Their static-verifier runtime flag is false because that script does not install or run the APK; the separate real Android execution below supplies runtime evidence.

## Actual Android acceptance run

The final command was:

```sh
adb -s emulator-5556 shell am instrument -w \
  local.jeff.mentalarithmetic.test/local.jeff.mentalarithmetic.AndroidTestRunner
```

| Case | Check | Result | Duration |
| --- | --- | --- | --- |
| 1 | offline release shell, presentation and browser security | Passed | 306 ms |
| 2 | all six random lesson categories with complete instructions and vertical addition | Passed | 18 ms |
| 3 | vertical addition instructions, carries and final answers | Passed | 275 ms |
| 4 | random two-digit trace, confirmed carries and final answer | Passed | 273 ms |
| 5 | three-digit multiplication groups and whole-value carries | Passed | 265 ms |
| 6 | native numeric keyboard, visible answer and rotation preservation | Passed | 2278 ms |
| 7 | ten accepted answers, wrong feedback and exact timing summary | Passed | 336 ms |
| 8 | all six operation and operand-length practice configurations | Passed | 103 ms |

The eight cases establish:

- The offline asset origin, blocked network/file/content access, sepia presentation, numeric input mode, bundled scripts/styles and manual round start.
- All **six** Learn categories in order, correct 1–9 / 10–99 / 100–999 ranges, four new random requests per category, immediate unordered-pair nonrepetition, complete instructions and a correct final answer in every category. Visible addition instruction operands have positive bounds, sit above/below and align by their right edges. Addition calculations use stacked terms.
- Controlled vertical addition traces **58 + 67 = 125** and **587 + 678 = 1265**, including all group sums, carry resolutions and vertically arranged final operands.
- The asymmetric random two-digit multiplication **98 × 87 = 8526**, required carry values 5 and 13, and the exact confirmed **18 × 18 = 324** trace. Final answer remains a separate item following Last.
- The owner-described three-digit multiplication example **123 × 456 = 56088**: raw groups **4, 13, 28, 27, 18**, central term order **1×6, 3×4, 2×5**, and right-to-left resolved groups **28, 30, 16, 5**. Three central products are stacked for addition. The example is generated from the described methodology; it is not presented as an individually confirmed owner demonstration.
- A real Android touchscreen start/focus, visible numeric software keyboard, answer/live timer fitting above that keyboard, and a full ten-answer **10 / 10** round sent through native Android key events. Rotation preserves the active problem, incomplete value and progressing timer. The test dismisses the keyboard before landscape rotation.
- Exact completed-set score **9 / 10**, **minimum 0.2 s**, **maximum 1.4 s**, **average 1.2 s**. The injected durations are 220 ms, 530 ms and eight × 1,499 ms, with the second answer intentionally wrong. The raw mean is 1,274.2 ms; incorrect-answer feedback is red. Summary data persists across Learn navigation and clears on manual restart.
- All six Practice configurations: **60 further accepted answers**, in-range operands, ten unique unordered pairs per round, **10 / 10** scores and timing summaries. Addition Practice operands are above/below and right-aligned.

The screenshots were visually inspected for the new vertical addition final answer, three-digit multiplication result and actual visible numeric keyboard. The keyboard screenshot has an answer bottom of 510.10 CSS px, live-timer bottom 497.45 CSS px and visible viewport bottom 526.10 CSS px. CSS requests Arial with platform sans-serif fallbacks; the APK does not redistribute a proprietary Arial font file.

## Evidence files

- `android-build.txt`, `android-build-location.json`, and `android-lint-results.*` record build/lint evidence.
- `android-runtime/android-runtime-results.json` records **8 passed / 0 failed** and case measurements.
- `android-runtime-environment.json` records the exact release/test APK hashes, equal signing certificates, emulator fingerprint and command.
- `android-instrumentation.txt` records the final runner output.
- `android-runtime/android-learn-addition.png`, `android-learn-three-digit.png`, `android-learn-confirmed.png`, `android-practice-keyboard.png`, `android-round-timing.png` and `android-setup.png` are native emulator screenshots. Arithmetic examples and scores are controlled test data, not the owner's performance.
- Historical version **1.0.2** reports and runtime evidence remain under `android-1.0.2/`; the old top-level APK is preserved.

The initial 1.1.0 run passed all eight cases. A geometry assertion was then strengthened to measure the visible instruction expression instead of the intentionally hidden main expression while a walkthrough is open; the separate instrumentation APK was rebuilt and all eight cases passed again. The delivered release APK bytes did not change for that test-only correction. A later production CSS correction right-aligned operand text with wider addition answers. The APK was rebuilt with that final CSS and all eight cases passed again, including a new assertion that measures the actual last operand digits against the four-digit answer text, rather than measuring only stretched layout boxes.

## Shared tests and limits

The shared frontend has **196 passing unit tests across eight files**, including every two-digit multiplication pair, every two-digit addition pair, all single-digit arithmetic pairs, 9,000 three-digit addition cases and 2,100 three-digit multiplication cases. Android's exact asset comparison ties this release to those production files. Separate browser, desktop and iOS reports document their own execution scope.

The APK was installed only on this disposable emulator; no physical phone was modified. Declared Android 8.0–17 eligibility and the successful Android 17 run do not prove behavior on every manufacturer, Android release, screen size or keyboard. No Google Play submission is part of this APK build.
