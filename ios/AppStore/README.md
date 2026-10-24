# App Store submission draft

Prepared locally on 24 October 2026. No App Store Connect submission or public store publication has been made. These preparation files may be included in the owner-authorized private GitHub repository. The owner has asked to prepare the app and submission files before enrolling in the Apple Developer Program.

This is a native iPhone and iPad application. It contains local arithmetic generation, answer entry, timing, and lesson presentation; it does not load the website in a browser or require a server.

## Completion gates

1. Review the implemented instructions for **all six** combinations of addition/multiplication with one-, two-, and three-digit operands. The owner requested the vertical addition layout. The implemented procedures follow the owner-described common method; three-digit multiplication follows the owner-described five-group method. The 12 × 12 and 18 × 18 demonstrations preserve the individually confirmed two-digit procedure. Generated instructional examples are derived applications of those descriptions, rather than individually owner-confirmed scripts. This review is a publication step and does not prevent local delivery of the prepared app.
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

Native verification is complete within the recorded local scope: 34 portable core XCTest cases passed on macOS; the actual UIKit simulator integration passed eight scenarios on each iPhone runtime and seven on iPad, with iPad rotation explicitly skipped. Xcode-hosted XCTest/XCUITest could not start its local test service. See `../../verification/IOS_TEST_RESULTS.md` for the precise evidence and limits.

The screenshot folders contain raw native captures plus **`Upload/`** copies without an alpha channel. Use the `Upload/` copies for eventual App Store owner review. The AppKit format helper preserves every decoded RGB sample and verifies the original alpha channel is entirely opaque; it does not redraw or resize the app. Manifests record both hashes and dimensions. `run_simulator_review.py` reproduces the Debug-only native review route, while `prepare_upload_screenshots.py` reproduces the format conversion. The separate `export_screenshots.py` can export XCUITest attachments when the external test service is available. None of these assets have been uploaded.

No purchase, subscription, advertising, account, cloud synchronization, social feed, or external lesson service is implemented. Do not claim these in the listing.
