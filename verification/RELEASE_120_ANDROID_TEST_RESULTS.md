# Android 1.2.0 release certification — 3 November 2026

Stable **1.2.0**, Android code **10204**, preserves the approved preview4 interface and behavior. Its higher code allows installation over preview4 code **10203** using the original application identity and signing certificate.

## Current installed offerings

| Mode | Available configurations | Initial selection |
| --- | --- | --- |
| Learn | Single-digit multiplication; Two-digit multiplication | Single-digit multiplication |
| Practice | Two-digit addition; Single-digit multiplication; Two-digit multiplication | Two-digit addition |

No addition lesson or three-digit multiplication choice appears in the active interface. Mode switches and completed rounds retain these restrictions. The corrected Inside/Outside digit pairings, two upright **&** header connectors, grouped stages, explicit carry arrows, random examples, automatic submission and practice timing match approved preview4. Historical engine fixtures and earlier versions remain preserved separately in source.

## Final signed APK

- File: `Mental-Arithmetic-1.2.0-Android.apk`
- Bytes: **670,045**
- SHA-256: `aff97c650ccbbcd9d6e430915effe616c9dc03612b9b0a3f26fd59e73f96ba50`
- Application ID: `local.jeff.mentalarithmetic`
- Version name/code: **1.2.0 / 10204**
- Original signer SHA-256: `5bee5bb4046742472cc391fae0f29b4589bdf42fdd27a4a041c0a241347139dc`
- API 26 minimum; API 37 compile/target; non-debuggable universal APK with no Android permissions or bundled native ABI libraries.

Build and release lint passed. APK CRC, alignment and signature checks passed. All **four** bundled frontend files match the frozen stable production build byte for byte: `index-BhBrPgXA.js`, unchanged `index-W3-ZKpMk.css`, HTML and headers. All **20** mirrored Android build, production and test files match editable source. The comparison excludes generated files and Finder metadata.

Comparison against approved preview4 confirms the Android production shell and resources are unchanged. Only the version/code build metadata and the exact stable-version acceptance assertion differ among those twenty inputs. The signing identity, offline origin, network restrictions, cache/storage policy, SDK levels and permissions are retained.

## Actual preview4-to-stable update

The preserved approved preview4 APK, SHA-256 `81f534a015fa6af728a9cd497e4a9684b98ef17ef2dca0ac9e698a5c063d311f`, was installed on the task-owned emulator. A DOM-storage marker was seeded and verified after a cold relaunch. The final stable APK then installed as an update without clearing application data.

App UID **10236** and the marker remained unchanged. The installed interface showed exactly **Version 1.2.0**, the two Learn entries above with initial **multiplication-1**, Addition digit count **2**, and Multiplication digit counts **1, 2**. The actual update therefore retained local data while loading the final stable frontend.

## Actual signed-release acceptance

The final APK passed **13 cases, 0 failed**, on Android **17 / API 37**, arm64, with System WebView **145.0.7632.218**. This was a fresh complete stable run:

1. Offline origin/security, native ivory background, scholarly text stack, dark native bar icons, exact stable version and fresh default menus.
2. Prominent instruction-button text, visible content/touch bounds and actual native tap.
3. Exactly two Learn multiplication categories, explicit absence of all addition and three-digit lesson controls, four random requests per category and complete correct instructions.
4. Preserved two-digit addition Practice: seeded **58 + 67 = 125**, vertically aligned two-digit operands, partial **12** retained, **125** automatically accepted without Enter, ten unique questions and **10 / 10**.
5. Correct Inside/Outside highlights and calculations for **82 × 76**, final answer **6232**.
6. Unequal **98 × 87** trace and confirmed **18 × 18** carry demonstration.
7. Exactly two upright ampersands, grouped stage order/containment, equal filled controls, separate **Final Answer: 8526**, portrait/landscape bounds and touch targets.
8. Correct stage colors and digit references, equal highlight emphasis, Arial math and explicit unchanged carry routes including complete carry **13**.
9. Single-digit **8 × 7 = 56** instruction, both digit references, separate final answer, Back navigation and fresh random-example reset.
10. Actual native numeric keyboard for two-digit multiplication, partial input/timer preserved through rotation, and the **862 × 122** landscape keyboard viewport with incorrect **×** feedback. Problem, answer, live timer and previous feedback remain visible and pairwise separate. One deliberate wrong native answer plus nine correct answers scores **9 / 10**.
11. Monochrome incorrect cue and numeric time, black emphasis border, white answer field and no Learn palette in Practice.
12. Immediate progression, exact score and minimum/maximum/average timings over all ten accepted answers.
13. Exactly three offered Practice configurations, ten unique in-range pairs each, **30 / 30** correct answers, three **10 / 10** scores, addition-length reset and no three-digit selector entry after mode changes.

Stable Learn catalog, addition setup, grouped landscape header and short landscape keyboard screenshots were manually inspected. Seven representative current images were copied to the parent outputs folder.

## Native test-host event and cleanup

The first emulator host process exited with signal **9** before Android boot, before the app started. Its cause was not established. Both iOS-owned simulators were already verified shut down; no cause is attributed to iOS. The startup log and exit record are preserved under `release-120-android-runtime/development-host-retry/`.

The owned AVD retry completed its cold boot. The first actual application certification run then passed all thirteen cases; no product changes or app-data reset were made for the retry. The owned Android emulator was stopped and its host process exited after verification. No physical Android device was modified.

## Evidence and scope

- [Build output](release-120-android-build.txt) and [release lint](release-120-android-lint-results.txt).
- [APK metadata, signer and frontend bytes](release-120-android-artifacts.json).
- [Build/source mirror](release-120-android-source-comparison.json) and [approved-preview comparison](release-120-android-approved-preview-comparison.json).
- [Actual update/device/runtime summary](release-120-android-runtime-environment.json).
- [Installed stable catalog](release-120-android-runtime/stable-updated-catalog/android-runtime-results.json).
- [All thirteen native case results](release-120-android-runtime/stable-native-acceptance/android-runtime-results.json).
- [Stable Learn catalog](release-120-android-runtime/stable-updated-catalog/android-installed-learn.png) and [two-digit addition setup](release-120-android-runtime/stable-updated-catalog/android-installed-practice.png).
- [Grouped landscape header](release-120-android-runtime/stable-native-acceptance/android-grouped-stages-landscape.png) and [short keyboard layout](release-120-android-runtime/stable-native-acceptance/android-practice-landscape-keyboard-feedback.png).
- [Before-boot host event](release-120-android-runtime/development-host-retry/before-boot-host-exit.json).

This certification was performed before coordinated publication and made no remote changes. It establishes package/runtime behavior in the tested emulator environment. Physical-phone behavior and every older eligible Android version, manufacturer keyboard or accessibility setting are not claimed. Narrower widths and 200% text are covered separately by the shared browser checks.
