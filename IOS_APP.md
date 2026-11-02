# iPhone and iPad app — 1.1.1

**1.1.1 interface update:** the lesson-help button now reads **? Click Here to Learn How!**. See [the update report](verification/HELP_BUTTON_UPDATE.md) for current checks and screenshots. Prior detailed verification reports remain as the 1.1.0 baseline.

The iOS app is a native Swift/UIKit application in `ios/MentalArithmetic.xcodeproj`. It uses Arial numerals, the existing sepia presentation, all six instructional categories with random examples, stacked addition, and ten-question Practice with automatic submission and minimum/maximum/average timing. It runs offline and contains no WebView, third-party SDK, account, analytics or network service. The minimum deployment target is iOS/iPadOS 17.0.

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

- `Mental-Arithmetic-1.1.1-iOS-unsigned-archive.zip`: successful generic iOS Release archive, arm64, including the native app and archive metadata. Extract it before opening the `.xcarchive` in Xcode Organizer. This is **not a signed IPA** and cannot be installed directly on a physical iPhone.
- `Mental-Arithmetic-1.1.1-iOS-Simulator-app.zip`: Release simulator app, for an Apple silicon Mac with an appropriate simulator runtime. This cannot be installed on a physical iPhone.
- `Mental-Arithmetic-1.1.1-all-platforms-source.zip`: complete editable source, Xcode project, original supplied requirements, tests, guides and submission drafts.
- `Mental-Arithmetic-1.1.1-iOS-submission-files.zip`: prepared App Store metadata, privacy/rating drafts, reviewer notes, icon and genuine simulator screenshots where included in the screenshot manifest.

The device archive has no development team or signing identity assigned. The provisional bundle identifier is `local.jeff.mentalarithmetic`; replace it with an identifier registered to your team before distribution. Version is **1.1.1**, build **2**.

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
