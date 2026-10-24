# Learn and Practice 1.0.2 verification — 24 October 2026

The updated local app passes **178 unit tests and 50 browser tests**, with no failed, skipped or flaky browser cases. The packaged 1.0.2 app also passes **5 native tests** when launched from the delivered read-only DMG. TypeScript and the production build pass. This release includes random examples in all four Learn lessons, generated two-digit multiplication traces using the confirmed method, the preserved owner-confirmed 12 × 12 and 18 × 18 examples, and maximum/minimum/average time after each Practice round. The original Practice baseline report is retained as `PRACTICE_V1_TEST_RESULTS.md`. Native Mac results and package-integrity evidence are recorded in `MACOS_TEST_RESULTS.md`.

## Executed checks

| Command | Final result |
| --- | --- |
| `npm test -- --reporter=default --reporter=json --outputFile=verification/unit-results.json` | **178 passed**, 7 files, 818 ms; includes 153 existing tests and 25 new random-example tests |
| `PW_CHANNEL=chrome npm run test:browser -- --workers=2` | **50 passed**, 22.1 s; includes all 26 original Practice browser cases and 24 Learn cases, including the final current-lesson reselection regression |
| `npm run typecheck` | Passed with strict TypeScript options |
| `npm run build` | Passed; repeats typecheck and generates production `dist/` |
| Packaged native 1.0.2 DMG app | **5 passed**, 13.7 s; no failed, skipped or flaky cases |
| Local HTTP check | `http://127.0.0.1:5173/` returned HTTP 200; server remains running for review |
| Practice core comparison with v1 ZIP | Four core modules byte-for-byte unchanged; `types.ts` and `roundController.ts` add the later requested timing summary, with original/current hashes recorded |
| Instructional source comparison | All four newly supplied files preserved byte-for-byte |

Environment: macOS, Node 26.11.1, npm 11.20.0, Vite 8.3.5, TypeScript 7.0.2, Vitest 5.0.5, Playwright 1.64.1. The browser suite uses installed Google Chrome with a desktop viewport and iPhone 13 viewport/touch emulation; the latter is Chromium, not Safari. Each profile runs 25 cases.

## Instructional acceptance checks

Numbers refer to `requirements/instruction/CODEX_INSTRUCTIONAL_HANDOFF.md` §7.

| Criterion | Evidence / boundary |
| --- | --- |
| 1. Learn and Practice accessible | Named mode controls switch between persistent views; tested on both viewport profiles |
| 2. Four lessons in exact order | Runtime registry is imported from supplied JSON; unit and browser assertions cover all four titles/IDs |
| 3. Learn does not start timer, ten-question flow or scoring | Learn has no controller/clock dependency; browser tests navigate steps, type digits and verify no Practice activity; completed score survives return to Learn and back |
| 4. Horizontal instructional operands | Flex row, operand bounding boxes, Arial size, sepia and no horizontal overflow verified for all four lesson views |
| 5. Accessible circled question mark | Border/circle geometry, accessible name, Enter activation, named walkthrough, heading focus and close focus-return tested |
| 6. Exactly specified digit references highlighted | Both confirmed examples and generated multiplication traces use the confirmed First/Inside/Outside/Last reference sets. Generic renderer tests check non-color emphasis and accessible selected operand/position/value; null, empty and invalid-only references infer no selection |
| 7. First → Inside → Outside → Last | Exact ordered labels, learner-controlled forward/back/direct stage selection and absence of invented acronyms tested; keyboard focus retained across rerenders and disabled boundaries |
| 8. Products, sums, carries and progressive results supported | Confirmed 12 × 12 traces to 144; confirmed 18 × 18 traces through 64 → write 4/carry 6 → 22 → write 2/carry 2 → 3 and 324. Random asymmetric 98 × 87 reaches 8526 through both carry routes. Tests cover backward navigation and resetting when examples change; generic addition fixture uses no multiplication stage labels |
| 9. No invented 3×3 instruction | Registry has exactly four one-/two-digit lessons; unknown three-digit lesson IDs return undefined; browser confirms no extra instruction |
| 10. Practice immediate and no-review behavior retained | All 26 original Practice browser cases pass; the completed-round case now also checks the requested timing summary. Learn integration additionally verifies immediate wrong/right advancement and no active mode/help controls |
| 11. Missing authored content reported accurately | Later conversation supplies two confirmed multiplication examples and their digit/carry mapping. The later random-example request adds generated arithmetic traces from that method, including four-digit products. First-three lesson scripts remain pending while random operands are displayed. README, separate request/confirmation records and `INSTRUCTIONAL_HANDOFF.md` distinguish confirmed authorship from computed examples |

**Source-content boundary:** the original development-package files and four supplied instructional files remain unchanged. A separate owner-confirmation record preserves the 12 × 12 utterance, its explicitly approved correction, exact digit mappings, and the full 18 × 18 trace. Those two fixed examples remain unchanged and selectable. The later random-example request has its own record in `requirements/instruction/LEARN_RANDOM_EXAMPLES_2026-10-24.json`. Random multiplication traces are new arithmetic applications of the confirmed method, not individually owner-confirmed scripts. The first three lessons show random operands while their authored explanations remain pending. Generic renderer fixtures remain separate from live lesson content.

## Random-example checks

