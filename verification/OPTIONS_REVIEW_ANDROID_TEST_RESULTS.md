# Android offering preview4 — 3 November 2026

**1.2.0-preview.4**, Android code **10203**, is a local review build. The public release remains **1.1.4**; no preview has been published or deployed. Earlier preview APKs and their evidence remain preserved.

## Current choices in the actual installed app

| Mode | Available choices |
| --- | --- |
| Learn | Single-digit multiplication; Two-digit multiplication |
| Practice | Two-digit addition; Single-digit multiplication; Two-digit multiplication |

Learn starts on **Single-digit multiplication**. No addition lesson or three-digit multiplication control appears in its catalog. Practice Addition offers only digit count **2**, and Practice Multiplication offers only **1, 2**. Mode switches and completed rounds retain these restrictions. Historical arithmetic engines and three-digit fixtures remain in source for preservation; they are not active menu offerings.

The existing two-digit addition Practice mode is preserved. A seeded **58 + 67** round verifies two two-digit operands arranged above/below with aligned columns. Input **12** stays on the same question; completing **125** submits automatically without Enter. All ten unique questions finish at **10 / 10** with the timing summary present.

## Final signed APK

- File: `Mental-Arithmetic-1.2.0-preview.4-Android.apk`
- Bytes: **670,065**
- SHA-256: `81f534a015fa6af728a9cd497e4a9684b98ef17ef2dca0ac9e698a5c063d311f`
- Application ID: `local.jeff.mentalarithmetic`
- Version name/code: **1.2.0-preview.4 / 10203**
- Original certificate SHA-256: `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`
- API 26 minimum; API 37 compile/target; non-debuggable universal APK with no Android permissions or bundled native ABI libraries.

Build and release lint passed. APK CRC, ZIP alignment and signature verification passed. All **four** packaged frontend files match the frozen shared production build byte for byte: `index-O0K00jXj.js`, unchanged `index-W3-ZKpMk.css`, HTML and headers. All **20** mirrored Android build, production and test files match editable source. Finder metadata and generated build files are excluded from that comparison. The actual native run used the same signed release APK hash shown above.

## Actual preview3-to-preview4 update

The preserved final preview3 APK, SHA-256 `b67c79c9137b6340e3d18ee883bdbf2b06ce0d4483e2c99b8bcfca08a41ea613`, was installed on the task-owned emulator. Its previous catalog contained four Learn lessons and Practice Multiplication digit counts **1, 2, 3**. A DOM-storage marker was seeded and verified after a cold relaunch.

The final preview4 APK installed as an update using the original application identity and certificate. App UID **10236** and the marker remained unchanged; app data was not cleared. The updated installed app displayed **Version 1.2.0-preview.4**, exactly the two Learn lessons above, initial Learn selection **multiplication-1**, Addition **2**, and Multiplication **1, 2**. This confirms the menus refreshed from the new package while existing local data was retained.

## Actual native acceptance

The signed release APK passed **13 cases, 0 failed**, on Android **17 / API 37**, arm64, with System WebView **145.0.7632.218**:

1. Offline origin/security, native ivory backing, scholarly text stack, dark native bar icons, fresh two-lesson catalog and initial single-digit multiplication selection.
2. Prominent help text, actual native tap and touch-target bounds for an offered multiplication lesson.
3. Exactly two multiplication Learn lessons, explicit absence of all addition and three-digit lesson controls, four random-example requests per category and complete correct walkthroughs.
4. Preserved two-digit addition Practice: **58 + 67 = 125**, vertical aligned operands, retained partial input, automatic submission, ten unique two-digit questions and **10 / 10**.
5. Correct Inside/Outside digit pairings for **82 × 76**, with final answer **6232**.
6. Unequal **98 × 87** trace and confirmed **18 × 18** carry demonstration.
7. Exactly two upright **&** header connectors, equal filled stage controls and separate **Final Answer: 8526**, with portrait/landscape group bounds and touch targets.
8. Stage-highlight colors and digit references, equal highlight weight, Arial math stack and unchanged explicit carry routes, including complete carry **13**.
9. Retained single-digit Learn base case: **8 × 7 = 56**, both digit references, instruction/final/back navigation and a new non-repeating single-digit example resetting to its first instruction.
10. Actual native numeric keyboard for two-digit multiplication, partial-answer/timer retention through rotation, and the **862 × 122** landscape keyboard viewport with incorrect **×** feedback. Question, answer field, live timer and previous feedback remain visible and pairwise separate. One deliberate wrong answer plus nine correct native submissions scores **9 / 10**.
11. Black incorrect cue and numeric time, black border and white answer field; no Learn stage palette in visible Practice content.
12. Exact score, immediate progression and minimum/maximum/average timings over all ten accepted answers.
13. Exactly three Practice configurations, thirty correct accepted answers, ten unique pairs in each round, three **10 / 10** results, preserved addition-length reset and no three-digit option after mode changes.

The former Learn-addition and three-digit Learn UI tests were replaced with meaningful coverage of the remaining offerings rather than silently removed: the dedicated addition Practice transaction/round and single-digit multiplication instruction/reset checks above.

The first final preview4 native run passed all thirteen cases. Fresh Learn/Practice catalog, single-digit walkthrough, retained grouped landscape header and short landscape keyboard screenshots were manually inspected. The AVD boot occurred after both iOS-owned simulators were verified shut down. The owned Android emulator was stopped and its host process exited after verification. No physical Android device was modified.

## Evidence and limits

- [Build output](options-review-android-build.txt) and [release lint](options-review-android-lint-results.txt).
- [APK metadata, signature and frontend comparison](options-review-android-artifacts.json) and [native source comparison](options-review-android-source-comparison.json).
- [Update/device/runtime summary](options-review-android-runtime-environment.json).
- [Updated installed options](options-review-android-runtime/preview4-updated-catalog/android-runtime-results.json).
- [All thirteen case results](options-review-android-runtime/preview4-native-acceptance/android-runtime-results.json).
- [Fresh Learn catalog](options-review-android-runtime/preview4-updated-catalog/android-installed-learn.png), [Addition setup](options-review-android-runtime/preview4-updated-catalog/android-installed-practice.png), and [Multiplication setup](options-review-android-runtime/preview4-updated-catalog/android-installed-practice-multiplication.png).
- [Single-digit walkthrough](options-review-android-runtime/preview4-native-acceptance/android-learn-single-digit.png), [retained grouped header](options-review-android-runtime/preview4-native-acceptance/android-grouped-stages-landscape.png), and [short landscape keyboard](options-review-android-runtime/preview4-native-acceptance/android-practice-landscape-keyboard-feedback.png).
- Baseline, cold-relaunch and updated-catalog raw data in `options-review-android-runtime/`.

This establishes emulator/runtime and package behavior for the tested environment. It does not claim physical-phone testing or coverage of every eligible Android release, manufacturer keyboard or accessibility setting. Narrower widths and 200% text scaling are covered separately by shared browser checks. No store upload, repository publication, website deployment or production setting change occurred.
