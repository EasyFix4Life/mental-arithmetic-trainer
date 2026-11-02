# iOS lesson-help button verification — 1.1.1 (build 2)

Verified on November 2, 2026 with the installed, owner-requested Xcode beta: **Xcode 27.0, build 27A5228h**, at `/Applications/Xcode-beta.app/Contents/Developer`.

The native Learn button now displays **Click Here to Learn How!** beside a large circled question-mark icon. It uses a bold 20-point Arial title, a 30-point question symbol, a highlighted sepia background, a two-point border and a minimum 64-point touch target. The button fills the available content width and sits above the arithmetic expression, following New random example. It can wrap its title instead of squeezing the operands. All six lessons use the same control.

The stable `lesson-help` identifier and the existing learner-controlled walkthrough behavior remain. Its accessible name contains the exact visible wording and its hint explains that it opens the lesson walkthrough. The arithmetic, carries, Practice input policy, timing and score behavior were not changed.

## Fresh verification

| Check | Actual result |
| --- | --- |
| Native Debug simulator build | Passed |
| Native UIKit integration on iPhone / iOS 26.5 | **8 passed, 0 skipped**, 131 assertions |
| Native UIKit integration on iPad / iPadOS 26.5 | **7 passed, 1 skipped**, 126 assertions |
| Generic arm64 iOS Release archive | Passed; unsigned |
| Release simulator app build | Passed; unsigned |
| Release package version | **1.1.1**, build **2** |
| Requested phrase and question symbol in actual Release binary | Verified |
| DEBUG review harness and test bundles absent from Release | Verified |
| ZIP integrity and SHA-256 | Recorded in `help-button-ios-artifacts.json` |

The existing eight native scenarios verify Practice submission, rejection, score and timing; all six Practice configurations; the confirmed carry trace; random examples across all six Learn categories; keyboard/rotation behavior; local Privacy; three-digit multiplication; and all six complete walkthroughs. The Learn checks now also verify the requested button wording, matching accessible name, question icon, minimum height, available width, horizontal screen bounds and a title that fits without clipping. These are **42 additional button checks** across the six lesson pages.

The iPad rotation scenario remains explicitly skipped because the simulator did not apply the programmatic orientation request. This is not counted as a pass. No physical iPhone/iPad run or new Xcode-hosted XCTest/XCUITest run is claimed. The fresh checks use the actual Debug UIKit app, control actions and the production text-field delegate through the existing DEBUG-only integration harness. The separate external UI test source includes the updated button assertions for future execution.

## Visual review

Both before-open screenshots were inspected. The complete phrase and large question mark are clear, the operands remain separate and readable, and the control does not extend beyond the available width:

- [iPhone lesson-help preview](help-button-ios/iphone26/07-prominent-learn-help.png), 1206 × 2622.
- [iPad lesson-help preview](help-button-ios/ipad26/07-prominent-learn-help.png), 2064 × 2752.

The raw captures, complete scenario reports and other regression screenshots are in `help-button-ios/`. Machine-readable results are `help-button-ios-iphone26.json` and `help-button-ios-ipad26.json`. Build logs use the `help-button-ios-` prefix. Prior release evidence remains unchanged.

## Deliverables and scope

The device archive and Release simulator app are copied to the parent outputs folder as `Mental-Arithmetic-1.1.1-iOS-unsigned-archive.zip` and `Mental-Arithmetic-1.1.1-iOS-Simulator-app.zip`. The device archive declares iOS/iPadOS 17.0 minimum and both iPhone and iPad device families. The Release binary includes the requested title and icon while excluding the DEBUG review runner and its environment entry point.

The archive remains unsigned. This patch does not create a signed IPA, assign a development team, install on a physical device, or submit to App Store Connect. Signing and distribution decisions remain separate from this local UI update.
