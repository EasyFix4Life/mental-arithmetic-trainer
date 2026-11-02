# Mental Arithmetic 1.1.4 — Inside/Outside correction

The owner's Android screenshots exposed reversed Inside/Outside instructions in the 1.1.3 two-digit multiplication walkthrough. The same source was used by the web, macOS, Windows and Android frontends; the native iOS implementation carried the same mapping.

## Corrected instruction

For horizontal `ab × cd`, **Inside** selects `b × c` (the inner digits), and **Outside** selects `a × d` (the outer digits). The Outside screen combines the two products in Inside-then-Outside order. The names and order remain **First → Inside → Outside → Last → Final answer**.

| Step for 82 × 76 | Calculation |
|---|---|
| First | 8 × 7 = 56 |
| Inside | 2 × 7 = 14 |
| Outside | 8 × 6 = 48; 14 + 48 = 62 |
| Last | 2 × 6 = 12 |
| Carry into middle | 62 + 1 = 63 |
| Carry into First | 56 + 6 = 62 |
| Final answer | 6232 |

The active random generator and fixed 12 × 12 / 18 × 18 traces are corrected in both TypeScript and Swift. Operand highlights, operation text, intermediate results, narration and accessible descriptions agree. Original supplied requirements and historical intake remain unchanged; [the current owner correction](../requirements/instruction/OWNER_INSIDE_OUTSIDE_CORRECTION_2026-11-02.md) records what supersedes the old mapping.

Practice input, ten-problem scoring, random problems, timing summaries and the available categories remain unchanged: two-digit addition and one-, two- and three-digit multiplication. Three-digit multiplication uses its existing numbered groups rather than Inside/Outside stage names.

## Verification

- **Shared arithmetic/input:** 215 unit tests passed. The corrected inner/outer mapping, complete product and carries are checked for all 8,100 pairs from 10 through 99, including unequal cross-products and zero/carry regressions.
- **Browser:** 68 checks passed with no failed/skipped/flaky cases, using installed Chrome and Chromium iPhone 13 emulation. Strict TypeScript and Vite production build passed. The final runner was frozen during this complete run.
- **macOS:** Six native checks passed from the final, read-only mounted 1.1.4 DMG. The exact 82 × 76 Inside and Outside highlights, calculation text, middle sum and final answer passed. ZIP CRC, identical ZIP/DMG application archive, deep/strict ad hoc signature and all four production frontend/two desktop-shell files passed verification. The task-owned DMG was then ejected.
- **Windows:** Installer and ZIP built; ZIP/NSIS/payload integrity passed. All 72 application/runtime files agree between ZIP and installer; all seven application executable/DLL headers are x64. The four production frontend files and two shell files byte-match the tested build. No Windows runtime is available on this Mac; Windows 10/11 execution remains unverified.
- **Android:** Signed 1.1.4 APK build, release lint, archive/alignment/signature inspection and ten native acceptance cases passed on Android 17/API 37. The actual public 1.1.3 APK was upgraded in place to the new APK: application UID and a WebView storage marker were preserved. The new 82 × 76 check verifies both highlighted digit pairs, the two products, 14 + 48 = 62 and final answer 6232. No release signing identity, shell access or network policy changed.
- **iOS:** 36 portable Swift tests passed, including all 8,100 products and corrected fixed traces. Debug UIKit scenarios passed 9/9 on iPhone and 8/9 on iPad, with the existing programmatic rotation scenario explicitly skipped. Final ZIP-extracted Release software passed 242 assertions on each iPhone/iPad simulator, including the inner/outer digit descriptions, calculations/narration and forty Practice answers across all four choices. The packaged executable was unchanged; a separate simulator-only verification library drove UIKit controls and text-field delegates and is not shipped. All 26 native input files hash-match the build mirror. Release simulator and unsigned device archive builds passed with Xcode 27 beta. Both task-owned simulators were shut down. Physical devices, physical keyboard input and external XCUITest execution are not claimed.

Raw records use the `inside-outside-` prefix. Source reports retain initial environment/test-runner interruptions separately: an unavailable bundled Chromium cache, a Vite hot reload during the first browser run and an Android emulator System UI ANR. Complete frozen-browser and restarted-emulator runs subsequently passed; no application defect was reproduced in those interruptions.

Production website/public download verification is recorded separately after publication so it does not mutate the frozen source archive. The public package hashes, release/tag/main revision, website assets and versioned links must match before completion.

## Distribution

All current downloads use version **1.1.4**. Android uses version code **10104**, with the existing package/signing identity; iOS uses build **5**. The complete source archive includes tests, native projects, requirements, current documentation and verification evidence.

macOS remains an Apple silicon build with an ad hoc signature and no notarization. Windows packages target Windows 10/11 x64; integrity and shared-source verification do not establish native Windows execution. iOS remains unsigned Xcode development/simulator software pending Apple enrollment and distribution signing.
