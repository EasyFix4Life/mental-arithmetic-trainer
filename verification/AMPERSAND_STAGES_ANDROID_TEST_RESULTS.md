# Android ampersand-stage preview3 — 3 November 2026

**1.2.0-preview.3**, Android code **10202**, is a local review build. The public release remains **1.1.4**. Preview1 and preview2 artifacts and evidence remain preserved; this preview has not been published or deployed.

## Requested Learn correction

The two header connectors are now literal, upright **&** characters:

**[First & [Inside + Outside] & Last] = [Final Answer: ####]**

The original grouped layout, lighter stage fills, equal bold text, equal strokes and separate Final Answer control remain. Only the two header connectors changed. Digit-pair diagrams, carry-route arrows, arithmetic, random examples and Practice behavior are retained.

The native header test verifies exactly two literal ampersands, no directional arrows in the header group, and no rotation on either connector. These checks run in both portrait **411 × 838** and landscape **862 × 359** CSS viewports. It also checks group membership, the Inside-plus-Outside subgroup, equals/result separation, stage order, touch targets, contained outlines, non-overlapping buttons and the unchanged colors, fills, weight and strokes before and after selection. The two actual native screenshots were manually inspected; the landscape capture now waits for the OS rotation compositor to settle.

## Final signed APK

- File: `Mental-Arithmetic-1.2.0-preview.3-Android.apk`
- Bytes: **670,065**
- SHA-256: `b67c79c9137b6340e3d18ee883bdbf2b06ce0d4483e2c99b8bcfca08a41ea613`
- Application ID: `local.jeff.mentalarithmetic`
- Version name/code: **1.2.0-preview.3 / 10202**
- Original certificate SHA-256: `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`
- API 26 minimum; API 37 compile/target; non-debuggable universal APK with no Android permissions or bundled native ABI libraries.

Build and release lint passed. APK CRC, ZIP alignment and signature verification passed. All **four** packaged frontend files match the frozen production build byte for byte: `index-DElzVqT9.js`, `index-W3-ZKpMk.css`, HTML and headers. The mirror comparison records **21** matching Android-tree files, including Finder metadata; all build, production and test inputs match the editable source. Package verification and native execution used the same final APK hash shown above.

The independent cross-platform audit also verified this APK's four frontend files against the Web ZIP, macOS ZIP and mounted DMG, Windows ZIP and extracted installer payload, editable `dist`, and the frozen shared build. The temporary DMG mount was detached after inspection. Windows execution is not claimed.

## Actual update and data preservation

The preserved final preview2 APK, SHA-256 `af8f837cdc60b0f43b3cc965bce825ecb73a685ef65e0f10bc63a2d960065142`, was installed on the task-owned emulator. A DOM-storage marker was seeded and verified after a cold relaunch. The final signed preview3 APK then installed as an update using the original application identity and certificate.

App UID **10236** and the marker remained unchanged; app data was not cleared. The installed interface displayed **Version 1.2.0-preview.3**, Addition only **2**, and Multiplication **1, 2, 3**. This verifies the real preview2-to-preview3 update path, separately from the acceptance cases.

## Actual native acceptance

The signed release APK passed **13 cases, 0 failed**, on Android **17 / API 37**, arm64, with System WebView **145.0.7632.218**:

1. Offline origin/security, ivory backing, scholarly text stack and dark native bar icons.
2. Prominent help text, actual native tap and touch-target bounds.
3. Four complete random Learn categories and excluded addition lengths.
4. Vertical two-digit addition, carries and final result.
5. Correct Inside/Outside pairings for **82 × 76**, with final answer **6232**.
6. Unequal **98 × 87** trace and confirmed **18 × 18** carry demonstration.
7. The grouped header with **exactly two upright & characters**, equal filled stage controls and separate **Final Answer: 8526**, in portrait and landscape.
8. Stage-highlight colors and digit references, equal highlight weight, Arial math stack and explicit unchanged carry-route arrows, including whole carry **13**.
9. Three-digit multiplication group order, carries and final answer.
10. Actual native numeric keyboard, partial-answer/timer preservation through rotation, and the **862 × 122** landscape keyboard viewport with incorrect **×** feedback visible. Question, answer field, live timer and previous feedback are visible and pairwise separate. One deliberate wrong answer plus nine correct native submissions scores **9 / 10**.
11. Black incorrect cue and numeric time, black border and white answer field; no Learn stage palette in visible Practice content.
12. Exact score, immediate progression and minimum/maximum/average timings over all ten accepted answers.
13. Four Practice configurations, forty correct accepted answers, unique pairs, four **10 / 10** results, and addition-length reset.

Native Learn portrait/landscape and Practice wrong-feedback portrait/landscape screenshots were manually inspected. The AVD boot occurred after the iOS owner's two simulators were verified shut down. All native tests passed on the first preview3 run. The owned Android emulator was stopped and its host process exited after verification. No physical Android device was modified.

## Evidence and limits

- [Build output](ampersand-stages-android-build.txt) and [release lint](ampersand-stages-android-lint-results.txt).
- [APK metadata/signature/frontend comparison](ampersand-stages-android-artifacts.json) and [source comparison](ampersand-stages-android-source-comparison.json).
- [Update/device/runtime summary](ampersand-stages-android-runtime-environment.json).
- [All thirteen case results](ampersand-stages-android-runtime/preview3-native-acceptance/android-runtime-results.json).
- [Learn portrait](ampersand-stages-android-runtime/preview3-native-acceptance/android-grouped-stages-portrait.png) and [Learn landscape](ampersand-stages-android-runtime/preview3-native-acceptance/android-grouped-stages-landscape.png).
- [Practice wrong feedback](ampersand-stages-android-runtime/preview3-native-acceptance/android-practice-monochrome-incorrect.png) and [short landscape keyboard](ampersand-stages-android-runtime/preview3-native-acceptance/android-practice-landscape-keyboard-feedback.png).
- Baseline, cold-relaunch and updated-catalog raw data in `ampersand-stages-android-runtime/`.
- [Independent cross-platform package comparison](ampersand-stages-cross-platform-packages.json).

This establishes emulator/runtime and package behavior for the tested environment. It does not claim physical-phone testing or coverage of every eligible Android release, manufacturer keyboard or accessibility setting. Narrower widths and 200% text scaling are covered separately by the shared browser checks. No store upload, repository publication, website deployment or production settings change occurred.
