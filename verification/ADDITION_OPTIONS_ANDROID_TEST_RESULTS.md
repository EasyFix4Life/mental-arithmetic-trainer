# Android 1.1.2 addition options update

The signed Android APK removes one-digit and three-digit **Addition** from both Learn and Practice. Two-digit Addition remains available and is the initial Practice choice. Multiplication retains its one-, two- and three-digit options, random examples, instructional steps, carries and final answers. Switching from one- or three-digit Multiplication to Addition selects two digits.

The Android release build, release lint, package checks and all **nine native acceptance cases passed on Android 17 / API 37**. This was a disposable arm64 emulator run. No physical device was modified.

Release lint reported **0 errors and 5 nonblocking warnings** about manifest attributes on older SDK levels, a newer available Gradle version, a redundant resource qualifier and the launcher icon's optional monochrome layer. This update preserves the pinned toolchain and existing native shell resources.

## Delivered APK

| Property | Verified value |
| --- | --- |
| File | `Mental-Arithmetic-1.1.2-Android.apk` in the parent `outputs/` folder |
| Application ID | `local.jeff.mentalarithmetic` |
| Version / version code | `1.1.2` / `10102` |
| Size | 665,996 bytes |
| SHA-256 | `276b4903a4c869fae6357b014b9eb59f44475923c0d8c3361604902704bff507` |
| Minimum / target SDK | Android 8 / API 26; Android 17 / API 37 |
| Signature | Verified APK v2 signature; the existing persistent release certificate was reused |
| Certificate SHA-256 | `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc` |
| Manifest permissions | None, including no Internet permission |
| Native CPU libraries | None; the installed system WebView renders the offline application |
| ZIP integrity | All 18 members passed CRC checks; no duplicate or unsafe paths; alignment passed |

All three files bundled under `assets/www/` match the frozen production frontend byte-for-byte:

| Frontend file | SHA-256 |
| --- | --- |
| `assets/index-CIxu1Qxd.js` | `efdd6e5fea5af0461e14c2836ca340cc0c43bbc87c498a12e55070177214d48f` |
| `assets/index-DtQOxB5b.css` | `2eba6d2085be7c2303cf188b22d9bad6d2f39b78ca95095a83eefbab95187bce` |
| `index.html` | `177b2ba5c526fe8a1e7526f922ab464e1e0d5ca74e9ab7b8811929499aa34769` |

## Native acceptance results

The actual signed, non-debuggable release APK was installed on `emulator-5556`, a disposable `sdk_gphone64_arm64` Android 17 / API 37 device at 1080 × 2400 and density 420. Its Android System WebView was `com.google.android.webview` version `145.0.7632.218`. The separate instrumentation APK uses the same signing identity and is excluded from the delivered application.

| Case | Result |
| --- | --- |
| Offline release shell, sepia presentation, numeric input, Addition default 2 and absence of website-only downloads | Passed |
| Prominent `? Click Here to Learn How!` button, accessible name, bounds and real native tap | Passed |
| Exactly four Learn categories; excluded Addition lengths absent; random pairs and complete walkthroughs in every remaining lesson | Passed |
| Two-digit Addition instructions, right-to-left carries, aligned vertical operands and final answer `58 + 67 = 125` | Passed |
| Random two-digit Multiplication trace and confirmed `18 × 18 = 324` carrying sequence | Passed |
| Three-digit Multiplication five-group calculation and whole-value carries for `123 × 456 = 56088` | Passed |
| Real Android numeric keyboard, visible answer/timer, rotation preserving active input and native-key-event round | Passed |
| Ten automatic submissions, immediate advancement, incorrect time in red, score and exact maximum/minimum/average summary | Passed |
| All four available Practice configurations, 40 accepted answers, unique problems, and switching from Multiplication 1/3 to Addition 2 | Passed |

The Learn catalog order is Single-digit multiplication, Two-digit addition, Two-digit multiplication, Three-digit multiplication. Practice exposes `[2]` for Addition and `[1, 2, 3]` for Multiplication. Existing ten-problem rounds, automatic submission, manual restart and timing behavior remain covered by the native cases.

## Evidence and previews

- [Native scenario results](addition-options-android-runtime/android-runtime-results.json) and [emulator environment](addition-options-android-runtime-environment.json).
- [Package identity, signature and frontend comparisons](addition-options-android-artifacts.json) and [underlying verification tool output](addition-options-android-package-verification.txt).
- [Successful release, lint and test-APK build](addition-options-android-build.txt), [lint results](addition-options-android-lint-results.txt) and [instrumentation output](addition-options-android-instrumentation.txt).
- [Default two-digit Addition setup](addition-options-android-runtime/android-setup.png).
- [Four-category Learn catalog and help button](addition-options-android-runtime/android-learn-help-button.png).
- [Vertical Addition answer](addition-options-android-runtime/android-learn-addition.png), [native keyboard](addition-options-android-runtime/android-practice-keyboard.png) and [round timing](addition-options-android-runtime/android-round-timing.png).

The build ran in a temporary folder outside the synced source tree. Existing cloud placeholders for SDK metadata and the private signing files were downloaded locally; the signing identity was preserved. Fresh copies of the same official SDK Platform 37 revision 2 and Build Tools 37.0.0 archives passed Google's published checksums. These environment-recovery attempts did not change application source or create a new signing key. Previous releases and verification reports remain unchanged.

The successful emulator run and declared minimum SDK do not establish runtime compatibility with every Android release, device or keyboard. This APK was not submitted to Google Play.
