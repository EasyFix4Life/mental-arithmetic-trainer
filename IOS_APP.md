# iPhone and iPad app — 1.1.4

**1.1.4 correction:** Two-digit multiplication now labels the inner and outer digit pairs correctly. For 82 × 76, **Inside is 2 × 7 = 14** and **Outside is 8 × 6 = 48**, followed by **14 + 48 = 62**. Fixed 12 × 12 and 18 × 18 walkthroughs use the same corrected selections. Learn and Practice retain two-digit addition and single-, two-, or three-digit multiplication; Practice timing and automatic submission are unchanged. Privacy displays **Version 1.1.4 (build 5)**. Current evidence uses `verification/inside-outside-ios-*`.

The iOS app is a native Swift/UIKit application in `ios/MentalArithmetic.xcodeproj`. It uses Arial numerals, the existing sepia presentation, four instructional categories (two-digit addition and single-, two-, and three-digit multiplication) with random examples, stacked addition, and ten-question Practice with automatic submission and minimum/maximum/average timing. It runs offline and contains no WebView, third-party SDK, account, analytics or network service. The minimum deployment target is iOS/iPadOS 17.0.

## Open and run with Xcode beta

Open the Xcode project in **Xcode-beta.app**, select the **MentalArithmetic** scheme, choose an iPhone or iPad simulator and press Run. No paid membership is needed for the simulator.

```bash
open -a /Applications/Xcode-beta.app ios/MentalArithmetic.xcodeproj
```

The verified local toolchain is `/Applications/Xcode-beta.app/Contents/Developer`, Xcode 27 beta build **27A5228h**, with the iOS 27 SDK. The simulator checks use iOS 26.5 and 27 where recorded in `verification/IOS_TEST_RESULTS.md`. This beta toolchain was explicitly requested by the owner.

To build from Terminal without changing the system's selected Xcode:

```bash
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer npm run build:ios:simulator
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer npm run build:ios
```

The first command packages a Release simulator `.app`; the second packages an **unsigned device archive**. Both write ZIPs to `release/`. They do not sign, upload, create an App Store Connect record, or publish the app. The scripts prefer the installed Xcode beta when `DEVELOPER_DIR` is absent, while preserving an explicit override.

## Supplied files

- `Mental-Arithmetic-1.1.4-iOS-unsigned-archive.zip`: successful generic iOS Release archive, arm64, including the native app and archive metadata. Extract it before opening the `.xcarchive` in Xcode Organizer. This is **not a signed IPA** and cannot be installed directly on a physical iPhone.
- `Mental-Arithmetic-1.1.4-iOS-Simulator-app.zip`: Release simulator app, for an Apple silicon Mac with an appropriate simulator runtime. This cannot be installed on a physical iPhone.
- `Mental-Arithmetic-1.1.4-all-platforms-source.zip`: complete editable source, Xcode project, original supplied requirements, tests, guides and submission drafts.
- `Mental-Arithmetic-1.1.4-iOS-submission-files.zip`: prepared App Store metadata, privacy/rating drafts, reviewer notes, icon and genuine simulator screenshots where included in the screenshot manifest.

The device archive has no development team or signing identity assigned. The provisional bundle identifier is `local.jeff.mentalarithmetic`; replace it with an identifier registered to your team before distribution. Version is **1.1.4**, build **5**.

## Tests

The native Foundation-only core has a Swift package manifest for reproducible portable verification:

```bash
xcrun swift test --package-path ios --scratch-path /tmp/mental-arithmetic-core-tests
```

This runs the exact Swift files used by the iOS app. It is a macOS test of portable core behavior, not an iOS UI test. The native Xcode project additionally contains XCTest and XCUITest targets:

```bash
xcodebuild -project ios/MentalArithmetic.xcodeproj -scheme MentalArithmetic \
  -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_UDID' \
  -derivedDataPath /tmp/mental-arithmetic-xcode-tests CODE_SIGNING_ALLOWED=NO test
```

On this installation, Xcode's test service failed before tests could execute. The report records this failure and the separate successful verification routes. A DEBUG-only simulator review harness drives actual UIKit controls and text-field delegates; it produces JSON results and real screenshots. It does not claim physical-keyboard or XCUITest coverage. The harness and fixture helpers compile out of Release, which is checked against the delivered archive.

