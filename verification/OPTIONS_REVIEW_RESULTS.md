# Current Learn and Practice options — preview 4 verification

**3 November 2026 · 1.2.0-preview.4 · local review only**

Baseline: completed ampersand preview 3, local commit `e54135d691f37dfce8e38c60e59f0fd3d9525007`. This revision applies the owner's [mode-option request](../requirements/design/OWNER_APP_OPTIONS_2026-11-03.md).

## Current stock

| Mode | Offered configurations | Default |
| --- | --- | --- |
| Learn | **1-digit × 1-digit**, **2-digit × 2-digit** | 1-digit multiplication |
| Practice | **2-digit + 2-digit**, **1-digit × 1-digit**, **2-digit × 2-digit** | 2-digit addition |

Addition has no Learn entry. Three-digit multiplication is absent from both modes. Two-digit addition was already available in preview 3 Practice and is explicitly retained and verified here. The app uses separate Learn and Practice availability policies, so removing addition instruction does not remove addition exercises. Invalid old three-digit multiplication settings normalize within the selected operation; valid settings are retained. Historical arithmetic engines, source lessons and original fixtures remain preserved for verification and future development.

## Fresh verification

| Area | Current result |
| --- | --- |
| Shared unit suite | **221 passed** |
| Browser suite | **82 passed**, zero failed/skipped/flaky in the final complete run |
| Final packaged macOS app | **8 passed**, running from the final mounted DMG |
| Signed Android release APK | **13 native cases passed**, plus build, lint, alignment, signing and integrity checks |
| Portable Swift core | **38 tests passed** |
| Final ZIP-extracted iPhone Release app | **552 assertions passed**, executable unchanged |
| Final ZIP-extracted iPad Release app | **552 assertions passed**, executable unchanged |
| Windows packages | **72 ZIP files** match installer payload; **7 x64 executable/DLL headers**, four frontend and two shell files verified |

The updated browser and native checks verify exact mode menus/defaults, absence of all addition Learn entries and three-digit multiplication, preserved one-/two-digit multiplication instruction, random examples, confirmed examples, corrected Inside/Outside mapping, two upright ampersands, carry routes and enlarged/narrow layouts. Practice checks exercise the three remaining configurations, expected-digit automatic submission, immediate progression, ten unique problems, scoring, min/max/average times and retained keyboard layout.

The Android update from actual preview 3 to preview 4 retained UID **10236** and a seeded storage marker. Its seeded **58 + 67** case retained partial **12**, automatically accepted **125**, then completed ten unique answers at **10 / 10**. The three offered Practice configurations completed **30 / 30** correct answers. The keyboard, wrong-answer feedback and complete carry **13** cases also pass. See [the Android report](OPTIONS_REVIEW_ANDROID_TEST_RESULTS.md).

Native Apple checks run against the final ZIP-extracted Release app, using a separate simulator-only auditor that is not shipped. All 30 native inputs match the healthy build mirror; packaged and installed executable hashes agree. Current checks cover both Learn options, all three Practice configurations and complete rounds, A2 score/timing/input, mode switching, current visuals and full text. The updated Debug unit/UI test targets compile; a new Debug runtime suite is not claimed. Both owned Apple simulators and the Android emulator were shut down. See [the native Apple summary](options-review-ios-summary.json).

A separate manual browser check at **http://127.0.0.1:5206/** verified the exact menus, first Learn lesson and all ten two-digit operand pairs in an addition round. All ten answers submitted without Enter; the UI showed **10 / 10** and minimum/maximum/average timing. [The saved review record](options-review-manual-browser.json) contains the visible operands, menu values and result.

The first new browser addition fixture used independent Learn-style random draws. Practice samples unordered pair ranks; correcting only the test setup to that existing sampler produced the intended 58/67 case. The focused check and final complete 82-case suite passed. No product generation algorithm changed for this test correction.

## Preservation and packages

Availability tables/catalog filters/defaults and their validation message change; mathematical methods and arithmetic algorithms do not. Source comparisons verify retained engine/input/timer/carry/pair-renderer code and historical fixtures, including exact algorithm bodies outside the intended native availability blocks. The native compatibility record is [here](options-review-ios-compatibility.json). The current palettes, typography, ampersands, Practice feedback and manual-round behavior are preserved.

[The cross-platform package audit](options-review-cross-platform-packages.json) compares actual Web/Mac/Windows frontend bytes with Android and the frozen source build. Mac ZIP/DMG app archives match, the ad hoc signature and DMG checksum verify, and Windows ZIP/installer integrity passes. The delivered packages identify preview 4, Android code **10203**, or native Apple **1.2.0/build 9**. Earlier packages and original requirements remain intact.

## Representative current captures

- [Manual Web Learn catalog](options-review-manual-catalog.jpeg)
- [Manual Web completed A2 round](options-review-manual-addition-result.jpeg)
- [Packaged Mac multiplication lesson](options-review-macos-header.png)
- [iPhone Learn catalog](../ios/AppStore/Screenshots/1.2.0-preview.4-iPhone-27-beta/04-catalog.png)
- [iPad Learn catalog](../ios/AppStore/Screenshots/1.2.0-preview.4-iPad-26.5/04-catalog.png)
- [iPhone Practice multiplication choices](../ios/AppStore/Screenshots/1.2.0-preview.4-iPhone-27-beta/02-multiplication-settings.png)
- [iPhone A2 score and timing](../ios/AppStore/Screenshots/1.2.0-preview.4-iPhone-27-beta/03-addition-results.png)

## Review boundary and remaining limits

[OPTIONS_REVIEW.md](../OPTIONS_REVIEW.md) contains the current inventory, launch steps and local package names. The new web preview is **http://127.0.0.1:5206/**; preview 3 remains separately available at port 5202.

No website deployment, GitHub push/release, store submission, DNS change or production setting change occurred. Published 1.1.4 and public download-card links retain their earlier offerings; this options revision is local preview software for taking stock.

Windows 10/11 runtime installation/rendering remains unverified. Native Apple testing uses simulators and UIKit control/delegate automation, not physical-device, external XCUITest or manual VoiceOver testing. Apple builds use the requested Xcode beta. The device archive is unsigned development output, not an installable IPA; Mac remains ad hoc signed and Windows unsigned.
