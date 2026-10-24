# Instructional integration handoff — 24 October 2026

The site now has navigable **Learn** and **Practice** experiences. This implements the later `CODEX_INSTRUCTIONAL_HANDOFF.md`, which corrects the initial practice-only scope. Original practice arithmetic, input, timing and scoring rules remain in effect inside Practice. A subsequent owner request adds maximum/minimum/average answer times alongside the score after each completed round; it supersedes the original score-only feedback limit.

## Implemented and available locally

- Four selectable lessons in the confirmed order: **Single-digit addition**, **Single-digit multiplication**, **Two-digit addition**, **Two-digit multiplication**. No age tracks or three-digit instruction were added.
- Large Arial, horizontal arithmetic expressions on the existing sepia background. Every lesson opens with random operands in its matching range: 1–9 for single-digit and 10–99 for two-digit lessons. **New random example** is available in all four lessons and excludes the immediately previous unordered operand pair, without retaining a history.
- A focusable circled **?** opens a named inline walkthrough. The user can close it or use Escape; keyboard focus returns to the help control.
- Two-digit multiplication has learner-controlled **First → Inside → Outside → Last** navigation. Its default random example uses calculations and carry destinations derived from the confirmed method. The owner's fixed **12 × 12 = 144** and **18 × 18 = 324** worked examples remain selectable unchanged. A separate **Final answer** item includes the product and follows Last, per the owner's later presentation request. Selecting it shows the complete horizontal equation; Next reaches it after the full trace. No acronym is assigned.
- The first three lessons display random arithmetic problems and clear authored-script-pending status. No explanatory method is generated for those lessons. Two-digit multiplication has a worked-example selector; changing the example or choosing **New random example** resets the trace to First without leaking later results or carries. A walkthrough that is already open stays open when its example changes.
- A reusable step renderer displays explicit digit selections, calculations, intermediate results, carry values/routes and accumulated answer digits. Its inputs can be the preserved owner-confirmed traces or a separately generated arithmetic trace. Selected digits have underline/border and weight as well as background emphasis; accessible descriptions identify the actual selected operand, position and digit.
- Carry rendering accepts explicit `carryIn`, `carryOut`, `carryFromStepId` and `carryToStepId`, with human-readable route labels. It does not infer a destination, operand position or place value. Step navigation replaces the displayed carry information synchronously, with no animation or automatic advancement.
- The later owner explanation now supplies a complete **18 × 18** trace for **64 / write 4 / carry 6**. The live lesson uses that confirmed trace, replacing its earlier partial-fragment preview. The original fragment remains preserved in the original source files.
- Practice navigation is hidden during an active round. Learn cannot pause a timer, submit an answer or change a score. Completed scores and selected practice settings survive a visit to Learn between rounds.

## Supplied content boundary

`Mental_Arithmetic_Instructional_Lessons_Codex_2026-10-24.json` and `INSTRUCTIONAL_LESSON_DATA_as_text.txt` contain equivalent data. Both were read. The JSON is imported as the runtime lesson registry, while all four newly supplied files are preserved unchanged under `requirements/instruction/`. The newly supplied `EXAMPLES_AND_EDGE_CASES.json` is byte-for-byte identical to the original practice acceptance data.

The original supplied material did not contain the complete worked examples or digit/carry mappings. The subsequent conversation resolves those omissions for the two multiplication examples. It is recorded separately in `requirements/instruction/OWNER_CONFIRMED_MULTIPLICATION_2026-10-24.json`, which preserves:

1. The original 12 × 12 utterance, including its middle-line typo.
2. The explicit clarification that each cross-product is 2 and their sum is 4, the exact Inside/Outside digit assignments, and the owner's **YES** confirming that reading.
3. The owner's complete 18 × 18 explanation, including both carry destinations and the final product 324.

The first three lessons still lack owner-authored scripts. The later request for random Learn examples is recorded separately in `requirements/instruction/LEARN_RANDOM_EXAMPLES_2026-10-24.json`. It adds random operands for all four lessons and generated two-digit multiplication traces applying the confirmed mapping, cross-product sum and carry direction. This is an arithmetic generalization of the owner's demonstrated method; it does not make every generated trace an individually owner-confirmed example.

