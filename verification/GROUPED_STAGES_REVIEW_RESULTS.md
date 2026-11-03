# Grouped instructional stages — verified local review

**3 November 2026 · 1.2.0-preview.2 · local review only**

This update starts from completed scholarly preview 1, commit `f01c38aa8f14ea6f752db9a4c37ed94e3ffd0969`, which preserves the published 1.1.4 arithmetic and lesson behavior. The follow-up [owner specification](../requirements/design/OWNER_GROUPED_STAGE_LAYOUT_2026-11-03.md) changes the presentation of the existing named multiplication stages.

## Implemented interface

`[ First → [ Inside + Outside ] → Last ] = [ Final Answer: #### ]`

First, the middle group and Last sit inside one restrained outline. Inside and Outside remain **separate buttons** inside the middle outline, with a visible plus sign between them. The equals sign and completed **Final Answer** box sit **outside** the outer outline. Arrows are visual connections, not additional multiplication operations. The final answer control remains interactive; its selection and Back/Next behavior are preserved.

All four named boxes use bold type, equal 2-unit borders and matching padding. Selected state uses an underline, preserving a cue beyond color without changing weight or border thickness. The shared palette is generated for Web, desktop, Android and native Swift from one canonical token file:

| Stage | Text/border | Light fill | Text/fill contrast |
| --- | --- | --- | --- |
| First | `#126C70` | `#E2F1EF` | 5.31:1 |
| Inside and Outside | `#755093` | `#EEE5F4` | 5.16:1 |
| Last | `#885A15` | `#F6ECD8` | 5.09:1 |

The background remains `#FAF7F0`. Scholarly text, large Arial/fallback mathematical numerals, static digit-pair connections, explicit carry origins/destinations and developing answer slots remain intact. Numbered lessons retain their existing navigation rather than acquiring invented four-stage names. Practice receives no instructional colors.

## Completed checks

| Area | Actual result |
| --- | --- |
| Shared arithmetic/input/design tests | **219 passed**, zero failed |
| Browser suite | **84 passed**, zero failed, skipped or flaky |
| macOS packaged app | **8 passed**, running the final app mounted from the new DMG |
| Android signed release APK | **13 passed**, actual native acceptance on Android 17/API 37 emulator |
| Native Swift arithmetic suite | **36 passed** |
| Native iOS/iPadOS UIKit acceptance | iPhone **12 passed**; iPad **11 passed, 1 simulator rotation case skipped** |
| Final ZIP-extracted iOS Release app | **558 checks passed on each** of iPhone and iPad; executable remained unchanged |
| Windows x64 packages | ZIP integrity; all **72** archive files match the installer payload; **7** executable/DLL headers; four frontend and two shell files verified |
| Build consistency | Generated token check, TypeScript check and production frontend build passed; shared bundle bytes match Web/Mac/Windows/Android packages |

Browser checks use installed Google Chrome and Chromium mobile emulation. Responsive coverage includes widths **280, 390, 768 and 1280**, at **100% and 200% text scale**. Named stage words remain readable without splitting into letters; the middle pair stays within its group; arrows and equals retain their relationship as the layout stacks. Keyboard focus order stays First, Inside, Outside, Last, Final Answer; direct activation, Next/Back and selected-state cues are checked.

The final local browser preview at **http://127.0.0.1:5198/** was also manually reviewed. Inside/Outside digit references, 18 × 18 carry resolution, final answer 324 at 7/7 and Back to 6/7 were checked through the visible controls. The automated suites additionally verify **82 × 76** and **98 × 87**, avoiding reliance on symmetric examples.

Android verifies the original signed preview 1 → preview 2 update path, retained application identity/certificate/UID and a seeded storage marker after cold relaunch. It checks the grouped header in portrait and landscape, all four Practice configurations, ten-answer statistics, native numeric keyboard and the short **862 × 122** landscape keyboard viewport. Question, answer entry, live timer and prior incorrect feedback remain visible and separate. The owned emulator was stopped afterward. Full results and recorded development events are in [GROUPED_STAGES_ANDROID_TEST_RESULTS.md](GROUPED_STAGES_ANDROID_TEST_RESULTS.md).

The Mac ZIP and DMG contain identical app archives. The DMG checksum, ZIP CRC and ad hoc code signature verify; the packaged frontend and shell bytes match the tested inputs. The task-owned DMG was ejected after verification.

## Native iPhone and iPad verification

The native Swift arithmetic suite passed **36 checks**. Current UIKit acceptance passed **12/12** on iPhone and **11/12** on iPad; the existing simulator rotation-request case is skipped on iPad. The grouped control case checks all four direct stage actions, enclosure/middle membership, separate Final Answer, caption case, Arial result digits, matching fills/weights/padding/strokes, logical action order and enlarged-text wrapping. Practice source and all four Core files remain byte-identical to preview 1.

