# Mental Arithmetic for Android

## Stable version 1.2.0

Version **1.2.0**, Android code **10204**, contains the approved preview4 offerings:

- **Learn:** Single-digit multiplication and Two-digit multiplication; initial selection is single-digit multiplication.
- **Practice:** Two-digit addition, Single-digit multiplication and Two-digit multiplication; initial selection is two-digit addition.

No addition lesson or three-digit multiplication choice appears in the active interface. Two-digit addition Practice retains vertically aligned two-digit operands and ten unique questions. The lessons, corrected Inside/Outside pairings, upright **&** header connectors, carry routes, random examples, automatic answer submission and minimum/maximum/average timings match the approved preview.

- Download the APK and open it in **Files** on your Android device to install it. [Android 1.2.0 APK](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.2.0/Mental-Arithmetic-1.2.0-Android.apk)
- Verification: [RELEASE_120_ANDROID_TEST_RESULTS.md](verification/RELEASE_120_ANDROID_TEST_RESULTS.md).
- Application ID: **local.jeff.mentalarithmetic**, with the original signing identity.
- Supported minimum: **Android 8.0 / API 26**; compile/target API **37**. The universal APK uses the device's installed System WebView.

Code **10204** is higher than preview4's **10203**, so the stable package can install as an update. Build the current stable checkout using the prerequisites and private signing files documented below:

```text
npm ci
npm run build:android -- --tests
npm run verify:android -- release/Mental-Arithmetic-1.2.0-Android.apk
```

All sections below are preserved historical release/preview records. Their version numbers, public-status statements and build commands describe those earlier snapshots; use this stable section for version 1.2.0.


## Local offering review — 1.2.0-preview.4

The current local preview offers exactly these choices:

- **Learn:** Single-digit multiplication and Two-digit multiplication. Learn starts on single-digit multiplication; addition lessons and three-digit multiplication are absent from the active catalog.
- **Practice:** Two-digit addition, Single-digit multiplication and Two-digit multiplication. Addition retains two two-digit operands and ten unique questions per manually started round. Three-digit multiplication is absent from the digit selector.

This revision changes availability rather than the retained arithmetic and teaching procedures. The corrected Inside/Outside pairings, two upright **&** header connectors, grouped stage controls, carry arrows, random examples, automatic submission and round timing remain. Historical three-digit engine fixtures and earlier evidence remain available in source.

- Local APK: [Mental-Arithmetic-1.2.0-preview.4-Android.apk](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.2.0-preview.4-Android.apk).
- Verification: [OPTIONS_REVIEW_ANDROID_TEST_RESULTS.md](verification/OPTIONS_REVIEW_ANDROID_TEST_RESULTS.md).
- Version name/code: **1.2.0-preview.4 / 10203**, using the original app identity and signing key.

This preview is for local review. It has not been published or added to website downloads; **1.1.4 remains the public release**. Earlier sections below document preserved historical builds. Build this preview4 checkout using the prerequisites and private signing files described below:

```text
npm ci
npm run build:android -- --tests
npm run verify:android -- release/Mental-Arithmetic-1.2.0-preview.4-Android.apk
```


## Local literal-ampersand review — 1.2.0-preview.3

This local revision changes only the two connectors in the named-stage header to the literal **&** character:

