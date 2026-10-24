# Codex implementation prompt — Mental Arithmetic Trainer v1

You are implementing a precise, minimal browser-based mental-arithmetic practice application. The owner has already decided its interaction model. **Implement those decisions; do not redesign the product into a conventional tutoring app.**

Read all attached files before writing code, in this order:
1. `PRODUCT_SPEC.md` — authoritative product rules and UI.
2. `EXAMPLES_AND_EDGE_CASES.json` — arithmetic examples and input/transition acceptance cases.
3. `QA_CHECKLIST.md` — behavioral acceptance criteria and test matrix.

## Your assignment

Build a working local web application using **Vite + TypeScript**. Prefer straightforward DOM/CSS/TypeScript with small, clearly separated modules over heavy frameworks, unless the existing repository already has a suitable stack. It must run entirely in the browser without a backend. Include a README with exact commands to install, run, test, and build. Use unit tests (Vitest or equivalent); add browser interaction tests (Playwright or equivalent) if practical.

Implement:
- Responsive sepia-background interface with **large Arial numerals**, dark high-contrast text, and no clutter.
- Pre-round selectors for **addition/multiplication** and **one/two/three digits per operand**, plus manual Start.
- Ten *distinct* randomly generated problems per round, each using two operands of the chosen digit count. For duplicate checking, treat A+B as the same as B+A, and likewise for multiplication.
- Active problem with prominently shown operands, answer field automatically focused, live timer near that field at **bottom right**, displaying `0.0` and updating in tenths of a second.
- Automatic submission **on input reaching the decimal-digit length of the correct answer**, with no Enter key and no Submit button. Whether right or wrong, immediately record the result and show the next problem, without alerts, waiting, animations, or review. Accept only unadorned decimal digits; leading zeros make a submitted answer incorrect. The expected answer-length rule is intentional: do **not** substitute a timeout, keyboard Enter, or arbitrary fixed answer length.
- During the *next* problem, the previous problem's elapsed time must remain in the **upper-left corner**, black for correct or red for incorrect. Replace it after each subsequent submission.
- After exactly ten evaluated answers, display **only the score out of ten** as feedback; allow the learner to change settings and manually begin another round. No automatic new round.
- No explanations, badges, sounds, progress charts, mistakes list, or teacher-generated arithmetic method.

Use `performance.now()` for timing and `requestAnimationFrame` or an equally responsive display update. Display elapsed *tenths* without rounding upward early. A browser key event should not submit the current problem twice; state transitions must be atomic. Keep keyboard focus in the answer field whenever a problem is active.

## Carefully bounded implementation decisions

**Do not invent a pedagogical policy for extra physical keystrokes AFTER automatic submission.** The specification records a genuine ambiguity: submission happens immediately on the last expected digit, yet the owner also wants accidental extra keystrokes counted as wrong. For a rapid series of distinct physical keystrokes, anything typed *after* automatic submission can be construed as the beginning of the next answer. There is no way to retroactively mark the previous already-submitted answer wrong without changing immediate-submit behavior. Implement normal deterministic next-problem input behavior for now; isolate input handling so this one policy can later be adjusted, and clearly flag this issue in your final handoff. If an input event provides *more characters at once* than the expected length (e.g. a paste), do not silently truncate it into a correct response; treat the overlong entry as wrong, record it, and advance.

Other defaults are identified as **provisional** in the specification (e.g. whether zero is allowed as a one-digit operand and whether Backspace may edit a partial entry). Make these small, isolated choices explicit in README rather than silently pretending the owner approved them.

## Verification and delivery

1. Write automated tests from `EXAMPLES_AND_EDGE_CASES.json` and the invariants in `QA_CHECKLIST.md`. Add generation property tests covering every operation and digit size.
2. Exercise the keyboard flow and timing in a browser or automated browser tests, including the tenth answer and restart.
3. Confirm no accidental browser form submit or Enter-to-submit path.
4. Run the tests and production build; report the exact commands and results.
5. Provide the working source, a concise list of files changed, and exact local-run instructions.
6. Do not create or change a GitHub repository, connect a domain, alter DNS, or deploy anything without the owner's explicit permission.
7. Do not ask the owner to re-explain the arithmetic-training design already specified in the attachments. If an unresolved detail blocks a decision, implement the safe isolated default described above and report it explicitly.

**Priority:** accurate behavior over visual embellishment; minimal UI over added features; retain room to introduce the owner's mental-arithmetic instructional method in a later phase, without implementing that method now.