Native layout measures all four scaled stage words, shared padding, group margins, symbols and the full Final Answer caption before choosing a horizontal row. It stacks when the row would not fit; the middle pair can independently stack around its plus sign. Decorative symbols can stretch without forcing the lesson width to shrink. Named buttons retain whole-word minimum widths, while the walkthrough heading adapts to keep its long words intact. Normal and largest-accessibility text states verify real drawn glyph visibility and whole words, in addition to frame/containment/style checks. No arithmetic or Practice implementation changed.

The **final ZIP-extracted Release app** passed **558 checks on each device**, with its executable bytes unchanged before and after inspection. These checks cover all four direct stage choices, Next/Back and carries, the complete Final Answer caption with Arial digits, enclosure membership/order/styles, normal and largest-accessibility text, and **50 accepted Practice answers per device**, including keyboard geometry, preserved input/timers, scoring and statistics. Current captures include 20 phone and 20 tablet images, with both ordinary and enlarged-text grouped layouts. Exact device/build details, archive hashes and source comparisons are recorded in [the native iOS summary](grouped-stages-ios-summary.json).


## Preservation evidence

[The compatibility audit](grouped-stages-compatibility.json) verifies **36** files byte-identical to preview 1: twelve shared engine/input/settings/lesson-data modules, two mode-orchestration modules, Practice view, carry renderer, digit-pair renderer, four iOS Core files and fifteen original requirement files. Applicable original engine and requirement inputs also match published 1.1.4. All **54** Practice/global CSS rules, including the prior landscape keyboard fix, remain unchanged after whitespace normalization.

The confirmed digit mapping remains First = left0/right0, Inside = left1/right0, Outside = left0/right1, Last = left1/right1. Arithmetic generation, carrying, lesson progression, expected-length submission, immediate advancement, score out of ten, raw answer times, min/max/average statistics and manual round starts are unchanged. Two-digit addition remains the only addition choice; multiplication retains one, two and three digits in Learn and Practice.

The public website, GitHub main commit `a5c5fd58c6e41abb3167b20c626b90bfbdfa1152`, latest release **v1.1.4** and its app downloads were checked read-only and remain intact. [The recorded audit](grouped-stages-production-preserved.json) verifies the served JavaScript/CSS/HTML against the prior published hashes and confirms no preview release exists. No preview deployment, remote push, GitHub release, store submission, DNS change or production setting change occurred. Earlier packages, screenshots and original requirement files are preserved.

## Representative screenshots

These are actual captures from the tested preview:

- [Web — grouped header and Inside pairing](grouped-stages-final-web-learn.jpeg)
- [macOS — grouped header](grouped-stages-macos-header.png)
- [macOS — carry route](grouped-stages-macos-carry.png)
- [macOS — monochrome Practice](grouped-stages-macos-monochrome.png)
- [Android — responsive grouped header](grouped-stages-android-runtime/preview2-native-acceptance/android-grouped-stages-portrait.png)
- [Android — incorrect Practice feedback](grouped-stages-android-runtime/preview2-native-acceptance/android-practice-monochrome-incorrect.png)
- [Android — short landscape keyboard](grouped-stages-android-runtime/preview2-native-acceptance/android-practice-landscape-keyboard-feedback.png)

- [iPhone — stacked stage enclosure](../ios/AppStore/Screenshots/1.2.0-preview.2-iPhone-27-beta/09-corrected-inside.png)
- [iPad — wide grouped header](../ios/AppStore/Screenshots/1.2.0-preview.2-iPad-26.5/09-corrected-inside.png)
- [iPhone — largest-text Inside + Outside](../ios/AppStore/Screenshots/1.2.0-preview.2-iPhone-27-beta/19-enlarged-middle-group.png)
- [iPhone — largest-text Last and separate Final Answer](../ios/AppStore/Screenshots/1.2.0-preview.2-iPhone-27-beta/20-enlarged-final-box.png)

## Review packages and limits

The local packages and launch steps are listed in [GROUPED_STAGES_REVIEW.md](../GROUPED_STAGES_REVIEW.md). Preview2 filenames are distinct from the preserved preview1 and public 1.1.4 packages. The source archive contains all baseline source and requirements plus the selected new implementation, tests, guides and verification records; it excludes dependency/build caches and private signing material.

Native iOS acceptance drives UIKit controls and text-field delegates in simulators; it does not establish physical keyboard, external XCUITest or manual VoiceOver coverage. The existing iPad programmatic rotation request is explicitly skipped.

Windows installation, rendering, keyboard behavior and display scaling have **not** been exercised on a Windows host in this review. Windows package integrity and shared frontend equivalence are verified. Browser mobile emulation and Android/iOS simulators do not establish physical-device coverage. The Mac app is ad hoc signed; Windows is unsigned; the iOS device archive is unsigned development output requiring the owner's team/signing for device distribution. No physical iPhone/iPad testing or App Store acceptance is claimed.

Raw evidence uses the new `grouped-stages-*` prefix. Earlier `visual-review-*` and `scholarly-*` evidence remains available for comparison.