**[First & [Inside + Outside] & Last] = [Final Answer: ####]**

Both ampersands remain upright in portrait and landscape. The middle plus sign, equals sign, separate complete Final Answer control, colors, fills, bold text and equal strokes remain as in preview2. Carry-route arrows and digit-pair connections retain their existing appearance and meaning. Arithmetic and Practice are unchanged.

- Local APK: [Mental-Arithmetic-1.2.0-preview.3-Android.apk](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.2.0-preview.3-Android.apk).
- Verification: [AMPERSAND_STAGES_ANDROID_TEST_RESULTS.md](verification/AMPERSAND_STAGES_ANDROID_TEST_RESULTS.md).
- Version name/code: **1.2.0-preview.3 / 10202**, using the original app identity and signing key.

Preview2 and preview1 artifacts and evidence remain preserved. This preview has not been deployed or published; **1.1.4 remains the public release**. Build this current checkout with the same prerequisites and private signing files documented below:

```text
npm ci
npm run build:android -- --tests
npm run verify:android -- release/Mental-Arithmetic-1.2.0-preview.3-Android.apk
```


## Local grouped-stage review preview — 1.2.0-preview.2

This local review revision presents two-digit multiplication stages as **[First → [Inside + Outside] → Last] = [Final Answer: ####]**. The outer group contains the four instructional stages; the inner group joins Inside and Outside with a visible plus sign. An equals sign follows the outer group, and the complete **Final Answer** stays in its own interactive box.

All four stage controls use bold type and equal **2px** colored borders. Their text and lighter fills follow the shared design tokens:

| Stage | Text and border | Lighter fill |
| --- | --- | --- |
| First | `#126C70` | `#E2F1EF` |
| Inside and Outside | `#755093` | `#EEE5F4` |
| Last | `#885A15` | `#F6ECD8` |

The revision retains the ivory native chrome, instructional arithmetic and corrected Inside/Outside pairings. Practice uses the existing monochrome preview design, timing and input behavior. This is a local build with the original application identity and signing key, version name **1.2.0-preview.2**, and version code **10201** configured in `package.json` and the Android project. It has not been published or added to website downloads; **1.1.4 remains the public release**.

- Local APK: [Mental-Arithmetic-1.2.0-preview.2-Android.apk](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.2.0-preview.2-Android.apk).
- Native review checks: [GROUPED_STAGES_ANDROID_TEST_RESULTS.md](verification/GROUPED_STAGES_ANDROID_TEST_RESULTS.md).
- The earlier preview1 APK and its verification below are preserved.

Build this source checkout with the same Android prerequisites and original private signing files described below:

```text
npm ci
npm run build:android -- --tests
npm run verify:android -- release/Mental-Arithmetic-1.2.0-preview.2-Android.apk
```


## Earlier local visual review preview — 1.2.0-preview.1

**1.2.0-preview.1** (Android version code **10200**) is a local review build of the scholarly visual design. It has not been published, uploaded to an app store, or added to production website downloads. **1.1.4 remains the public release**, and its download links below remain unchanged.

The preview uses the shared `design/visual-tokens.json` specification: light ivory **#FAF7F0**, scholarly serif text with platform fallbacks, and large Arial mathematical numerals with available sans-serif fallbacks. Native launch/inset/status/navigation areas match the ivory background with dark system icons. Learn uses **First #2D6567**, **Inside/Outside #6C5483**, and **Last #7D5723** with equal highlighting weight. Carry values name their source and destination. Practice uses black content and controls on ivory with a white answer field; an incorrect previous time is distinguished by a black **×** and border. The numeric time remains separate and black.

The arithmetic, instructional order, corrected Inside/Outside digit selections, random examples, two-digit-only addition choice, ten-question scoring, immediate submission/advance, keyboard behavior and timing statistics are preserved.

- Local preview APK: [Mental-Arithmetic-1.2.0-preview.1-Android.apk](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.2.0-preview.1-Android.apk).
- Preview verification: [VISUAL_REVIEW_ANDROID_TEST_RESULTS.md](verification/VISUAL_REVIEW_ANDROID_TEST_RESULTS.md).

To build this development preview from its source checkout, use:

```text
npm ci
npm run build:android -- --tests
npm run verify:android -- release/Mental-Arithmetic-1.2.0-preview.1-Android.apk
```

The Android prerequisites and private signing-key requirements below apply to both the preview and public baseline.

This preview uses the original application identity and signing key so it can update 1.1.4. Its higher version code means Android cannot install 1.1.4 back over it as a normal update; returning to 1.1.4 would require uninstalling the preview and losing this app's local data. The development checks use an owned disposable emulator rather than a personal phone.

## Public 1.1.4 baseline

**1.1.4 instructional correction:** **Inside** now selects the two inner digits, and **Outside** selects the two outer digits in every two-digit multiplication walkthrough. For **82 × 76**, Inside is **2 × 7 = 14** and Outside is **8 × 6 = 48**. See [the Android correction checks](verification/INSIDE_OUTSIDE_ANDROID_TEST_RESULTS.md).

The prominent **? Click Here to Learn How!** button introduced in 1.1.1 is preserved. [Its historical update report](verification/HELP_BUTTON_UPDATE.md) and the earlier verification records remain available.

Version **1.1.4** packages the same lessons, random examples and Practice timing as the macOS and Windows apps in a signed Android APK. It targets **Android 17 / API 37**, the current stable major Android release as of **24 October 2026**. Google announced Android 17 on 16 June 2026; its SDK setup guide specifies `compileSdk = 37` and `targetSdk = 37`. [Android 17 release announcement](https://android-developers.googleblog.com/2026/06/Android-17.html) · [Android 17 SDK setup](https://developer.android.com/about/versions/17/setup-sdk)

The minimum declared Android version is **Android 8.0 / API 26**. This is a universal APK with no bundled native libraries or CPU-specific runtime. It uses the device's installed Android System WebView; keep that component current. The minimum SDK setting describes installation eligibility, rather than proof of testing every older Android version or device.

The installed app works offline. It needs no account, Node.js, browser tab or local server, and requests no Android permissions, including Internet access.

### Installing version 1.1.4

- [Mental-Arithmetic-1.1.4-Android.apk](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.4-Android.apk) — the signed Android application.
- [Complete source code for all platforms](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.4-all-platforms-source.zip) — the shared frontend, Android project, desktop wrappers, build scripts, requirements, tests and documentation.

Exact APK path on the build Mac:

```text
/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.4-Android.apk
```

Copy or download the APK to the Android device, open it in **Files**, and follow Android's installation prompt for that file source. Open **Mental Arithmetic** from the launcher after installation. This is a direct APK delivery; it has not been submitted to Google Play. No Google Play account or publication is required to use the supplied file.

For an already connected development device with ADB authorized, installation from a computer is also possible:

```text
adb install -r Mental-Arithmetic-1.1.4-Android.apk
```

That command installs or updates this app only. No physical phone was connected during development; emulator and package-verification evidence is recorded separately below.

### Lessons, examples and Practice in version 1.1.4

The cache safeguard introduced in version 1.1.3 is preserved in 1.1.4. The app shows its release identity in the interface and clears only the app's WebView resource cache when the installed app version changes. The offline container already disables HTTP caching and sends `Cache-Control: no-store`; the version-change clear is an additional upgrade safeguard and preserves stored application/DOM data.

- The sepia background, large numerals and responsive interface use the same production frontend as the existing apps. The CSS requests Arial with system sans-serif fallbacks; Android uses an available fallback when Arial is not installed, and the APK does not redistribute proprietary font files. The native Android container respects the status bar, navigation area, display cutouts and on-screen keyboard.
- Learn lists four categories: two-digit addition, and one-, two- and three-digit multiplication. One- and three-digit addition are excluded from both Learn and Practice. Every available category has random examples, **New random example**, a complete interactive calculation/carry walkthrough and a separate final answer. Operand ranges are 1–9, 10–99 and 100–999. The next generated pair avoids the immediately preceding pair and its reversal.
- Two-digit multiplication follows **First → Inside → Outside → Last**, including the required carries, with **Final answer** following Last. The confirmed **12 × 12** and **18 × 18** demonstrations remain selectable. Version 1.1.4 corrects the two cross-product labels and digit selections: for **82 × 76**, **Inside is 2 × 7 = 14** (the inner digits), and **Outside is 8 × 6 = 48** (the outer digits). Inside and Outside are then combined as **14 + 48 = 62**. This correction applies to generated examples and the confirmed demonstrations; carry resolution and the final answer are unchanged. Three-digit multiplication follows the owner-described five-group sequence, including the central first×last, last×first, middle×middle order. Addition uses corresponding digit sums and right-to-left carry resolution. Addition operands and sums appear above/below in Learn, calculations, final answers and Practice.
- Practice offers two-digit addition and one-, two- or three-digit multiplication. Addition defaults to two digits; switching to Addition from another operand length restores two digits. Each round contains ten unique problems. An answer submits automatically when its length reaches the expected number of digits, and both correct and incorrect submissions advance immediately. Enter is not required.
- The live timer stays beside the answer field at the bottom right. The previous answer's completion time appears at the upper left, black for correct or red for incorrect.
- The completed set shows the score out of ten, **Maximum time**, **Minimum time** and **Average time**. All ten accepted answers count, including incorrect answers. The average uses the full-resolution durations, then the interface displays completed tenths of a second. Another round starts manually. Starting a new round clears the previous summary; the app does not save a history of completed sets.

The shared input policy and its explicitly provisional keyboard decisions remain documented in [README.md](./README.md). The Android package does not add an educational curriculum or change the arithmetic method.

## Build from source

Install the Node.js/npm versions described in [README.md](./README.md), **JDK 21**, and an Android SDK containing **Platform 37** and **Build Tools 37.0.0**. Set `JAVA_HOME` to the JDK directory and `ANDROID_HOME` to the SDK directory. The Gradle wrapper pins **Gradle 9.4.1**; the Android project pins **Android Gradle Plugin 9.2.1**. The first build downloads the pinned build dependencies.

From the source project folder:

```text
npm ci
npm run build:android
npm run verify:android -- release/Mental-Arithmetic-1.1.4-Android.apk
```

`build:android` builds the Vite production frontend, runs the Android release build and release lint, and copies the signed APK into `release/`. `verify:android` inspects that APK using the configured Android SDK. The Android application ID is `local.jeff.mentalarithmetic`, its version name is `1.1.4`, and its version code is `10104`.

The Android project is in `android/`. Its plain Java `MainActivity` hosts the shared frontend in a WebView. The build copies `dist/` into APK assets, so lessons and Practice do not require a second implementation. Bundled content is served through a restricted local asset origin. The app has no JavaScript-to-native bridge, external navigation, file chooser, downloads, analytics or backend.

### Release signing and future updates

The build uses a persistent private release key, rather than an Android debug key. By default, `scripts/build-android.mjs` creates or reuses `work/android-signing/` beside the project workspace. It keeps the keystore and its password outside the source project. If an existing keystore's password is missing, the script stops rather than replacing that key.

Keep the original private signing files for future updates: Android requires an update to use the same application identity and signing key. Do not distribute the keystore or password with the APK or source ZIP. A new build on another computer must reuse the original signing key to update the installed app; generating a different key creates an incompatible update.

To supply an existing private PKCS#12 release key, set all four environment variables together before building:

```text
MENTAL_ARITHMETIC_KEYSTORE
MENTAL_ARITHMETIC_STORE_PASSWORD
MENTAL_ARITHMETIC_KEY_ALIAS
MENTAL_ARITHMETIC_KEY_PASSWORD
```

`MENTAL_ARITHMETIC_KEYSTORE` is the private keystore file path. Supply secret values through the environment; do not add them to source files or command arguments. `MENTAL_ARITHMETIC_SIGNING_DIR` can select another private directory for the default persistent key. The delivered source archive excludes signing files, local SDK/JDK downloads and generated build caches.

## Re-run the native acceptance checks

Use a disposable Android emulator, then build the separate instrumentation APK:

```text
npm run build:android -- --tests
adb -s emulator-5556 install -r release/Mental-Arithmetic-1.1.4-Android.apk
adb -s emulator-5556 install -r -t android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb -s emulator-5556 shell am instrument -w local.jeff.mentalarithmetic.test/local.jeff.mentalarithmetic.AndroidTestRunner
```

Replace the emulator serial with the disposable test emulator's actual serial. The release and instrumentation APKs must use the same private signing key. The runner writes results and screenshots to the app's external-files `verification` directory; it is not bundled in the delivered application.

A separate local [private signing backup](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.0.2-Android-signing-PRIVATE.zip) contains the keystore and password for future updates. Keep this backup private; it is excluded from the APK and shared source archive.

## Verification and limits

Current 1.1.4 verification is recorded in [INSIDE_OUTSIDE_ANDROID_TEST_RESULTS.md](verification/INSIDE_OUTSIDE_ANDROID_TEST_RESULTS.md). Its raw evidence uses the `inside-outside-android` prefix.

The historical 1.1.3 release verification is recorded in [RELEASE_FIX_ANDROID_TEST_RESULTS.md](verification/RELEASE_FIX_ANDROID_TEST_RESULTS.md). It independently downloads the public APKs, records their actual installed versions and option lists, and tests upgrades while retaining WebView data. New raw evidence uses the `release-fix-android` prefix. The public 1.1.2 APK was found to have the intended four-category catalog on this emulator, both directly and after a real 1.1.1 upgrade. The owner subsequently confirmed the phone had 1.1.1 installed; its older catalog explained that report.

The 1.1.2 addition-options update is verified separately in [ADDITION_OPTIONS_ANDROID_TEST_RESULTS.md](verification/ADDITION_OPTIONS_ANDROID_TEST_RESULTS.md); its raw files use the `addition-options-android` prefix. Earlier reports below describe their recorded versions.

The earlier 1.1.0 signed release APK passed its eight native acceptance cases on Android 17 / API 37, including the six lesson categories available in that version, vertical addition, three-digit multiplication/carries, visible numeric keyboard placement, rotation preserving an active answer and final-round timing. This was an arm64 emulator run, not a physical-device test.

[Android test and package-verification results](./verification/ANDROID_TEST_RESULTS.md) record the final APK, SDK target, signature, production-asset comparison, lint and available runtime evidence. The records distinguish checks of the package bytes from execution inside Android.

- `verification/android-build.txt` records the release build and lint output.
- `verification/android-build-location.json` records local build and APK paths; it contains no signing password.
- `verification/android-artifacts.json` records APK identity, minimum and target SDK levels, permissions, signature, ZIP integrity/alignment, SHA-256 hash and exact comparisons between the bundled frontend and `dist/`.
- `verification/android-package-verification.txt` contains the underlying package metadata, signature and alignment tool output.
- `verification/TEST_RESULTS.md` records shared arithmetic and browser checks. Mac and Windows package reports remain in their existing platform-specific documents.

The APK's declared API range and successful package checks do not establish physical-device compatibility on every Android release, screen size or keyboard. Refer to the Android verification report for the exact emulator version and runtime checks actually completed. No physical Android device was available for this build.
