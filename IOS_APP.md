# iPhone and iPad development downloads — 1.2.0

**Version 1.2.0, build 10.** Prepared for the owner-authorized GitHub 1.2.0 release as iOS development downloads. The native app matches approved preview 4 (`2cd3f1e6f15c0709fe444ff9cf32585d41ac89e2`) without UI, arithmetic or option changes. These packages have not been submitted to App Store Connect or TestFlight.

The iOS app is native Swift/UIKit, with iOS/iPadOS 17.0 minimum compatibility. It runs offline without a WebView, account, advertisements, analytics, tracking or app network requests. Learn offers single- and two-digit multiplication only, starting at its first available lesson (single-digit multiplication). Practice offers two-digit addition plus single- and two-digit multiplication. No addition lesson or three-digit multiplication option appears in the app. The three-digit arithmetic engine, original requirements and historical fixtures remain available in source for verification and later work. Arithmetic algorithms and owner-confirmed instruction data retain their existing corrected Inside/Outside selections, random examples, ten-question Practice, automatic answer submission and round timing.

## Current app choices

The current Learn catalog is **M1, M2**. Practice is **A2, M1, M2**, retaining A2 as its initial setting. Switching operations preserves an allowed digit count; invalid stale settings normalize to the selected operation's first allowed count (A2 or M1). Learn availability is separate from Practice availability. `LessonCatalog.allLessons` retains the historical instruction fixtures, while `LessonCatalog.lessons` filters the app's two available lessons. No generator arithmetic or carry procedure is deleted.

The named two-digit multiplication controls now express the requested visual relationship:

`[ First & [ Inside + Outside ] & Last ] = [ Final Answer: #### ]`

First, Inside, Outside and Last remain four independently selectable buttons. All four use the same bold Baskerville type, padding and two-point borders, with matching light fills. Inside and Outside stay together inside an outlined violet middle section with an explicit plus sign. The two literal upright ampersands are decorative header connectors; the existing carry-route down arrows are unchanged. The neutral Final Answer button and visible equals sign are outside the stage enclosure; its digits use Arial. Selection changes underlining and accessibility traits without changing the four boxes' relative weight.

The logical action order remains First, Inside, Outside, Last, Final Answer. Direct stage/final selection, Next/Back and existing carry screens are preserved. The wide layout is selected only when the measured complete diagram (words, shared padding, group margins, measured ampersands, plus, equals and final caption) fits. Otherwise the outer sections stack; the middle pair independently stacks when needed, including largest accessibility text, within the same outline. Unbreakable heading words fit their available line while retaining Dynamic Type scaling. Other numbered lessons keep their existing navigation.

Version 1.2.0 packages the approved preview 4 behavior. All native app, core and test sources remain byte-identical to that approved commit; only the native build number and release preparation metadata change. Earlier 1.1.4 and preview packages, source snapshots, screenshots and reports are retained as historical files.

## Visual changes

The shared design specification is `design/VISUAL_DESIGN_SPEC.md`; canonical colors and dimensions are in `design/visual-tokens.json`. `npm run design:tokens` generates `ios/MentalArithmetic/UI/VisualTokens.generated.swift`. Xcode's synchronized source group includes this generated file automatically; do not hand-edit it.

- Ivory paper `#FAF7F0`, black ink and white controls/answer fields replace the darker sepia presentation.
- Baskerville supplies scholarly headings, prose and controls; mathematical calculations, operands, answer entry, timers and scores remain Arial.
- Learn alone uses First teal `#126C70`, Inside and Outside the same violet `#755093`, and Last amber `#885A15`. Each uses equal two-point borders and bold type. Stage fills are First `#E2F1EF`, Inside/Outside `#EEE5F4`, Last `#F6ECD8`; selection adds an underline. Single-digit instructional steps remain neutral.
- Existing static pair connectors appear only when the existing calculation explicitly agrees with a single authored highlighted pair. Carry-completion and multi-product screens do not gain guessed pairings.
- Carries show their existing origin, whole carried value and destination in static routes. Developing-answer slots render only the provided answer characters. No value or place is inferred by the presentation.
- Practice uses black/white/ivory throughout. Incorrect feedback keeps its numeric time and accessible correctness description, with a separate black **×** and border replacing red. Timers retain their existing positions.

