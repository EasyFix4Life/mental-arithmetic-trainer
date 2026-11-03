# Scholarly visual review — verified local preview

**1.2.0-preview.1**, 3 November 2026. Native UIKit identifies itself as **1.2.0, build 6**. Development branch: `design/scholarly-visuals-2026-11-03`. Baseline: latest published **1.1.4**, commit `a5c5fd58c6e41abb3167b20c626b90bfbdfa1152`.

The preview is prepared for review. It has not been deployed or published. A read-only final audit confirmed that remote main, the latest public release and the live website still serve 1.1.4, with no preview release or external changes. Existing production HTML, including its pre-existing hosting-injected Cloudflare beacon, is unchanged; application JavaScript/CSS match the published 1.1.4 Web ZIP. See [the preservation evidence](visual-review-production-preserved.json).

## Implemented design

- Exact paper **#FAF7F0**, black ink, white fields; Baskerville/scholarly serif text and headings, large Arial mathematics with documented platform fallbacks.
- Learn-only, approximately equal-prominence colors: First **#2D6567**, Inside/Outside **#6C5483**, Last **#7D5723**. Named stages, borders and explicit digit selection remain non-color cues.
- Static brackets connect an existing, unambiguous selected pair. Carry-completion and multi-product groups do not receive invented pairings.
- Carry cards show existing origin → full carried value → destination; the **13** carry is preserved. Developing-answer boxes show only the existing provided result characters.
- Practice has black content/feedback, white controls/answer field and ivory paper. Incorrect timing uses a separate **×** and black border, retaining the numeric time and accessible correctness label. No scoring, input transaction, timer or round behavior changes.
- Responsive Learn layout, enlarged-text reflow, and keyboard-safe Practice fitting. Short landscape viewports keep the problem at the left, previous feedback upper-left, and answer/live timer bottom-right.

The canonical tokens and conventions are in [the visual specification](../design/VISUAL_DESIGN_SPEC.md). Generated CSS, Swift and Android resources passed the same token consistency check. The original owner brief is preserved verbatim under `requirements/design/`.

## Arithmetic and instruction preservation

[The independent compatibility audit](visual-review-arithmetic-compatibility.json) verifies **32 baseline files byte for byte**: 12 TypeScript arithmetic/input/settings/lesson-data modules, shared main/view modules, all four Swift Core files and all 14 original requirement files. The Practice view reconstructs the baseline exactly after removing only the new presentation wrapper/×, two DOM references and three feedback rendering assignments. Existing input, keyboard, clipboard, viewport, focus and live-timer handlers are unchanged.

First → Inside → Outside → Last, the corrected inner/outer references, random examples, fixed 12 × 12/18 × 18 demonstrations, vertical addition, two-digit-only addition choices, ten-problem rounds, scoring and min/max/average timing remain intact. The exhaustive 8,100-pair tests remain part of the unit suite.

## Actual verification

| Environment | Result and scope |
|---|---|
| Shared arithmetic/input | **218 unit tests passed**, zero failures |
| Web browser | **78/78 passed**, zero failed/skipped/flaky; installed Chrome desktop and Chromium iPhone 13 emulation |
| Build/tokens | Canonical three-platform token check, strict TypeScript and Vite production build passed; 46 relevant shared inputs match the tested runner |
| Responsive/text | Widths 280/390/768/1024 px with enlarged text, plus focused carry cards at 280/390 px and **200% text**; complete words and whole carry values remain readable |
| Short web keyboard proxy | **862 × 122** visible viewport and a 122px visual/400px layout viewport case; problem, wrong × feedback, answer and timer are visible and separate; typing/submission preserved |
| Final macOS DMG | **7 native scenarios passed** from the final read-only mounted DMG, including exact 82 × 76 refs, stage colors/bracket paths, carry routes, all four Practice configurations, timing and monochrome feedback |
| macOS package | ZIP CRC, ZIP/DMG application-archive equality and deep/strict ad hoc signature passed; four production frontend and two desktop-shell files byte-match; task-owned DMG ejected |
| Windows package | Final x64 installer/ZIP built; ZIP/NSIS/payload checks passed; all **72 application/runtime files** agree, all **7 executable/DLL headers** are x64; four frontend/two shell files match |
| Android 17/API 37 | Final signed APK build/lint/signature/alignment/CRC passed; **12/12 native cases passed**; 21 native inputs and all four frontend files match |
| Android direct upgrade | Fresh actual public 1.1.4 → final preview retained UID **10236** and DOM-storage marker; actual landscape software-keyboard viewport **862 × 122** includes wrong × feedback and all four nonoverlapping regions |
| Swift core | **36 passed**; all four mathematical Core files unchanged |
| Native UIKit Debug | iPhone/iOS 27: **11/11 passed**; iPad/iPadOS 26.5: **10 passed, 1 existing programmatic rotation scenario skipped** |
| Final ZIP-extracted iOS Release | **260 assertions passed on each iPhone/iPad simulator**, installed executable unchanged; includes palette, complete brackets, carry routes, original practice behavior and Privacy version |
| iOS builds | Debug simulator, Release simulator and unsigned device archive built successfully using **Xcode 27 beta, 27A5228h**; all 29 native inputs match |