## App Store preparation

The drafts in `ios/AppStore/` include the product listing, reviewer notes, an offline-first privacy policy, privacy questionnaire suggestions, screenshot exporter and owner decisions still needed. The app itself includes a local Privacy sheet. Its privacy manifest declares no tracking or collection and the required elapsed-timer API reason. No permission prompts or account credentials are requested by the app.

You chose to prepare the app before Apple Developer enrollment. To complete a signed submission later, enroll in the Apple Developer Program, assign your development team and registered identifier, provide your seller/support/reviewer contact details, supply public support/privacy policy URLs, and choose price/territories. Recheck acceptance of the **exact Xcode beta build** when uploading: Apple's supported builds change over time. The delivered unsigned archive has not been accepted by App Store Connect or reviewed by Apple. No App Store or TestFlight upload has been made.

Sources for the eventual submission workflow: [Apple App Store Connect release notes](https://developer.apple.com/help/app-store-connect/release-notes/), [Apple submitting guide](https://developer.apple.com/app-store/submitting/), and [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Version 1.1.4 artifact verification

The portable Foundation-only Swift suite includes 36 tests. Regressions cover the owner's unequal-product example 82 × 76, zero and carry cases, the corrected fixed examples, and the inner/outer digit mapping across all 8,100 two-digit products.

Release simulator and unsigned device archive builds use Xcode 27 beta, version **1.1.4, build 5**. `ios/AppStore/run_release_artifact_audit.py` tests the app extracted from the final simulator ZIP through a separate simulator-only library. It drives the packaged app's real UIKit controls and text-field delegates, checks the corrected Inside/Outside calculations and selected digits, verifies all four Practice configurations and lessons, and checks that the executable remains unchanged. It is separate from physical keyboard input and external XCUITest automation. Results are in `verification/inside-outside-ios-summary.json` and the matching per-device reports.

The DEBUG-only native review harness additionally checks and captures the exact 82 × 76 Inside and Outside screens. Current screenshot folders are `ios/AppStore/Screenshots/1.1.4-iPhone-27-beta/` and `ios/AppStore/Screenshots/1.1.4-iPad-26.5/`. Their `Upload/` copies preserve decoded RGB pixels and dimensions while removing unused opaque alpha. Only these current folders are included in the 1.1.4 submission-files ZIP.

The device archive is unsigned and cannot be installed directly on a physical iPhone. Physical iPhone/iPad validation and signed App Store/TestFlight distribution remain unverified. Earlier Xcode-hosted test execution encountered a local DTServiceHub connection failure; the packaged Release verification uses the separate route described above. Final pass/skip counts and device runtimes are reported in the current summary rather than inferred from older releases.

## Historical version 1.1.2 verification


The historical 1.1.2 Foundation-only Swift suite passed **35 tests**. The DEBUG UIKit review passes **8 of 8 scenarios on iPhone (iOS 27 beta)** and **7 of 8 on iPad (iPadOS 26.5)**, with the programmatic iPad rotation scenario explicitly skipped. The cases verify the four available categories, the default two-digit addition selection, switching from one- or three-digit multiplication back to two-digit addition, random examples, the existing carry walkthroughs, automatic submission, scoring, and round timing. The iOS random-example menu now uses the selected operation’s symbol.

Release simulator and unsigned device archive builds passed using Xcode beta. Version is **1.1.2, build 3**. The simulator package includes arm64 and x86_64; the device archive is arm64. Both Release binaries exclude the DEBUG review harness. XCTest and XCUITest targets compile successfully, but the external test service still fails to connect (`DTServiceHub`), so the UIKit review is reported separately from XCUITest. Physical iPhone/iPad testing and signed App Store distribution remain unverified.

Current simulator captures, including setup and the four-lesson catalog, are in `ios/AppStore/Screenshots/1.1.2-iPhone-27-beta/` and `ios/AppStore/Screenshots/1.1.2-iPad-26.5/`. Their `Upload/` copies remove unused opaque alpha without changing RGB pixels or dimensions. These current folders are the only screenshots in the 1.1.2 submission-files ZIP. Current results and build logs use `verification/addition-options-ios-*`.
