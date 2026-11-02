# Mental Arithmetic for Android

**1.1.1 interface update:** the lesson-help button now reads **? Click Here to Learn How!**. See [the update report](verification/HELP_BUTTON_UPDATE.md) for current checks and screenshots. Prior detailed verification reports remain as the 1.1.0 baseline.

Version **1.1.1** packages the same lessons, random examples and Practice timing as the macOS and Windows apps in a signed Android APK. It targets **Android 17 / API 37**, the current stable major Android release as of **24 October 2026**. Google announced Android 17 on 16 June 2026; its SDK setup guide specifies `compileSdk = 37` and `targetSdk = 37`. [Android 17 release announcement](https://android-developers.googleblog.com/2026/06/Android-17.html) · [Android 17 SDK setup](https://developer.android.com/about/versions/17/setup-sdk)

The minimum declared Android version is **Android 8.0 / API 26**. This is a universal APK with no bundled native libraries or CPU-specific runtime. It uses the device's installed Android System WebView; keep that component current. The minimum SDK setting describes installation eligibility, rather than proof of testing every older Android version or device.

The installed app works offline. It needs no account, Node.js, browser tab or local server, and requests no Android permissions, including Internet access.

## Download and install

- [Mental-Arithmetic-1.1.1-Android.apk](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.1-Android.apk) — the signed Android application.
- [Complete source code for all platforms](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.1-all-platforms-source.zip) — the shared frontend, Android project, desktop wrappers, build scripts, requirements, tests and documentation.

Exact APK path on the build Mac:

```text
/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.1-Android.apk
```

Copy or download the APK to the Android device, open it in **Files**, and follow Android's installation prompt for that file source. Open **Mental Arithmetic** from the launcher after installation. This is a direct APK delivery; it has not been submitted to Google Play. No Google Play account or publication is required to use the supplied file.

For an already connected development device with ADB authorized, installation from a computer is also possible:

```text
adb install -r Mental-Arithmetic-1.1.1-Android.apk
```

That command installs or updates this app only. No physical phone was connected during development; emulator and package-verification evidence is recorded separately below.

## Lessons, examples and Practice

- The sepia background, large numerals and responsive interface use the same production frontend as the existing apps. The CSS requests Arial with system sans-serif fallbacks; Android uses an available fallback when Arial is not installed, and the APK does not redistribute proprietary font files. The native Android container respects the status bar, navigation area, display cutouts and on-screen keyboard.
- Learn lists all six addition/multiplication categories with one-, two- and three-digit operands. Every category has random examples, **New random example**, a complete interactive calculation/carry walkthrough and a separate final answer. Operand ranges are 1–9, 10–99 and 100–999. The next generated pair avoids the immediately preceding pair and its reversal.
- Two-digit multiplication follows **First → Inside → Outside → Last**, including the required carries, with **Final answer** following Last. The confirmed **12 × 12** and **18 × 18** demonstrations remain selectable. Generated examples apply that confirmed calculation method. Three-digit multiplication follows the owner-described five-group sequence, including the central first×last, last×first, middle×middle order. Addition uses corresponding digit sums and right-to-left carry resolution. Addition operands and sums appear above/below in Learn, calculations, final answers and Practice.
- Practice offers addition and multiplication with one-, two- or three-digit operands. Each round contains ten unique problems. An answer submits automatically when its length reaches the expected number of digits, and both correct and incorrect submissions advance immediately. Enter is not required.
- The live timer stays beside the answer field at the bottom right. The previous answer's completion time appears at the upper left, black for correct or red for incorrect.
- The completed set shows the score out of ten, **Maximum time**, **Minimum time** and **Average time**. All ten accepted answers count, including incorrect answers. The average uses the full-resolution durations, then the interface displays completed tenths of a second. Another round starts manually. Starting a new round clears the previous summary; the app does not save a history of completed sets.

The shared input policy and its explicitly provisional keyboard decisions remain documented in [README.md](./README.md). The Android package does not add an educational curriculum or change the arithmetic method.

## Build from source

Install the Node.js/npm versions described in [README.md](./README.md), **JDK 21**, and an Android SDK containing **Platform 37** and **Build Tools 37.0.0**. Set `JAVA_HOME` to the JDK directory and `ANDROID_HOME` to the SDK directory. The Gradle wrapper pins **Gradle 9.4.1**; the Android project pins **Android Gradle Plugin 9.2.1**. The first build downloads the pinned build dependencies.

From the source project folder:

```text
npm ci
npm run build:android
npm run verify:android -- release/Mental-Arithmetic-1.1.1-Android.apk
```

`build:android` builds the Vite production frontend, runs the Android release build and release lint, and copies the signed APK into `release/`. `verify:android` inspects that APK using the configured Android SDK. The Android application ID is `local.jeff.mentalarithmetic`, its version name is `1.1.1`, and its version code is `10100`.

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
adb -s emulator-5556 install -r release/Mental-Arithmetic-1.1.1-Android.apk
adb -s emulator-5556 install -r -t android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb -s emulator-5556 shell am instrument -w local.jeff.mentalarithmetic.test/local.jeff.mentalarithmetic.AndroidTestRunner
```

Replace the emulator serial with the disposable test emulator's actual serial. The release and instrumentation APKs must use the same private signing key. The runner writes results and screenshots to the app's external-files `verification` directory; it is not bundled in the delivered application.

A separate local [private signing backup](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.0.2-Android-signing-PRIVATE.zip) contains the keystore and password for future updates. Keep this backup private; it is excluded from the APK and shared source archive.

## Verification and limits

The signed release APK passed all **eight native acceptance cases on Android 17 / API 37**, including all six complete lesson categories, vertical addition, three-digit multiplication/carries, visible numeric keyboard placement, rotation preserving an active answer and final-round timing. This was an arm64 emulator run, not a physical-device test.

[Android test and package-verification results](./verification/ANDROID_TEST_RESULTS.md) record the final APK, SDK target, signature, production-asset comparison, lint and available runtime evidence. The records distinguish checks of the package bytes from execution inside Android.

- `verification/android-build.txt` records the release build and lint output.
- `verification/android-build-location.json` records local build and APK paths; it contains no signing password.
- `verification/android-artifacts.json` records APK identity, minimum and target SDK levels, permissions, signature, ZIP integrity/alignment, SHA-256 hash and exact comparisons between the bundled frontend and `dist/`.
- `verification/android-package-verification.txt` contains the underlying package metadata, signature and alignment tool output.
- `verification/TEST_RESULTS.md` records shared arithmetic and browser checks. Mac and Windows package reports remain in their existing platform-specific documents.

The APK's declared API range and successful package checks do not establish physical-device compatibility on every Android release, screen size or keyboard. Refer to the Android verification report for the exact emulator version and runtime checks actually completed. No physical Android device was available for this build.
