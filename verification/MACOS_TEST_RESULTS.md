# macOS 1.1.0 verification — 24 October 2026

The final Apple silicon macOS release passes **196 unit tests, 54 browser tests and 5 native Electron tests**. The native release run launched **Mental Arithmetic 1.1.0 directly from the delivered read-only DMG**. It did not launch a development shell or require a Vite server. The final run includes the corrected vertical addition alignment, including the case where the answer has more digits than either operand.

## Release and executed evidence

| Item | Verified result |
| --- | --- |
| Application/bundle | Mental Arithmetic 1.1.0 / `local.jeff.mentalarithmetic` |
| Architecture | Apple silicon / arm64, checked in the delivered executable |
| Minimum macOS | 13.0, checked in bundle metadata |
| Test host | Apple silicon Mac, macOS 27.2 |
| Runtime/tooling | Electron 45.0.0, electron-builder 26.18.0, Playwright 1.64.1 |
| Shared TypeScript unit suite | **196 passed**, 8 test files; `unit-results.json` |
| Browser suite | **54 passed**, 23.4 s, no skips/failures/flaky cases; `browser-results.json` |
| Source Electron shell | **5 passed**, 14.7 s; `desktop-source-results.json` |
| Final app from delivered DMG | **5 passed**, 13.3 s; `desktop-results.json`, `desktop-packaged-test-run.txt` |
| Production build and packaging | Passed; `macos-build.txt` |
| App signature | `codesign --verify --deep --strict` passed; valid ad hoc signature; `macos-signature.txt` |
| DMG integrity | `hdiutil verify` passed; `macos-dmg-integrity.txt` |
| App ZIP integrity | All ZIP CRC checks passed; `macos-zip-integrity.txt` |
| Bundled frontend and shell | All three production HTML/JavaScript/CSS files and both desktop shell modules match the current source build byte-for-byte; `macos-frontend-integrity.json` |
| Version, minimum OS, file sizes and SHA-256 | `macos-artifacts.json` |
| Exact final mount/executable | `macos-review-location.json` |

The final Mac artifacts contain the corrected production CSS, not the earlier development build. The prior 1.0.2 release files remain preserved separately. No running user app was stopped or replaced during packaged-app testing.

## Native acceptance coverage

1. **Offline shell and faithful layout.** The app loads its local `app://trainer/index.html` production bundle, with sepia background, large Arial numerals, upper-left prior-answer time and a live timer beside the answer at the bottom right. The renderer has Node integration disabled, context isolation/sandboxing enabled, and no preload or IPC bridge.
2. **Confirmed multiplication.** The 12 × 12 example preserves the four named stages, selected digit pairs and product 144. The 18 × 18 example preserves the middle sum 16, Last result 64, carry 6 to make 22, carry 2 to make 3, and product 324. The separate Final answer item follows Last. Addition calculations within these multiplication traces use the requested vertical layout and retain their accessible equation labels.
3. **Complete instruction and random examples for all six lessons.** Addition and multiplication with one-, two- and three-digit operands each provide a complete walkthrough ending in the correct final answer. New random examples remain in range and avoid an immediately reversed duplicate. The generated 98 × 87 trace verifies both carries and product 8526. Addition examples and final answers have right-aligned columns; the final answer remains aligned when it is wider than the operands.
4. **Practice input and timing.** Expected-length input submits automatically; Enter does not submit incomplete input; Backspace edits a partial answer. Correct and incorrect submissions advance immediately and keep focus. Previous timing is black/red as appropriate. The completed set shows its score and all three timing statistics, preserves them across a Learn visit and clears them only when another round starts manually.
5. **All six Practice configurations.** Each operation/digit-count combination completes ten unique unordered pairs in the selected range and ends with a score of 10 / 10 when answered correctly. Addition operands are above/below with right-aligned columns. Multiplication remains horizontal.

## Method and arithmetic provenance

All six lessons are implemented using the owner's later instructions, recorded in `requirements/instruction/ALL_LENGTHS_OWNER_METHOD_2026-10-24.json`. Addition calculates corresponding digit columns from left to right and resolves carries from right to left. Three-digit multiplication uses five product groups, with the exact owner-specified order in the central group. Single-digit lessons use the one-column/one-product base case. The original two-digit First → Inside → Outside → Last procedure remains intact. Newly generated worked examples apply these methods; they are not individually owner-authored scripts.

The TypeScript suite includes exhaustive checks over all 8,100 ordered two-digit multiplication operand pairs, plus supplied arithmetic/input vectors, positional method checks for all six lesson categories, zero/carry edge cases, and provisional keyboard behavior. The browser suite includes the exact 58 + 67 = 125 column alignment and 123 × 456 = 56088 method demonstrations. Original supplied requirement documents remain source records; subsequent owner instructions are recorded separately.

## Round timing definition

Maximum, minimum and average refer to all ten accepted answer durations in the just-completed set, including incorrect answers. Invalid, partial, stale and duplicate submissions do not create samples. The average uses raw milliseconds before the displayed values are floored to completed tenths.

The native timing test submits answers after 220 ms, 530 ms for an incorrect answer, and 1,499 ms for each of the other eight answers. The raw mean is 1,274.2 ms. The required display is **maximum 1.4 s, minimum 0.2 s, average 1.2 s**, with a score of 9 / 10. Averaging already truncated values or excluding the wrong answer produces different answers, so this test detects both mistakes. `desktop-app-round-timing.png` is this controlled test, not a record of the owner's performance.

## Limits

The Mac application has a valid local ad hoc signature and is **not Apple-notarized** or Developer ID signed. The minimum macOS value is runtime metadata; every supported macOS release was not tested. This package targets Apple silicon, not Intel Macs. Windows packages are checked separately in `WINDOWS_TEST_RESULTS.md`; no Windows native execution is claimed. Browser viewport checks do not establish physical iOS/Safari behavior; the separate native iOS project has its own records.

The app runs offline without an account, analytics, backend or persistent learner history. No deployment, repository creation, DNS change or system security-setting change was performed.
