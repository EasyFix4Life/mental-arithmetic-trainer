# Android 1.1.4 — Inside/Outside correction

The owner reported that the two-digit multiplication walkthrough selected the Outside digit pair under Inside and the Inside pair under Outside. Version **1.1.4**, Android version code **10104**, applies the corrected shared frontend to the signed offline APK.

For **82 × 76**:

- **Inside:** highlight `left:1` and `right:0`, calculate **2 × 7 = 14**.
- **Outside:** highlight `left:0` and `right:1`, calculate **8 × 6 = 48**, then combine **14 + 48 = 62**.
- Carry handling is unchanged and the final answer remains **6232**.

The native runner reproduces these exact unequal cross-products, asserts the highlighted digit references, calculation text, intermediate result, narration and final answer, and saves screenshots of both corrected stages. The unequal products also prevent the symmetric 12 × 12 and 18 × 18 examples from hiding a reversal.

## Actual release APK

- File: `Mental-Arithmetic-1.1.4-Android.apk`
- Bytes: **666,885**
- SHA-256: `82311c8fe23dc0628d568edc250025b6e7d46a50b8f4ee94e37080ddeb39b205`
- Application ID: `local.jeff.mentalarithmetic`
- Original signer SHA-256: `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`
- Minimum API 26; target/compile API 37; universal APK with no bundled native libraries.
- No Android permissions, including Internet access; release is not debuggable.

The build, release lint, ZIP CRC, alignment and signing verification passed. Every one of the **four** bundled frontend files matches the corrected production `dist/` byte for byte. All **20** native source/build inputs in the healthy build mirror match the editable source. Existing Android container/security/storage behavior is unchanged.

## Update and runtime checks

A fresh anonymous download of the published **1.1.3** APK was installed on the task-owned Android 17/API 37 arm64 emulator. Its SHA-256 matched the public release evidence. A DOM-storage marker was seeded, verified after a cold relaunch, and preserved after installing the signed 1.1.4 APK as an update. Application UID **10235** was retained; application data was not cleared.

The running updated APK displayed **Version 1.1.4**, Learn contained only the four supported categories, Addition offered only **2**, and Multiplication offered **1, 2, 3**.

The actual non-debuggable signed 1.1.4 release APK passed **10 native acceptance cases, 0 failed**, covering:

1. Offline origin, presentation and resource/security settings.
2. Prominent help button label, touch target and actual native tap.
3. Four random lesson categories and complete instructional scripts.
4. Vertical two-digit addition, carries and final answer.
5. Corrected Inside/Outside highlighted digits and arithmetic for **82 × 76**.
6. Unequal **98 × 87** cross-products, multi-digit carries, and confirmed **18 × 18** final answer.
7. Three-digit multiplication group order and whole-value carries.
8. Actual native numeric keyboard input, visibility and rotation preserving an active answer/timer.
9. Ten accepted answers, incorrect-answer feedback and exact maximum/minimum/average timing.
10. Four available Practice configurations, unique problems, scoring and unsupported addition-length reset.

Android System WebView was **145.0.7632.218**. A first acceptance attempt was blocked by a **System UI isn't responding** emulator dialog: Android rejected the native tap because the System UI window owned focus. One restart of the owned emulator preserved the upgraded APK, UID and data; all ten cases then passed. No application failure was observed, and the failed environment attempt is retained separately rather than counted as a passing run.

## Evidence

- `inside-outside-android-build.txt` and `inside-outside-android-lint-results.*`
- `inside-outside-android-build-location.json`
- `inside-outside-android-artifacts.json` and `inside-outside-android-package-verification.txt`
- `inside-outside-android-source-comparison.json`
- `inside-outside-android-runtime-environment.json`
- `inside-outside-android-runtime/public113-baseline-seeded/`
- `inside-outside-android-runtime/public113-cold-relaunch/`
- `inside-outside-android-runtime/upgraded114-catalog/`
- `inside-outside-android-runtime/upgraded114-acceptance/android-runtime-results.json`
- `inside-outside-android-runtime/upgraded114-acceptance/android-inside-82-times-76.png`
- `inside-outside-android-runtime/upgraded114-acceptance/android-outside-82-times-76.png`
- `inside-outside-android-runtime/first-attempt-system-ui-anr/`

These checks execute on an owned disposable emulator. They do not establish testing on a physical Android phone, every older OS release, or every manufacturer keyboard. No personal device was modified. Public 1.1.4 download checks performed after publication are recorded outside the frozen source snapshot.