Text supports Dynamic Type. Accessible stage/catalog layouts reflow vertically, with scrollable instructional content. Native segmented choices remain one line and cap their scaled label font at 24 points to preserve readable complete choices; surrounding text scales without that cap. Timed mathematics scales within its available space to avoid covering the answer/timer. System keyboards remain platform-owned.

## Open and build with Xcode beta

Open `ios/MentalArithmetic.xcodeproj` with `/Applications/Xcode-beta.app`, choose **MentalArithmetic**, select an iPhone or iPad simulator and Run. No Apple Developer Program membership is required for simulator review.

```bash
open -a /Applications/Xcode-beta.app ios/MentalArithmetic.xcodeproj
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer npm run build:ios:simulator
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer npm run build:ios
```

Local verification uses Xcode 27 beta build **27A5228h**, as requested by the owner. The normal build scripts derive artifact filenames from the shared package version. Native `CFBundleShortVersionString` is 1.2.0 and `CFBundleVersion` is 10; Privacy displays those installed native values.

## Download files

- `Mental-Arithmetic-1.2.0-iOS-Simulator-app.zip`: Release `.app` for the iOS Simulator on a Mac. It cannot be installed on a physical iPhone/iPad.
- `Mental-Arithmetic-1.2.0-iOS-unsigned-archive.zip`: arm64 device `.xcarchive`. It is unsigned, is **not an installable IPA**, and requires the owner's development team and signing before device distribution.
- `Mental-Arithmetic-1.2.0-iOS-submission-files.zip`: **review-only preparation files**, current build 10 screenshots, metadata drafts and icon. Its name follows the existing packaging convention; it is not a completed App Store submission.
- The complete source archive includes the native project, current design specification/tokens, original requirements, tests and historical evidence.

The provisional app identifier remains `local.jeff.mentalarithmetic`. No signing identity, Apple developer team or provisioning profile has been created.

## Verification and its limits

Portable core tests run with:

```bash
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer swift test --package-path ios
```

These test the exact Foundation-only files used by the native app, on macOS. Native visual verification separately uses a DEBUG-only review harness driving actual UIKit controls and text-field delegates. It checks the ivory tokens, serif/Arial distinction, stage colors, corrected pair selection, static carries, monochrome feedback and enlarged text. The complete existing arithmetic/input/timing checks remain in place. DEBUG fixture helpers compile out of Release.

`ios/AppStore/run_release_artifact_audit.py` additionally checks the app extracted from the final simulator ZIP through a separate simulator-only verification library. It verifies real packaged UIKit controls, selected-digit colors/calculations and complete Practice rounds, while checking that the installed executable hash remains identical. The library is not included in delivered app bundles.

Current build 10 package reports and logs use `verification/release-120-ios-*`, especially `verification/release-120-ios-summary.json`. The final ZIP-extracted Release app is checked on the owned iPhone/iOS 27 and iPad/iPadOS 26.5 simulators with the expected version **1.2.0/build 10**. The existing full runtime auditor verifies the exact two-lesson Learn catalog/default, absent removed options, Practice switching, complete A2/M1/M2 rounds, A2 input/score/timing, random examples/final answers, corrected Inside/Outside pair selections, grouped literal ampersands and largest accessibility layouts. New screenshots, including the current Privacy version display, are in `ios/AppStore/Screenshots/1.2.0-build10-*`.

The approved preview 4's **38 portable core tests** remain applicable because all app/core/test sources are byte-identical. Those tests were not rerun for this metadata-only packaging step. The comparison report records exact source hashes against the approved commit. Earlier preview reports and screenshots remain preserved historical proof.
These routes do not establish physical keyboard/device testing or external XCUITest execution. The existing iPad programmatic landscape request remains an explicitly reported skip where the simulator does not apply it. Earlier Xcode-hosted test execution encountered a local DTServiceHub failure; that history is preserved separately.

## Distribution boundary

The owner has authorized GitHub and website downloads for release 1.2.0. These iOS packages are development downloads: the Simulator app runs on a Mac, and the unsigned device archive requires a development team and signing before physical-device distribution. It is not an installable IPA or an App Store release. No Apple Developer membership, signing identity, distribution certificate, TestFlight upload or App Store submission is supplied or performed here. Apple enrollment, a permanent identifier/team, signing, physical-device validation, owner support/privacy/contact fields and final App Store review remain necessary for signed distribution.