The original fixed 12 × 12 and 18 × 18 records remain unchanged. Random multiplication examples can have three- or four-digit products, zero units digits and a carry from the combined middle larger than nine. These cases are computed in the generator and passed as explicit trace fields to the renderer. No new authored teaching method is supplied for the other three lessons. Learn uses its own operand generator and does not change Practice's provisional 1–9 single-digit range.

## Confirmed two-digit multiplication trace

Digit positions are indexed from left to right in each horizontal operand. First selects `left:0 / right:0`; Inside selects `left:0 / right:1`; Outside selects `left:1 / right:0`; Last selects `left:1 / right:1`.

For 12 × 12, the displayed answer progresses **1□□ → 1□□ → 14□ → 144** across the four named stages. No carry is added.

For 18 × 18, First is 1, Inside is 8, Outside is 8 with the combined middle value 16, and Last is 64. No leading or middle answer digit is finalized at those earlier calculation stages. Last writes 4 and carries 6 into 16; the next screen shows 16 + 6 = 22, writes 2 and carries 2 into the First result 1; the next screen shows 1 + 2 = 3 and product 324. The answer progresses **□□□ → □□4 → □24 → 324**. Both carry-resolution screens stay within Last. A separate final-answer screen then displays **18 × 18 = 324**. The result item follows the four named multiplication stages, making seven sequential screens in total for this example; 12 × 12 has five screens including its result.

## Shared step contract

`src/learn/lessonTypes.ts` defines the input schema. A `Lesson` can have selectable `AuthoredExample` records, each with its own operands and ordered `steps` list. The random multiplication generator uses that existing schema too; its use of the type does not claim owner authorship of new calculations. Each `InstructionStep` supports:

| Field | Meaning |
| --- | --- |
| `id` | Stable step identifier |
| `stageName` | Optional First, Inside, Outside or Last; addition need not use a stage name |
| `stepLabel` | Optional descriptive substep, such as a carry operation within Last |
| `highlightedDigitRefs` | Explicit selections such as `left:0`, `right:1`; indices run left-to-right; null denotes unresolved mapping |
| `operationDisplay` | Explicit intermediate expression, including a sum of products if appropriate |
| `intermediateResult` | Explicit intermediate result |
| `carryIn`, `carryOut` | Explicit carry values, supplied to the renderer without interpretation or numerical normalization |
| `carryFromStepId`, `carryToStepId` | Explicit route between steps |
| `carryFromLabel`, `carryToLabel` | Learner-facing descriptions of the route |
| `visibleResultDigits` | The exact accumulated result fragment to show at that step |
| `narration` | Source-supported wording for confirmed examples, or arithmetic wording generated from the confirmed procedure |

`lessonCatalog.ts` combines the original registry with the later confirmed-example data. `randomExample.ts` separately generates operands for each lesson and computes two-digit multiplication traces from the confirmed digit mapping and carry procedure. `learnView.ts` selects between the random and fixed examples; the renderer only displays their explicit fields. This keeps the arithmetic generation modular without rewriting Practice or manufacturing missing explanations for the other three lessons.

## Verification boundary

The browser suite exercises both live owner-confirmed examples, exact digit selections, each carry, progressive result digits, backward navigation and example changes. It also independently exercises the generic renderer with **test-only, stage-less arithmetic fixtures**, which remain separate from live lesson content. A separate addition fixture proves the renderer does not impose multiplication stage names.

Current test results and all eleven instructional acceptance checks are recorded in `verification/TEST_RESULTS.md`. Physical phone keyboards and Safari remain unverified. The three original provisional Practice keyboard/range choices are unchanged and documented in README.

No deployment, GitHub repository, domain connection or DNS changes were made. The prior practice-only ZIP remains available as a separate delivery; the updated Learn and Practice delivery has its own archive.
