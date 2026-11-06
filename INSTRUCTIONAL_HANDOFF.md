# Instructional implementation handoff — 1.1.0

In **version 1.2.0**, Learn offers single-digit and two-digit multiplication. Practice offers two-digit addition and both multiplication choices. The all-length examples below document the earlier instructional implementation. [Current release and download guide](RELEASE_1_2_0.md)

**Current Inside/Outside correction:** For horizontal `ab × cd`, Inside uses `b × c` (inner digits) and Outside uses `a × d` (outer digits). The correction applies to highlights, arithmetic and narration in random and fixed examples on every platform. For 82 × 76, Inside is 2 × 7 = 14 and Outside is 8 × 6 = 48. See [the owner correction](requirements/instruction/OWNER_INSIDE_OUTSIDE_CORRECTION_2026-11-02.md); it supersedes the earlier mapping while preserving the original intake.


Version 1.1.0 offered addition and multiplication lessons with one-, two- and three-digit operands. All six Learn categories in that version opened with a random example and had complete walkthroughs. Addition operands appeared above and below one another, aligned by place value, in Learn and Practice. Multiplication stayed horizontal.

## Source hierarchy

The original `CODEX_INSTRUCTIONAL_HANDOFF.md`, JSON lesson data, text lesson data and arithmetic acceptance JSON remain unchanged in `requirements/instruction/`. Original development-package sources remain unchanged in `requirements/`. Later explicit conversation instructions govern the fields they correct. The original four lesson entries retain their order; three-digit addition and multiplication follow them.

The original instruction to retain pending scripts and omit three-digit lessons described the earlier, incomplete source data. It is superseded by the owner's explicit **“ALL VERSIONS SHOULD HAVE INSTRUCTIONS ON ALL DIGIT-LENGTH MENTAL ARITHMETIC”**, followed by the common algorithm description. Exact newer utterances, interpretation and scope are recorded in `requirements/instruction/ALL_LENGTHS_OWNER_METHOD_2026-10-24.json`. Historical 1.0.2 behavior is retained under `verification/historical-1.0.2/`; those historical descriptions do not describe 1.1.0.

## Procedure represented in code

For three-digit multiplication, write the horizontal operands as `abc × def`. The owner-described order is:

1. `a × d`
2. `a × e + b × d`
3. `a × f + c × d + b × e`
4. `b × f + c × e`
5. `c × f`

The central group preserves the order first/last, last/first, middle/middle. All nine digit products appear exactly once. Compute groups from left to right, then resolve their place-value carries from right to left, following the confirmed 18 × 18 procedure. A derived verification example is 123 × 456: raw group values **4, 13, 28, 27, 18**, then carry results **28, 30, 16, 5**, giving **56088**. This example is an arithmetic application of the owner's described method, not a separately owner-authored script.

One-digit multiplication is the one-product base case. Two-digit multiplication retains its existing **First, Inside, Outside, Last** calculation engine and both fixed examples. For addition, corresponding digit groups are computed from the first digit onward, with carries resolved from right to left. Both operands and the sum calculations are visually stacked. The addition sequence extends the common positional method; the owner's latest reply specifically corrects its presentation to above/below. Neutral Step labels are used for the other categories, without inventing additional named multiplication stages.

For 58 above 67, the digit sums are 11 and 15; write 5 and carry 1 into 11 to complete 125. Three-digit addition applies the same groups and carry direction. Generated result digits and carry source/destination links are explicit step data.

## Preserved fixed examples

- **12 × 12 = 144**: First 1, Inside 2, Outside product 2 plus Inside 2 gives 4, Last 4, then a separate final answer. The original middle-sum typo was explicitly corrected and confirmed in the conversation.
- **18 × 18 = 324**: First 1, Inside 8, Outside 8 plus 8 gives 16, Last 64; write 4, carry 6 into 16 to get 22; write 2, carry 2 into First 1 to get 3; final answer 324.

The fixed data remains unchanged. Carry screens stay under Last, and the separate **Final answer: ...** navigation item follows Last. Generated two-digit products use that same engine. Other digit lengths place their final-answer item after the last neutral group.

## Separation from Practice

Learn is learner-directed and untimed. It has no scoring, automatic lesson advancement, curriculum or mistake review. Practice remains the ten-problem automatic-input flow. The later round-timing request adds maximum/minimum/mean over all ten raw durations, including wrong submissions; it does not change submission, next-problem or manual-restart behavior. The unresolved extra-physical-keystroke attribution remains isolated and documented in the platform guides.

## Extension boundary

TypeScript generates explicit `AuthoredExample`/`InstructionStep` data in `positionalInstructions.ts`, delegating two-digit multiplication to the preserved engine. The renderer consumes fields rather than inferring digit mappings or carries. Native Swift uses the same division between `Core/PositionalInstructions.swift`, the Practice engine and UIKit. The original teaching method can evolve at this data-generation boundary without coupling Learn to timed Practice.