The native iPhone scenarios include actual keyboard-aware landscape layout and largest accessibility text, with the equation, previous feedback, answer and timer separate. Native Learn header/catalog/stage controls reflow at accessibility sizes. Native segmented-control choice text is capped at 24pt to retain its single-line interaction; surrounding text scales and scrolls. Both owned iOS simulators and the owned Android emulator were shut down after verification.

The actual packaged iOS Release audit uses a separate simulator-only library to drive UIKit controls and text-field delegates. The audit library is not shipped, and packaged/installed executable hashes match. These are not physical-device, physical-keyboard or external XCUITest results.

Windows 10/11 execution, installation and scaling remain unverified because no Windows runtime is available. Android runtime coverage is the stated API 37 emulator, not every supported Android version. iOS device archives remain unsigned development files; no signed IPA, TestFlight or App Store upload occurred. macOS remains ad hoc signed and not notarized.

## Iteration records

Development checks found and fixed narrow/enlarged-text overflow, a real Android landscape keyboard overlap, native iPhone accessibility/keyboard overlap caused by fitting against different font metrics/layout timing, and a native iPad bracket drawn before child layout. Final checks and screenshots cover the corrected builds. The first Android border assertion was adjusted for measured device-pixel quantization of the same declared 2px stroke; it was not relaxed to accept a different color or unequal stage weight. A missing temporary Gradle JAR was restored from the pinned, checksum-verified distribution. Initial development evidence is labeled separately and is not presented as final package success.

## Review and screenshots

The final static web preview runs locally at **http://127.0.0.1:5196/**. The independent manual browser check used the final built assets, confirmed an incorrect-first round scored **9 / 10**, verified the violet inner/outer pairs, and checked the incoming 6/outgoing 2 routes. [Manual verification](visual-review-web-manual.json).

| View | Evidence |
|---|---|
| Web Inside bracket | [Screenshot](visual-review-web-inside.png) |
| Web carry routes | [Screenshot](visual-review-web-carries.png) |
| Web monochrome Practice | [Screenshot](visual-review-web-practice.png) |
| Shared mobile Learn | [Screenshot](scholarly-mobile-inside.png) |
| Enlarged mobile carry routes | [Evidence and viewport screenshots](scholarly-carry-text-200/verification.json) |
| Final Mac Learn / carries | [Inside](visual-review-macos-Inside.png), [carry card](visual-review-macos-carry.png) |
| Final Mac Practice | [Screenshot](visual-review-macos-monochrome.png) |
| Android native views | Raw files under `visual-review-android-runtime/`; [Android report](VISUAL_REVIEW_ANDROID_TEST_RESULTS.md) |
| iPhone native | [Inside](../ios/AppStore/Screenshots/1.2.0-preview.1-iPhone-27-beta/09-corrected-inside.png), [Practice](../ios/AppStore/Screenshots/1.2.0-preview.1-iPhone-27-beta/12-monochrome-incorrect-feedback.png), [enlarged Practice](../ios/AppStore/Screenshots/1.2.0-preview.1-iPhone-27-beta/15-enlarged-practice.png) |
| iPad native | [Complete carry route](../ios/AppStore/Screenshots/1.2.0-preview.1-iPad-26.5/11-static-carry-route.png) |

Native iOS preparation includes **30 raw captures and 30 opaque review copies**, whose decoded RGB values are preserved. The user-facing preview packages, source archive and checksums are supplied separately in the parent outputs folder. Source/package checksum and local commit verification are recorded outside the frozen source archive.

Raw summaries: [shared](scholarly-shared-summary.json), [Mac](visual-review-macos-results.json), [Mac package](visual-review-mac-package.json), [Windows](visual-review-windows-artifacts.json), [iOS](scholarly-ios-summary.json). Original release 1.1.4 evidence remains historical and unchanged.
