# Literal ampersands — local preview 3 verification

**3 November 2026 · 1.2.0-preview.3 · no publication or deployment**

Baseline: completed preview 2, local commit `0db325764a191e8e07d130e52efebcbb467d3239`. The [owner correction](../requirements/design/OWNER_AMPERSAND_CONNECTORS_2026-11-03.md) replaces the two header arrows with literal upright ampersands:

`[ First & [ Inside + Outside ] & Last ] = [ Final Answer: #### ]`

Only these two header connections change. Inside and Outside stay separate violet boxes within their outlined middle section, with the plus sign between them. Equals and the Final Answer box remain outside the enclosure. Existing carry-route arrows, colors, fonts, borders, padding, stage actions, lesson order, arithmetic and Practice are preserved. On narrow/enlarged layouts the ampersands stay upright rather than rotating with the stacked groups. Native wide-layout feasibility measures the actual scaled ampersand width.

## Current verification

| Area | Fresh result for preview 3 |
| --- | --- |
| Shared unit suite | **219 passed**, zero failed |
| Browser suite | **84 passed**, zero failed/skipped/flaky |
| Packaged macOS app | **8 passed**, running the final app from its DMG |
| Android signed APK | **13 native cases passed**, plus build/lint/package checks |
| Final ZIP-extracted native iPhone app | **251 focused assertions passed**, executable unchanged |
| Final ZIP-extracted native iPad app | **250 focused assertions passed**, executable unchanged |
| Windows packages | All **72 ZIP files** match installer payload; **7 x64 executable/DLL headers**, four frontend and two shell files verified |

The browser checks verify exactly two `&` symbols, absence of arrows in the header, and unrotated text at **280, 390, 768 and 1280 px**, at **100% and 200% text**. They also cover group containment, full labels, keyboard navigation, direct stage/final selection, carry progression and monochrome Practice. The native Mac test independently checks both glyphs and their transforms while exercising the packaged UI.

The signed Android release APK passed all thirteen native cases, including exactly two upright ampersands in portrait/landscape, unchanged carry arrows, all four Practice configurations and the 862 × 122 keyboard viewport with incorrect-answer feedback. The preview 2 → 3 update retained UID 10236 and a seeded storage marker. The owned emulator was stopped and its host process exited. Full evidence is in [the current Android report](AMPERSAND_STAGES_ANDROID_TEST_RESULTS.md).

The [current native iOS summary](ampersand-stages-ios-summary.json) records normal narrow iPhone/wide iPad and largest accessibility text, actual full words/glyphs, grouping, styles, direct stage/final actions and retained carry arrows/whole values. These current checks use an external simulator-only auditor on the final ZIP-extracted Release app; its library is not shipped and executable bytes remain unchanged. This small revision uses focused checks. The broader **36 Core / 12-case Debug / 558-check Release** suites are preserved **preview 2 historical results**, rather than claimed as fresh reruns. Both task-owned Apple simulators are shut down.

[The cross-package audit](ampersand-stages-cross-platform-packages.json) verifies actual Web ZIP, Mac ZIP/DMG, Windows ZIP/installer and Android APK frontend bytes against the frozen build. Mac signature, DMG checksum, ZIP/APK CRC and Windows installer/payload integrity pass. Windows execution is not claimed.

## Preservation

[The compatibility audit](ampersand-stages-compatibility.json) verifies **42 unchanged files**, including shared/native arithmetic, Practice, carry and pair renderers, generated design resources and all previous requirements. Palette values are identical apart from the preview version field. Normalizing only the header glyph/class/accessibility wording and removal of header rotation reconstructs the previous shared navigation and stylesheet exactly.

The original Inside/Outside digit mapping, random examples, two-digit-only addition, one-/two-/three-digit multiplication, ten-question rounds, automatic submission, immediate progression, live/prior timing, score and min/max/average statistics are preserved. Existing carry arrows still show origin, complete carry and destination.

Preview 3 packages are separate from the retained preview 1/2 and published 1.1.4 files. Public download cards deliberately continue linking to available 1.1.4 files. No GitHub push/release, website deployment, store submission, DNS change or production setting change occurred.

## Representative current screenshots

- [Wide Web header](ampersand-stages-desktop-1280-text100.png)
- [Narrow Web header, manually inspected](ampersand-stages-final-web-narrow.jpeg)
- [Packaged Mac header and unchanged carry arrows](ampersand-stages-macos-header.png)
- [iPhone normal header](../ios/AppStore/Screenshots/1.2.0-preview.3-iPhone-27-beta/01-normal-header.png)
- [iPad wide header](../ios/AppStore/Screenshots/1.2.0-preview.3-iPad-26.5/01-normal-header.png)
- [iPhone largest-text middle group](../ios/AppStore/Screenshots/1.2.0-preview.3-iPhone-27-beta/03-largest-middle.png)
- [iPhone largest-text Last and Final Answer](../ios/AppStore/Screenshots/1.2.0-preview.3-iPhone-27-beta/04-largest-final.png)

## Review files and limits

[AMPERSAND_STAGES_REVIEW.md](../AMPERSAND_STAGES_REVIEW.md) lists current local packages and launch steps. Final web preview: **http://127.0.0.1:5202/**. Previous preview 2 remains separately available at port 5198.

Shared Web/macOS/Windows/Android version is **1.2.0-preview.3**, Android code **10202**. Native Apple version is **1.2.0/build 8**, built with **Xcode 27 beta, 27A5228h**. The Mac is ad hoc signed, Windows is unsigned, and the iOS device archive is unsigned development output rather than an installable IPA. Windows 10/11 runtime execution and physical iPhone/iPad tests remain unverified. Native Apple automation drives UIKit controls/delegates; physical keyboard, external XCUITest and manual VoiceOver coverage are not claimed.
