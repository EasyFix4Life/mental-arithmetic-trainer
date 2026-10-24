# iOS verification — Mental Arithmetic 1.1.0 (build 1)

Verified locally on 24 October 2026 with the owner's requested **Xcode 27 beta, build 27A5228h**, at `/Applications/Xcode-beta.app/Contents/Developer`. The native app targets iPhone and iPad with a configured minimum deployment version of iOS/iPadOS 17.0. Actual simulator execution below covers 26.5 and 27.0 beta; an iOS 17 runtime and physical devices were not used.

The application contains native Swift/UIKit views and a Foundation arithmetic/state core. It does not embed the website in a WebView. Its implementation is checked for equivalent behavior, not claimed to be byte-identical to the TypeScript frontend.

## Results and evidence boundaries

| Verification | Result | Evidence |
|---|---|---|
| iOS Simulator Debug build | Passed | `ios-qa-build.txt` |
| Generic iOS arm64 Release archive, unsigned | Passed | `ios-artifacts.json`, device archive ZIP |
| Release simulator app | Passed | `ios-artifacts.json`, simulator app ZIP |
| Exact portable Swift core XCTest sources, executed on macOS | **34 passed, 0 failures**, 0.534 s | `ios-core-portable-results.json`, `ios-core-portable-tests.txt` |
| Native UIKit integration, iPhone 17 Pro / iOS 26.5 | **8 passed, 0 skipped**; 89 assertions | `ios-native-integration-iphone26.json` |
| Native UIKit integration, iPhone 17 Pro / iOS 27.0 beta | **8 passed, 0 skipped**; 89 assertions | `ios-native-integration-iphone27.json` |
| Native UIKit integration, 13-inch iPad Pro / iPadOS 26.5 | **7 passed, 1 skipped**; 84 assertions | `ios-native-integration-ipad26.json` |
| Xcode-hosted XCTest/XCUITest execution on iOS | **Not executed**: local test-service startup failed before test cases ran | `ios-iphone26-tests.txt`, `ios-iphone26-tests-final.txt`, `ios-iphone27-tests.txt` |
| App Store/TestFlight upload, distribution signing, physical iPhone/iPad installation | Not performed | No developer team/certificate supplied; preparation requested before enrollment |

The 34 portable tests run the exact four Foundation core files and three XCTest/data files used by the iOS project. Their byte hashes are recorded in `ios-core-portable-results.json`. This is macOS execution of portable core code, not a claim that XCTest ran inside the iOS simulator.

The native integration harness runs **inside the actual Debug simulator app**, invokes its UIKit control actions and production `UITextFieldDelegate`, checks the rendered view hierarchy, and writes JSON results. The separate eight-case XCUITest suite remains in the source for later external keyboard/accessibility testing. The harness does not substitute for physical typing, VoiceOver testing, or App Store review. All harness code, its environment entry point, and fixed-example setup helpers are under `#if DEBUG`; absence from the delivered Release archive is checked in `ios-artifacts.json`.

## Coverage

The portable core tests verify the supplied arithmetic/input acceptance data, six operation/digit-count settings, unique ten-problem rounds, invalid and partial input, expected-length automatic acceptance, leading-zero and overlong-input handling, stale/duplicate submissions, correct/incorrect advancement, manual starts, elapsed-time flooring, raw-duration minimum/maximum/average, both confirmed multiplication demonstrations, and the lesson calculations/carry routes. Arithmetic traces include all 8,100 two-digit multiplication pairs, all single-digit products, all one- and two-digit addition pairs, and boundary/varied three-digit cases.

The native scenarios verify:

