# Android scholarly visual preview — 3 November 2026

**Version 1.2.0-preview.1**, Android code **10200**, is a local review build. It has not been published or added to website downloads. The public 1.1.4 release remains unchanged.

## Visual changes

The native launch theme, WebView backing and system-bar inset areas use the generated **#FAF7F0** paper token. Native error text and icon ink use **#000000**. The existing dark-on-light status/navigation icon behavior is retained. Native fallback text uses a serif typeface; the shared frontend requests Baskerville with scholarly serif fallbacks and Arial for mathematical numerals with available sans-serif fallbacks. No proprietary fonts are redistributed.

Learn uses the shared colors **First #2D6567**, **Inside/Outside #6C5483**, and **Last #7D5723**. All four stages retain the same declared 2px highlight border. At the emulator's density, that border computes to 1.90476 CSS pixels after device-pixel quantization; its weight is identical for every stage. Explicit carry routes show source, whole carry value and destination. Corrected Inside/Outside pairings, arithmetic, random examples and instructional order are preserved.

Practice uses black content and feedback, an ivory background and a white answer field. An incorrect previous-answer time keeps its separate numeric value and adds a black **×** and black border. The native operating-system keyboard retains its system theme; application content does not adopt its colors.

The final shared responsive rule reserves separate regions when a landscape keyboard leaves only **862 × 122 CSS pixels**: question at the left, previous feedback at the upper left, and the answer field/live timer at the bottom right. Actual native tests include the larger incorrect **×** feedback box and require all four bounds to be visible and pairwise separate.

## Final APK and package checks

- File: `Mental-Arithmetic-1.2.0-preview.1-Android.apk`
- Size: **669,409 bytes**
- SHA-256: `bcf168b0e9cf286be99e807d7fc2c95e104925614c3b26030cc330b489e8b198`
- Application ID: `local.jeff.mentalarithmetic`
- Version name/code: **1.2.0-preview.1 / 10200**
- Original signer SHA-256: `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`
- Minimum API **26**; target/compile API **37**, unchanged.
- No Android permissions, including Internet; non-debuggable release; no bundled native libraries.

Build and release lint passed. APK ZIP CRCs, alignment and signing passed. All **four** bundled frontend files match the final production build byte for byte, including `index-BGWIhUsi.css` and `index-BglQMeYT.js`. All **21** Android source/build inputs in the healthy build mirror match the editable source.

The pinned Gradle 9.4.1 distribution was restored into the task's temporary toolchain after the previous temporary copy lost a JAR. Its SHA-256 matched the wrapper's pinned `2ab2958f2a1e51120c326cad6f385153bb11ee93b3c216c5fccebfdfbb7ec6cb`. Existing private signing files were downloaded locally from FileProvider storage and reused; no signing identity or application security policy changed.

## Direct public 1.1.4 update

A fresh anonymous public 1.1.4 APK download matched SHA-256 `82311c8fe23dc0628d568edc250025b6e7d46a50b8f4ee94e37080ddeb39b205`. After discarding only the superseded local development preview on the task-owned disposable emulator, the public 1.1.4 baseline was installed. A DOM-storage marker was seeded and checked after a cold relaunch.

The **final** preview APK then installed directly over that baseline. Application UID **10236** and the marker were preserved. Application data was not cleared during the measured upgrade. The installed interface displayed **Version 1.2.0-preview.1**. Addition still offered only **2**, and Multiplication offered **1, 2, 3**.

## Actual native runtime acceptance

The actual signed, non-debuggable final APK passed **12 cases, 0 failed** on the owned Android **17 / API 37** arm64 emulator, using Android System WebView **145.0.7632.218**:

1. Offline origin/security settings, ivory native/container background, dark system-bar icons and requested scholarly font stack.
2. Prominent help label, a 64px-high touch target and an actual native tap.
3. Four supported random Learn categories, complete instructions and excluded addition lengths.
4. Vertically aligned two-digit addition with carries and final answer.
5. Inside/Outside references and calculations for **82 × 76**, preserving final answer **6232**.
6. Unequal **98 × 87** cross-products, whole carries and confirmed **18 × 18** demonstration.
7. All four Learn stage colors, equal highlight weight, Arial math stack, and carry routes carrying **5** from Last to the middle, then **13** to First.
8. Three-digit multiplication groups, carries and final product.
9. Actual numeric keyboard, partial-answer/timer preservation through rotation, and full question/answer/live/previous-feedback bounds above the landscape keyboard. One deliberately incorrect native submission plus nine correct submissions scored **9 / 10**.
10. Black incorrect **×**, separate black numeric time, a declared 2px black border, white answer field, and absence of instructional colors from visible Practice content.
11. Ten accepted answers, incorrect feedback, exact score and minimum/maximum/average timing summary.
12. All four available Practice configurations, forty correct answers, unique pairs, four **10 / 10** scores and unsupported addition-length reset.

Final Learn, portrait Practice and landscape-keyboard screenshots were manually inspected. The task-owned emulator was stopped afterward and its process exited. No personal Android device was modified.

## Development findings retained

An initial threshold expected a computed border width of at least exactly 2 CSS pixels. Android's device-pixel rounding returned 1.90476; the test now verifies the declared 2px token with a tolerance of one device pixel. This required no product change.

Manual review then identified a real overlap between a three-digit question and the answer field with the landscape keyboard open. That initial layout is explicitly recorded as a superseded development failure in `visual-review-android-initial-layout-development.json`, with screenshots under `visual-review-android-runtime/development-before-short-landscape-fix/`. The final shared CSS fixes the overlap, and stronger actual native checks cover all four bounds with incorrect feedback visible. The old provisional APK hash is not the accepted final artifact.

## Evidence and limits

- `visual-review-android-build.txt`, `visual-review-android-build-location.json`, `visual-review-android-lint-results.*`
- `visual-review-android-artifacts.json`, `visual-review-android-package-verification.txt`
- `visual-review-android-source-comparison.json`
- `visual-review-android-runtime-environment.json`
- `visual-review-android-upgrade-run.txt`
- `visual-review-android-runtime/public114-baseline-seeded/`
- `visual-review-android-runtime/public114-cold-relaunch/`
- `visual-review-android-runtime/upgraded-preview-catalog/`
- `visual-review-android-runtime/upgraded-preview-acceptance/android-runtime-results.json`
- `visual-review-android-runtime/upgraded-preview-acceptance/android-learn-first.png`
- `visual-review-android-runtime/upgraded-preview-acceptance/android-learn-carry-routes.png`
- `visual-review-android-runtime/upgraded-preview-acceptance/android-practice-monochrome-incorrect.png`
- `visual-review-android-runtime/upgraded-preview-acceptance/android-practice-landscape-keyboard-feedback.png`

These are emulator and package checks. They do not establish physical-phone testing or testing every eligible older Android version, manufacturer keyboard or accessibility setting. No website deployment, GitHub release upload, app-store submission or production change was performed for this preview.
