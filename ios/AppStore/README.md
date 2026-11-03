# iOS development-download preparation — 1.2.0

**Native version 1.2.0, build 10 · 3 November 2026.** Prepared for the owner-authorized GitHub 1.2.0 release and website download list. This is development software, not a signed installable IPA, App Store release or TestFlight build. No Apple Store upload or submission occurred. Apple Developer membership and signing are still unavailable.

The app matches approved preview 4 exactly: Learn offers M1/M2, Practice offers A2/M1/M2, and the grouped ampersand header, carries, random examples, timing and input behavior are preserved. Current final-package proof uses `../../verification/release-120-ios-*`; screenshots including the build 10 Privacy version display are in `Screenshots/1.2.0-build10-*`. See `../../IOS_APP.md` for package types, local launch/build instructions and verification limits. Prior release/preview preparation notes follow as historical context.

# App Store submission draft

Updated locally for version **1.1.4, build 5** on 2 November 2026. No App Store Connect submission or public store publication has been made. These preparation files may be included in the owner-authorized GitHub repository. The owner has asked to prepare the app and submission files before enrolling in the Apple Developer Program.

This is a native iPhone and iPad application. It contains local arithmetic generation, answer entry, timing, and lesson presentation; it does not load the website in a browser or require a server.

## Completion gates

1. Review the implemented instructions for **four available categories**: two-digit addition and single-, two-, and three-digit multiplication. The owner requested the vertical addition layout. The implemented procedures follow the owner-described common method; three-digit multiplication follows the owner-described five-group method. The 12 × 12 and 18 × 18 demonstrations preserve the individually confirmed two-digit procedure. Generated instructional examples are derived applications of those descriptions, rather than individually owner-confirmed scripts. This review is a publication step and does not prevent local delivery of the prepared app.
2. Enroll in the Apple Developer Program. Select the legal seller/developer identity and an available app name, register the permanent bundle identifier, and configure the development team and distribution signing. No team identity or signing certificate is supplied in this package.
3. Supply an app support URL, a public privacy policy URL, the support contact, review contact details, copyright owner, territories, and pricing. `metadata.en-US.json` keeps these missing values as `null`.
4. Build and archive with an Xcode/SDK release currently accepted by App Store Connect. Local verification uses the installed Xcode 27 beta; successful simulator testing or an unsigned archive does not establish App Store acceptance.
5. Test on a real iPhone and iPad, finish accessibility evaluation and the age-rating questionnaire, confirm privacy disclosures, and upload the signed build to TestFlight for review. App Review approval is Apple's decision.
6. Review the final screenshots after the public metadata is complete. Files in `Screenshots/` are actual simulator captures for review. Refresh captures if the reviewed content changes.

The current official requirements should be checked again immediately before submission: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/), and [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).

## Files

- `metadata.en-US.json`: draft localizable listing and unresolved account fields.
- `REVIEW_NOTES.md`: reviewer workflow and exact automatic-submission behavior.
- `PRIVACY_POLICY_DRAFT.md`: policy text based on this application's present local-only implementation. Add the responsible person's identity and contact details, then publish it at the owner's chosen URL.
- `PRIVACY_AND_RATING_DRAFT.json`: proposed disclosure responses, which must be checked against the final binary and App Store Connect questionnaire.
- `Screenshots/`: captured native screens and screenshot manifest once UI verification is complete.

The historical 1.1.0 verification recorded 34 portable core XCTest cases passed on macOS; the actual UIKit simulator integration passed eight scenarios on each iPhone runtime and seven on iPad, with iPad rotation explicitly skipped. Xcode-hosted XCTest/XCUITest could not start its local test service. See `../../verification/IOS_TEST_RESULTS.md` for the precise evidence and limits.

The historical screenshot folders contain raw native captures plus **`Upload/`** copies without an alpha channel. Use the `Upload/` copies for eventual App Store owner review. The AppKit format helper preserves every decoded RGB sample and verifies the original alpha channel is entirely opaque; it does not redraw or resize the app. Manifests record both hashes and dimensions. `run_simulator_review.py` reproduces the Debug-only native review route, while `prepare_upload_screenshots.py` reproduces the format conversion. The separate `export_screenshots.py` can export XCUITest attachments when the external test service is available. None of these assets have been uploaded.

No purchase, subscription, advertising, account, cloud synchronization, social feed, or external lesson service is implemented. Do not claim these in the listing.

Version 1.1.2 removes single- and three-digit addition from both Learn and Practice. Current simulator review assets are in the `Screenshots/1.1.4-*` folders, with matching `verification/inside-outside-ios-*` reports. Only the 1.1.4 screenshot folders are included in the current submission-files ZIP; earlier folders remain historical evidence. These files are prepared for review and have not been uploaded.

For 1.1.2, 35 portable Swift core tests pass. The DEBUG UIKit review passes 8/8 iPhone scenarios and 7/8 iPad scenarios; iPad programmatic rotation is explicitly skipped. Test targets compile, but Xcode-hosted execution remains blocked by the local DTServiceHub connection failure. See `../../verification/addition-options-ios-summary.json` and `../../IOS_APP.md` for historical evidence and limits.

The historical 1.1.3 refresh independently audited the public 1.1.2 simulator package. Version 1.1.4 packaged Release verification is recorded in `../../verification/inside-outside-ios-summary.json`. The existing Privacy sheet displays the installed version and build. The external simulator-only audit library drives packaged UIKit controls without changing the app executable; it is not physical keyboard or external XCUITest input.

Version 1.1.4 corrects two-digit multiplication stage naming everywhere: Inside selects the inner digits (left units and right tens); Outside selects the outer digits (left tens and right units). For 82 × 76, Inside is 2 × 7 = 14 and Outside is 8 × 6 = 48, combining as 14 + 48 = 62. Fixed 12 × 12 and 18 × 18 examples use the same corrected digit selections. Arithmetic, carry steps, available lessons and timed Practice are preserved. Current verification: `../../verification/inside-outside-ios-summary.json`.