1. Partial-entry behavior, non-digit rejection through the actual text-field delegate, immediate advancement for correct and incorrect answers without Enter, black/red prior time, a 9/10 score, real minimum/maximum/mean timing, Learn/Practice state preservation, and a manually started next round.
2. Real random problems and correct submission for all six Practice configurations.
3. The fixed 18 × 18 sequence: Last 64; carry 6 to make 22; carry 2 to make First 3; final answer 324 after Last.
4. Operand ranges and a changed random example on each of the six Learn pages.
5. iPhone landscape rotation preserving the current problem, partial entry, keyboard focus, and adjacent answer/timer frames inside the window. **The iPad simulator did not apply the programmatic landscape geometry request; iPad rotation and its landscape keyboard layout remain unverified.** Its current problem and partial entry remained intact during that request.
6. The local privacy policy opening without an account or network service.
7. The owner-described three-digit multiplication groups and right-to-left carry trace for 123 × 456: 4, 13, 28, 27, 18; then 28, 30, 16, 5; final answer 56088.
8. Working calculations and final answers on all six lesson pages, readable walkthrough width, and aligned right edges for vertical addition operands.

The 12 × 12 and 18 × 18 demonstrations are individually owner-confirmed. Other generated instructional scripts apply the owner-described methods and requested layout; they are not represented as individually owner-approved demonstrations.

## Visual checks and screenshots

The final screenshots show the actual native app: sepia background, Arial numerals, six instructional categories, vertical addition, digit highlighting, multiplication groups/carries, the native software keyboard, the answer/timer row, and a score with maximum/minimum/average times. Visual review found and corrected a Learn layout defect where hiding only the expression left a 48-point help button constraining the entire scroll content. The final source hides the complete problem row while the walkthrough is open; width/alignment regression assertions now pass on both device sizes.

Actual simulator captures and their manifests are in:

- `ios/AppStore/Screenshots/iPhone-26.5/`: 1206 × 2622, six captures.
- `ios/AppStore/Screenshots/iPad-26.5/`: 2064 × 2752, six captures.
- `ios/AppStore/Screenshots/iPhone-27-beta/`: 1206 × 2622, six compatibility captures.

Each folder preserves its raw PNGs. Its **`Upload/`** folder contains corresponding opaque PNG copies for App Store owner review. A small AppKit format converter verifies that the original alpha samples are all 255 and copies every decoded RGB sample into a three-channel PNG. It does not redraw the interface or resize the screenshot. PNG checksums, decompression, dimensions, and absence of alpha are verified. The manifests record raw and upload-copy SHA-256 values and the conversion. No screenshot has been uploaded to App Store Connect.

The iPhone dimensions match the medium Dynamic Island device group, and the iPad dimensions match the 13-inch group in Apple's [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/). Select the desired actual screens and review final listing text before uploading.

## Local tooling limitation and reproduction

Xcode's test host failed to establish its local `DTServiceHub`/`com.apple.instruments.deviceservice.lockdown` connection on both simulator runtimes before executing XCTest/XCUITest. Completing the installed beta's first-launch components succeeded but did not resolve that connection. Native app build, launch, rendering, software-keyboard presentation, and the independent integration harness worked. The failed/interrupted attempts are retained and are not counted as passing tests.

Run the portable core suite from the project directory:

```bash
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer \
  xcrun swift test --package-path ios --scratch-path /tmp/mental-arithmetic-core-tests
```

Run the external Xcode tests once the local test service works, substituting an available simulator UDID:

```bash
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer \
  xcodebuild test -project ios/MentalArithmetic.xcodeproj -scheme MentalArithmetic \
  -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_UDID' \
  -derivedDataPath /tmp/mental-arithmetic-xcode-tests \
  -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO
```

`ios/AppStore/run_simulator_review.py` documents the Debug-only integration/screenshot route, and `prepare_upload_screenshots.py` creates the opaque upload copies. The Release app does not respond to the harness environment variable.

## Before distribution

The prepared device archive is unsigned and is not an installable IPA. Enrollment, a registered identifier/team, distribution signing, seller/reviewer/support details, public support/privacy policy URLs, pricing/territories, final questionnaires, physical-device review, and submission remain. The app name has not been checked for availability. Recheck acceptance of the exact requested beta build at upload time using Apple's [App Store Connect release notes](https://developer.apple.com/help/app-store-connect/release-notes/). Local archive success and simulator checks do not establish Apple acceptance or approval.