- All four Learn lessons initially display random numeric operands and offer **New random example**. The range is 1–9 for single-digit lessons and 10–99 for two-digit lessons. This preserves the existing provisional zero choice in Practice.
- A new random example excludes the immediately previous unordered pair, including its reversal. Constant-RNG cases terminate without retry loops. Browser coverage includes choosing another lesson, reselecting the current lesson, and switching back to random after choosing a fixed confirmed example.
- The first three lessons continue to report pending authored scripts; random operands do not add teaching stages, timers, scoring or invented explanations.
- Two-digit multiplication applies the confirmed digit pairs and First → Inside → Outside → Last ordering, sums Inside and Outside, resolves any required carries within Last, and includes **Final answer** after Last. Changing examples clears later result/carry state and resets to First while keeping an already open walkthrough open.
- The unit suite exhaustively checks **all 8,100 ordered operand pairs from 10 × 10 through 99 × 99**. It verifies the full product against integer multiplication, four initial stage results, exact digit mapping, every revealed result digit, unique step IDs and matching carry source/destination links.
- Dedicated cases include 10 × 10 = 100, 20 × 15 = 300, 12 × 90 = 1080, 98 × 87 = 8526 and 99 × 99 = 9801. They cover zero units digits, three-/four-digit products, no carry, a units-only carry, a middle-only carry and a middle carry larger than nine. Invalid operands and invalid random-source values are rejected.
- Desktop and mobile browser checks trace asymmetric 98 × 87 through both carries and its final answer, so reversing Inside and Outside cannot pass accidentally as it could for a square.

## Confirmed-example checks

- 12 × 12 uses exactly the four confirmed digit pairs, with cross-products 2 and 2 and combined middle result 4. It displays 1□□, 1□□, 14□, then 144 without carry fields.
- 18 × 18 has six calculation/carry screens under four unique named multiplication stages, followed by a seventh final-answer screen. The two carry-resolution screens remain within Last. The 12 × 12 example has four calculation screens followed by its fifth final-answer screen.
- The instruction list places **Final answer: 144 / 324** immediately after Last. Direct click, keyboard activation, sequential Next, Back, terminal focus and example-reset behavior are verified. The result is shown as a complete horizontal equation with a matching accessible name.
- 18 × 18 keeps all answer positions unresolved before Last, then displays □□4, □24 and 324. It does not present the first intermediate 1 or middle 16 as final answer digits.
- The carry from 64 is 6 into Inside + Outside (16); the carry from 22 is 2 into First (1). Live route labels name those quantities rather than internal IDs.
- Backward navigation removes later result digits and carry details; changing examples resets to First with no state leakage.

## Practice preservation

- `answerPolicy.ts`, `generateRound.ts`, `inputPolicy.ts` and `timer.ts` match the original delivery byte-for-byte. `types.ts` and `roundController.ts` now add the requested round timing summary; their original hashes and the current change are recorded in `practice-preservation.json`.
- The original `view.ts` moved to `practiceView.ts`, added a mode-navigation callback, and now renders maximum/minimum/average answer time after the tenth submission. Its input, focus and immediate-transition behavior is unchanged.
- All 23 supplied arithmetic vectors, 11 input cases and 4 score cases remain covered. Generation properties still check 768 seeded rounds / 7,680 problems across six configurations, with unordered uniqueness and bounded generation.
- Original timer tests retain high-resolution duration, resets and 1,000 completed-tenth boundaries.
- Original browser coverage retains exact-length auto-submit, incomplete editing, Enter suppression, black/red previous timing, live timer position, leading zeros, overlong paste wrong once, extra physical keys assigned to the next active problem, ten-answer termination and manual restart.
- Practice's provisional one-digit range, Backspace editing and post-submission key attribution are unchanged.

## Later round-timing requirement

The owner requested maximum, minimum and average time for each Practice set. This supersedes the original score-only end feedback. All ten accepted answer durations, including incorrect answers, contribute to the summary. No summary is shown before the tenth answer; visiting Learn preserves it; starting another round clears it.

Four injected-clock unit cases verify exact full-resolution minimum/maximum/average, partial/invalid/stale exclusion, immutable completion state and fresh-round reset. Browser and native virtual-clock checks use a 220 ms first answer, 520/530 ms wrong second answer and eight 1,499 ms answers. They require **0.2 s minimum, 1.4 s maximum and 1.2 s average**; averaging already truncated display times would incorrectly show 1.1 s. The tests verify the raw-duration calculation and inclusion of wrong submissions.

## Files and manual review

- `unit-results.json`, `browser-results.json`: machine-readable outcomes from the latest runs.
- `build.txt`: successful production build output.
- `instruction-source-integrity.json`: supplied instructional-file hashes and exact comparison results.
- `desktop-learn.png`, `mobile-learn.png`: Learn layout screenshots; fixed 12 × 12 remains selectable rather than being the default example.
- `desktop-learn-confirmed.png`, `mobile-learn-confirmed.png`: reviewed full-page screenshots of the completed 18 × 18 example.
- `desktop-learn-random.png`, `mobile-learn-random.png`: generated 98 × 87 final-answer screenshots.
- `desktop-learn-random-carry.png`, `mobile-learn-random-carry.png`: the generated trace with its carry operation visible.
- `desktop-active.png`, `mobile-active.png`: current Practice screenshots from regression tests.
- `desktop-round-timing.png`, `mobile-round-timing.png`: completed-round timing summaries at desktop and mobile widths.
- The in-app browser was also used at a narrow 319 px width to inspect Last = 64, advance through 16 + 6 = 22, and complete 1 + 2 = 3 / product 324.

Physical phone keyboard behavior, Safari and Firefox were not tested. The two owner-supplied fixed multiplication examples and generated random applications of the same method are implemented. The first-three lesson scripts remain pending. No deployment, repository or DNS action was performed.
