# Android 1.0.2 verification — 24 October 2026

The delivered signed APK passes **six native Android release acceptance cases on Android 17 / API 37**, with zero failures. Its archive CRCs, package metadata, ZIP alignment and whole-APK signature also pass verification. Every bundled production frontend file matches the already tested shared app byte-for-byte. This report distinguishes that actual Android execution from package checks and earlier shared application tests.

## Build target

| Item | Verified release value |
| --- | --- |
| Application | Mental Arithmetic 1.0.2 |
| Package identifier | `local.jeff.mentalarithmetic` |
| Android version code | `10002` |
| Compile and target SDK | API 37, Android 17 |
| Minimum SDK | API 26, Android 8.0 |
| Architecture | Universal APK; no bundled native libraries |
| Content | Offline HTML, JavaScript and CSS, identical to the existing production frontend |
| Runtime | Android System WebView supplied by the device |
| Android permissions | None, including no `INTERNET` permission |
| Distribution | Locally signed, installable APK; not a Google Play publication |

Android 17 is the current major Android release verified from Google's Android developer sources during this task. Target API 37 identifies the Android behavior model the application requests; it does not mean that every manufacturer/device combination has been tested.

## APK verification

The final deliverable is **663,336 bytes**, with SHA-256:

```text
07862394de295252377affcbbfb8a15bd6e294367f690aacb4c769f706b640fc
```

Executed successfully against the top-level delivered APK:

```sh
node scripts/verify-android.mjs /absolute/path/to/Mental-Arithmetic-1.0.2-Android.apk /absolute/path/to/android-sdk
```

The verifier uses Android SDK Build Tools **37.0.0** (`aapt2`, `zipalign` and `apksigner`), plus an archive CRC check. It reads package identity, version, launcher, minimum/target SDK, permission declarations and the debuggable flag from the compiled APK. The APK has **18 ZIP members**, all with passing CRC checks, and **three production frontend files**, each matching `dist/` byte-for-byte. It also passes Dalvik executable header, mandatory APK resources, duplicate/unsafe archive member, absence of ABI-specific native library, whole-APK signature and ZIP alignment checks.

`apksigner verify --verbose --print-certs` verifies the **APK Signature Scheme v2** signature. The signer is the project's persistent local release key, rather than the Android debug key. Its public certificate SHA-256 is `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`. `zipalign -c -P 16 -v 4` succeeds. There are no bundled native libraries to impose ABI or native page-size constraints.

`android-artifacts.json` and `android-package-verification.txt` record the results from the delivered APK. That verifier's `runtimeExecution.performed: false` is scoped to the static verifier itself; the separate actual Android execution is recorded below. The release copy used for installation and the top-level downloadable APK have identical SHA-256 hashes.

## Shared arithmetic, lesson and practice coverage

The existing shared version 1.0.2 has **178 passing unit tests and 50 passing browser tests** recorded in `unit-results.json` and `browser-results.json`. It also has five passing native Mac tests. Those tests cover the common application code, not the Android wrapper or a physical Android keyboard.

- All 8,100 ordered two-digit multiplication operand pairs produce correct generated traces, digit pairings, carries and final products.
- Learn displays random examples in all four lesson categories. The two-digit multiplication lesson retains the confirmed 12 × 12 and 18 × 18 examples and the four named stages, followed by a separate Final answer item. The first three authored lesson scripts remain pending rather than being invented.
- Practice covers addition and multiplication with one-, two- and three-digit operands, ten unique unordered problems per round, automatic expected-length submission, immediate advancement on correct and incorrect answers, score out of ten, and manual restart.
- Input tests retain Enter suppression, incomplete Backspace editing, leading-zero behavior, invalid-character rejection, paste transaction handling and the documented provisional extra-keystroke attribution.
- Live and previous-answer timers use completed tenths, with black/red previous-answer feedback. The completed set reports maximum, minimum and average durations across all ten accepted submissions, including incorrect answers. The average is calculated before display truncation. No persistent learner history is stored.

The Android APK must embed those exact tested production files. A separate byte comparison in the APK verifier establishes that relationship.

## Mobile layout and keyboard audit

The shared input has `inputmode="numeric"`, disables autocomplete/capitalization/spellcheck, and submits automatically without Enter. The viewport requests `interactive-widget=resizes-content`; the practice view also observes visual-viewport resize/scroll events and places the answer and live timer inside its visible height. Previous-answer and bottom-right positions use safe-area offsets. The Android container applies system-bar, cutout and IME insets before laying out the WebView.

