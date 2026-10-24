# Verification record — 24 October 2026

The application was tested locally after the final application-source changes. No hosting or external repository was created. The four requirements files match their original ZIP entries byte for byte; hashes are recorded in `requirements-integrity.json`.

## Executed checks

| Command | Result |
| --- | --- |
| `npm test -- --reporter=default --reporter=json --outputFile=verification/unit-results.json` | **142 passed**, 4 files, no failures; 352 ms final run |
| `PW_CHANNEL=chrome npm run test:browser -- --workers=2` | **26 passed**, no skipped, flaky or failed cases; 6.9 s |
| `npm run typecheck` | Passed with strict TypeScript options |
| `npm run build` | Passed; repeats typecheck, then builds production `dist/` |
| Local Vite HTTP check | `http://127.0.0.1:5173/` returned HTTP 200 |
| Source ZIP integrity comparison | All four requirements files unchanged |

Environment: macOS, Node 26.11.1, npm 11.20.0, Vite 8.3.5, TypeScript 7.0.2, Vitest 5.0.5, Playwright 1.64.1. Browser tests used installed Google Chrome in headless mode, with desktop and iPhone 13 viewport/touch emulation. Mobile emulation runs Chromium, not Safari.

## Supplied test-data coverage

- All **23 arithmetic examples**, **11 input cases**, and **4 scoring cases** are loaded directly from `requirements/EXAMPLES_AND_EDGE_CASES.json` rather than copied into test constants.
- Generation properties cover **128 seeds per configuration**, across both operations and all three digit counts: **768 rounds / 7,680 problems**. Tests check correct ranges, unordered uniqueness, reproducibility, variation, and bounded completion with constant injected randomness.
- Timing tests cover high-resolution elapsed duration, resets, and **1,000 successive completed-tenth boundaries**. Browser tests control `performance.now()` and `requestAnimationFrame` to verify no early displayed tenth, active partial-entry timing, submission capture, and reset.

## Acceptance checklist mapping

Numbers refer to the original `requirements/QA_CHECKLIST.md`.

| Criteria | Evidence and result |
| --- | --- |
| 1–3: configuration, random ten-problem generation, same-digit operands, no reversed duplicates, injectable randomness | Unit generation suite plus ten real browser answers for each of six configurations, on both viewport profiles; passed |
| 4: arithmetic and expected lengths, including supplied boundaries | All JSON arithmetic examples in unit suite; passed |
| 5–7: incomplete entry keeps running; correct/wrong entries advance immediately | Policy/controller unit suites and browser partial/timing/mixed-score cases; passed |
| 8–9: leading zeros wrong; atomic overlong input wrong without truncation or spillover | Unit JSON cases and browser leading-zero/overlong ClipboardEvent case; passed |
| 10: Enter suppression; provisional partial Backspace | Browser keyboard case with partial entry, Enter and Backspace; passed |
| 11: focus retained; no duplicate scoring | Browser focus assertions after every transition; stale ID/repeated callback controller tests and paste scored once; passed |
| 12: monotonic, floored tenths, reset/capture | Timer unit boundaries and browser virtual clock tests; passed |
| 13: previous time upper-left, black/red, persists | Browser color, persistence and layout tests; passed |
| 14: live timer beside input at lower right | Browser geometry assertions and reviewed desktop/mobile screenshots; passed |
| 15–17: exact tenth, score only, settings/manual restart | Controller and browser tests with 0/10, 7/10, 8/10 and 10/10; selection alone never starts; passed |
| 18: no lesson, hint, review, animation, sounds or extra active controls | Source audit, browser assertions for active controls/text and animation/transition styles, rendered UI review; passed |
| 19: sepia, dominant Arial numbers, responsive layout | Browser computed-style and bounds assertions at 1280×720 and 390×664; separate in-app preview at 319 px width visually reviewed; passed |
| 20: unresolved extra-keystroke policy explicit and isolated | `src/inputPolicy.ts`, the view transaction boundary, README provisional-decision section, browser separate-key test; passed |

The browser paste tests dispatch `ClipboardEvent` with `DataTransfer` to exercise the application's paste listener without changing the user's system clipboard. Physical digit entry is exercised by browser keyboard events; atomic updates also exercise the input fallback.

## Review evidence and limits

- `desktop-active.png` and `mobile-active.png` show the active interface after a correct answer: prior completion time upper-left; next problem centered; blank answer and current time lower-right. These timing snapshots can legitimately show `0.0` for an automated fast answer.
- `unit-results.json` and `browser-results.json` contain machine-readable test outcomes. `build.txt` records the successful production build.
- The in-app browser was also used to inspect setup and active three-digit multiplication at narrow width, including automatic input focus.
- **Physical touchscreen keyboard behavior, Safari, Firefox, and actual-device browser differences were not tested.** The source requests a numeric keyboard and handles visual-viewport resize/scroll, but emulation does not establish a physical device pass.
- The three provisional policies remain those in README: one-digit operands exclude zero, incomplete entries permit Backspace, and a distinct event after submission belongs to the next active problem. The owner's attribution of accidental extra physical keystrokes remains open; v1 does not claim to settle it.
