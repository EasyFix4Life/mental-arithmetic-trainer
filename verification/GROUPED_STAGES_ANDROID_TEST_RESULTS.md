# Android grouped-stage preview2 — 3 November 2026

**1.2.0-preview.2**, Android code **10201**, is a local review build. The public release remains **1.1.4**; no preview APK or source was published externally. Preview1 artifacts and their `visual-review-*` evidence remain preserved.

## Grouped Learn interface

Two-digit multiplication now presents **[First → [Inside + Outside] → Last] = [Final Answer: ####]**. The outer outline contains First, the middle subgroup and Last. Inside and Outside share the middle outline and are separated by a plus sign. Two flow arrows retain the instructional sequence. The equals sign and complete **Final Answer** button sit outside the outer group. Final Answer remains an interactive result view.

All four stage controls are bold **700** and use the same declared **2px** stroke on every side. Selection changes the underline rather than the weight or stroke. Colors match the generated design tokens:

| Stage | Text and stroke | Lighter fill |
| --- | --- | --- |
| First | `#126C70` | `#E2F1EF` |
| Inside / Outside | `#755093` | `#EEE5F4` |
| Last | `#885A15` | `#F6ECD8` |

The native ivory chrome and the Practice implementation remain as in preview1. Arithmetic, corrected Inside/Outside digit selections, carrying, random-example generation, auto-submission and timing behavior are retained.

## Final signed APK

- File: `Mental-Arithmetic-1.2.0-preview.2-Android.apk`
- Bytes: **670,069**
- SHA-256: `af8f837cdc60b0f43b3cc965bce825ecb73a685ef65e0f10bc63a2d960065142`
- Application ID: `local.jeff.mentalarithmetic`
- Version name/code: **1.2.0-preview.2 / 10201**
- Original certificate SHA-256: `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`
- API 26 minimum; API 37 compile/target; non-debuggable universal APK with no Android permissions or native ABI libraries.

Build and release lint passed. APK CRC, ZIP alignment and modern signing checks passed. All **four** packaged frontend files match the final production build byte for byte: `index-1mzuqHi8.css`, `index-DxIERzM0.js`, HTML and headers. All **21** Android source/build inputs in the build mirror match the editable source.

The Android verifier now reads the explicit `package.json` `config.androidVersionCode` when present, retaining the semantic-version formula as a fallback for older versions. This prevents successive previews sharing the same numeric version code.

## Update and data preservation

The preserved final preview1 APK, SHA-256 `bcf168b0e9cf286be99e807d7fc2c95e104925614c3b26030cc330b489e8b198`, was installed on the task-owned emulator. A DOM-storage marker was seeded and verified after a cold relaunch. Preview2 installed as an update using the original application identity and signing certificate.

UID **10236** and the marker were retained; app data was not cleared. The installed UI displayed **Version 1.2.0-preview.2**, with Addition only **2** and Multiplication **1, 2, 3**.

## Actual native acceptance

The actual signed release APK passed **13 cases, 0 failed**, on Android **17 / API 37**, arm64, with System WebView **145.0.7632.218**. All twelve preview1 acceptance areas remain covered, plus the new grouped-stage case:

1. Offline origin/security, ivory backing, scholarly text stack and dark native bar icons.
2. Prominent help text, actual native tap and touch-target bounds.
3. Four complete random Learn categories and excluded addition lengths.
4. Vertical two-digit addition, carries and final result.
5. Correct Inside/Outside pairings for **82 × 76**, with final answer **6232**.
6. Unequal **98 × 87** trace and confirmed **18 × 18** carry demonstration.
7. Group membership, accessible middle label, plus, arrows, equals, correct button order, capitalized **Final Answer: 8526**, separate result box, exact stage colors/fills, all-bold type and equal strokes before/after selection. Actual portrait **411 × 838** and landscape **862 × 359** layouts assert horizontal fit, touch targets, contained outlines and non-overlapping buttons.
8. Stage-highlight colors/refs, equal highlight weight, Arial math stack and explicit carry routes including whole carry **13**.
9. Three-digit multiplication group order, carries and final answer.
10. Actual native numeric keyboard, partial-answer/timer preservation through rotation, and the **862 × 122** landscape keyboard viewport with incorrect **×** feedback visible. Question, answer field, live timer and previous feedback are all visible and pairwise separate. One deliberate wrong answer plus nine correct native submissions scores **9 / 10**.
11. Black incorrect cue and numeric time, black border and white answer field; no Learn palette in visible Practice content.
12. Exact score, immediate progression and min/max/average timing statistics over all ten accepted answers.
13. Four Practice configurations, forty correct accepted answers, unique pairs, four **10 / 10** results, and addition-length reset.

Portrait Learn and Practice screenshots were manually inspected. The grouped portrait screenshot is the primary static Learn review image. Landscape bounds were checked in the actual native WebView; its still Learn screenshot catches the tail of the native OS rotation transition. The owned emulator was stopped and its process exited. No personal Android device was modified.

## Recorded development events

The first emulator host process was killed before boot; one retry booted successfully. The app had not started, and the cause was not established. The iOS agents confirmed their simulators were off at that first launch, so it is not attributed to iOS runtime activity.

The first acceptance run passed the new grouped-stage case, then exposed a test-fixture collision: two adjacent tests selected **98 × 87**, so the correctly preserved repeat-avoidance rule advanced the second example to **98 × 88**. The carry test now switches operation before selecting its seeded example. Only test setup changed; no product arithmetic or random-generation behavior was changed. The complete rerun passed all thirteen cases. Initial raw evidence is retained under `development-fixture-collision/`.

## Evidence and limits

- `grouped-stages-android-build.txt`, `grouped-stages-android-lint-results.*`
- `grouped-stages-android-artifacts.json`, `grouped-stages-android-package-verification.txt`
- `grouped-stages-android-source-comparison.json`
- `grouped-stages-android-runtime-environment.json`
- `grouped-stages-android-runtime/preview1-baseline-seeded/`
- `grouped-stages-android-runtime/preview1-cold-relaunch/`
- `grouped-stages-android-runtime/preview2-updated-catalog/`
- `grouped-stages-android-runtime/preview2-native-acceptance/android-runtime-results.json`
- `grouped-stages-android-runtime/preview2-native-acceptance/android-grouped-stages-portrait.png`
- `grouped-stages-android-runtime/preview2-native-acceptance/android-practice-monochrome-incorrect.png`
- `grouped-stages-android-runtime/preview2-native-acceptance/android-practice-landscape-keyboard-feedback.png`

This is emulator/runtime and package verification, not physical-phone testing or proof for every eligible older Android release, manufacturer keyboard or accessibility setting. Narrower widths and 200% text scaling are covered separately by the shared browser checks. No store upload, repository publication, website deployment or production settings change occurred.