The Android native test verifies a visible software keyboard after real touchscreen taps, checks the native input connection's numeric class (`inputType = 2`), and verifies the answer and live timer remain above the visible keyboard. At the captured portrait size, the visual viewport ends at **526.10 CSS px**, the answer ends at **510.10 CSS px**, and the live timer ends at **497.45 CSS px**. The native screenshot was visually inspected: keypad, problem, answer field and live timer are all visible without clipping. The CSS requests Arial with platform sans-serif fallbacks; it does not bundle a proprietary Arial font file.

Existing mobile browser checks use Chromium with an iPhone 13 touch/viewport profile; the native Android checks add actual Android System WebView and IME evidence. The shared practice view has a 240 CSS-pixel minimum height. The native rotation test dismisses the keyboard before rotating, checks state preservation in landscape and returns to portrait; unusually short landscape keyboard viewports were not established by this run.

## Android runtime evidence

The delivered release APK and a separate dependency-free instrumentation test APK were installed on the newly created **disposable Android 17 / API 37 arm64 emulator**, serial `emulator-5556`. Both packages have the same verified release signing certificate. The application remains a **non-debuggable release build**: tests use Android's instrumentation APIs and the actual Activity's WebView, without adding a JavaScript bridge, debug port, test hook or network service to the application.

| Runtime item | Actual value |
| --- | --- |
| Android release/API | 17 / 37 |
| Emulator image | Google APIs, `system-images;android-37.0;google_apis;arm64-v8a`, revision 8 |
| Device model | `sdk_gphone64_arm64` |
| CPU ABI | `arm64-v8a` |
| Screen | 1080 × 2400 pixels, 420 dpi |
| WebView provider | `com.google.android.webview` |
| WebView version | `145.0.7632.218` |
| Test result | **6 passed, 0 failed** |

The executed command was:

```sh
adb -s emulator-5556 shell am instrument -w \
  local.jeff.mentalarithmetic.test/local.jeff.mentalarithmetic.AndroidTestRunner
```

The six passing cases cover:

1. **Offline release shell and presentation.** Loads its bundled HTTPS origin, confirms network loads and file/content access are blocked, sepia background, numeric input mode, same-origin bundled scripts/styles and manual start.
2. **Random lessons.** Opens all four lesson categories in the supplied order and requests four new random pairs per category, checking ranges and nonrepetition. The unprovided scripts remain pending.
3. **Two-digit multiplication instructions.** Exercises a controlled random 98 × 87 trace, including both carry routes and final product 8,526. The confirmed 18 × 18 trace visits intermediate results 1, 8, 16, 64, 22 and 3, then its separate final answer 324 after Last.
4. **Native input, keyboard, layout and rotation.** Real native taps start practice and focus the answer. The numeric Android software keyboard is visible and the answer/live timer fit above it. Real Android key events complete a ten-answer round for 10 / 10. Rotating preserves the same active problem, incomplete input and progressing timer. This verifies native key-event routing; it does not claim a manual tap on every software keypad digit.
5. **Exact completed-set timing.** Drives ten accepted submissions through the real renderer/controller, with one intentionally wrong answer. The wrong previous-answer time is red. Injected durations of 220 ms, 530 ms and eight × 1,499 ms yield score 9 / 10, minimum 0.2 s, maximum 1.4 s and average 1.2 s. The raw mean is 1,274.2 ms. The summary persists across Learn navigation.
6. **All six practice configurations.** Completes 60 further accepted answers across addition/multiplication and one-/two-/three-digit settings, checking operand ranges, unordered-pair uniqueness, immediate advancement, ten-problem scoring, manual restart and timing summary presence.

`android-runtime/android-runtime-results.json` records the six results and measurements. `android-runtime-environment.json` records the exact tested release/test APK hashes, equal certificate digests and emulator fingerprint. `android-instrumentation.txt` records the final runner output. `android-runtime/android-setup.png`, `android-learn-confirmed.png`, `android-practice-keyboard.png` and `android-round-timing.png` are native emulator screenshots. Scores and worked examples in these screenshots are **controlled test data, not the owner's performance**.

The first test run passed five cases but exposed an incorrect assertion in the sixth test: it checked a score child's `hidden` property instead of visibility through the hidden setup ancestor. The test was corrected to check that ancestor, rebuilt and rerun. All six final cases pass. No application code or APK bytes changed for this correction.

Read-only `adb devices -l` inspection before creating the emulator found no attached devices. The APK was installed only on this disposable emulator; no physical phone was modified.

## Boundaries

No Google Play submission, website deployment, repository creation, DNS change or device security setting change is part of this build. The minimum SDK declaration is a compatibility target; it is not runtime evidence for every Android release from 8.0 through 17. The device must provide a working, updated Android System WebView.
