# Mental Arithmetic Trainer — Product specification v1.0

**Date:** 2026-10-24  
**Status:** Ready for a local first implementation. Two keyboard-edge policies remain explicitly provisional.  
**Product owner:** Jeff  
**Intended implementation agent:** Codex

## 1. Purpose and scope

A browser-based mental-arithmetic *practice engine* for people of different ages and skill levels. It should facilitate fast, accurate calculation without interruption. It is **not** a conventional lesson/review product. The creator's own arithmetic-instruction method will be supplied separately; do not guess it from generic FOIL or multiplication tutorials.

No user accounts, backend, storage, personal profiles, ads, leaderboards, audio, animation, achievements, analytics dashboard, or solution reviews in v1.

## 2. Appearance and positioning

- Sepia/parchment-like background across the entire screen (design starting color suggestion: `#E8D7B5`; can be refined later).
- Main arithmetic problem: very large **Arial** numerals (`Arial, Helvetica, sans-serif`), with dark near-black/brown foreground. Responsive CSS size starting around `72px` at desktop widths; use fluid sizing to avoid overflow on smaller screens. Keep main numbers visually dominant.
- Simple, uncluttered layout with ample space around the problem.
- During an active problem, place the **previous answer's completion time** in the **top-left**. Show time only, in **black if correct** and **red if incorrect**. No text labels on screen; assistive technology may have nonvisual labels.
- Place current **live running time near the answer field at the bottom right**, starting at `0.0` seconds, updating in visible 0.1-second increments while the problem remains active. Time formatting may be `0.0`, `0.1`, `0.2`, etc.; keep a consistent decimal place.
- Keep answer entry easily legible and appropriately sized, with automatic focus; on touchscreen devices, request a numeric keyboard (`inputmode="numeric"`) if available.
- End screen should display the score `N / 10` prominently with settings and a manual Start Another Round control. Do not add mistake review or further performance measurements.
- Avoid animation, feedback banners, spinners, colors other than the specified correctness signaling, or modal interruption during an active round.

## 3. Round configuration

Between rounds, the learner selects:
- Operation: **addition** or **multiplication**.
- Operand digit count: **1**, **2**, or **3** digits; *both operands must have exactly the selected number of digits*.
- Then manually starts a ten-problem round.

Problem generation:
- Random within the selected digit range, not a fixed instructional progression.
- No duplicate problems within any one round of ten. For addition and multiplication, a reversed pair is still the same problem (e.g. `12 + 34` and `34 + 12`).
- Every round has exactly ten problems. Pre-generate ten distinct pairs before starting so generation cannot stall mid-round.
- Choose inclusive ranges for operands with *exactly* the selected decimal digit count. **Provisional assumption:** use 1–9 for one-digit problems; 10–99 for two-digit; 100–999 for three-digit. The owner specified exact digit counts but has not explicitly decided whether zero is allowed as a one-digit operand. Keep this in one configurable function.
- Both 3-digit addition and 3-digit multiplication problem generation must be supported. Do **not** build unprovided 3×3 instructional lessons.

## 4. Timing and automatic evaluation

At each problem's start:
1. Render the new problem, blank the answer field, and focus that field.
2. Reset elapsed time to zero; start a monotonic timer immediately. Display `0.0` at the bottom-right live timer.
3. The learner types an answer using only digits.

**Submission trigger:** compute the correct numerical answer and the decimal length of its standard base-10 representation. The moment the learner's current input reaches that number of characters, submit it **automatically**. **Do not use Enter** or a submit button, inactivity delay, or additional confirmation.

- If the typed digits match the correct decimal representation *exactly*, count it correct.
- Any different entry of the expected length is wrong.
- Any submitted entry with leading zero is wrong. Do not normalize leading zeros before checking.
- No forgiveness, auto-correction, rounding, or second chance *after submission*.
- An incomplete entry of fewer than the required digits leaves the timer running; it is not yet a scored wrong answer.
- **Provisional UI default:** allow Backspace to amend a still-incomplete answer. Never allow edits to a submitted answer. Owner has not separately specified partial-entry editing policy.
- If a single input transaction contains more than the required number of digits (e.g. paste), score that input wrong without silently truncating it. Do not turn a pasted overlong answer into a correct one.
- Disable or prevent Enter-based submission and browser form submission; pressing Enter must not advance or restart anything while solving.

Upon submission:
1. Stop timer and capture the actual elapsed duration with `performance.now()`.
2. Determine correctness; update the round's correct count and answered count; record result internally for sequencing (do not display answer history).
3. If answers completed = 1–9, *immediately* display a fresh new problem with a cleared answer field and reset/live timer, while updating the top-left completion time for the just-finished problem (black = right, red = wrong). No waiting, modal, explanation, congratulation, or visible mistake review.
4. If answers completed = 10, end the round instead of presenting an eleventh problem.

Time display:
- Show tenths of seconds (`0.0`, `0.1`, `0.2` …). Underlying timing should remain high resolution. For displayed time use *elapsed completed tenths* (floor) so it doesn't show `0.1` before 0.1 seconds have actually passed.
- Previous completion time stays in the top-left during the next problem and is replaced at the next submission.
- Nothing in the active exercise pauses or freezes the learner's timer as a hint about an incorrect partial answer; the current timer only stops when an answer submits.

## 5. End-of-round behavior

- Immediately after the tenth submission, hide active problem/input and show **score only** (number correct out of 10) as performance feedback. Example: `7 / 10`.
- Do not display answers, per-problem times, total time, averages, explanations, recommendations, or error logs to the learner. Developer logs/tests are okay when not shown as a learner feature.
- Do not start another round automatically.
- Learner can reselect operation and digit count before manually starting the next round. May preserve settings as preselected defaults for convenience, but do not silently launch another round.

## 6. Keyboard transition edge: explicitly unresolved, do not invent policy

The owner said **accidental extra keystrokes count as incorrect answers**, and also specified **instant automatic submission when the expected digit count is reached**. If, for instance, the correct answer is `100`, entering the third digit triggers immediate submission. A physically separate fourth keystroke occurs *after* that transition, when a new problem is active. The owner has not yet defined how such a key should be attributed, and treating it as an extra mistake for the *previous* already-submitted problem conflicts with irreversible immediate submission.

**V1 provisional execution:** each digit event is processed against the currently active problem. Once submission has occurred, further events belong to the next active problem. Do not introduce a grace timer or artificial pause to detect a burst. Do not silently discard physical input. Keep this policy isolated and documented for owner review. For overlong input **in a single atomic event** (e.g. paste), treat as wrong (see above) rather than trim/accept. Code must not claim this resolves the physical-extra-keystroke ambiguity.

## 7. Technical architecture

Use a client-only, responsive website, preferably Vite + TypeScript (unless existing repo has better established conventions). Keep modules separate:
- `generateRound(operation, digitCount)` creates ten unique problems and validates count/ranges.
- `answerPolicy` calculates exact expected digit length and validates unmodified entered digits.
- `timer` uses a monotonic clock and emits tenths for display.
- `roundController` owns active/finished states, answer index, scoring, and atomic transitions.
- `view` renders UI and preserves focus/responsiveness; CSS owns presentation.

A round's state transitions should be testable without real DOM timers. Avoid race conditions between key events, state updates, and the next question. Defensive checks must prevent duplicate scoring from repeated input callbacks.

Accessibility: meet sensible contrast for large text; use semantic controls and keyboard navigation on setup/end screens, with accessible names for input and nonvisual correctness descriptions. Do not add visible labels that clutter the active arithmetic interface. Respect reduced-motion preferences by using no animated transitions.

## 8. Acceptance criteria

See `QA_CHECKLIST.md` and `EXAMPLES_AND_EDGE_CASES.json` for concrete tests. Successful v1 demonstrates:
- ten distinct randomly generated same-digit problems from selected operation/digit count;
- instant auto-submit at the correct answer's digit length, correct/wrong scored identically in transition timing;
- live timer at bottom-right and previous-result time in upper-left with black/red correctness;
- score out of 10 after exactly ten, manual restart/configuration;
- sepia, large Arial, responsive layout and no pedagogical extras.

## 9. Out of scope / future

The creator's custom mental multiplication teaching method, instructional curriculum, site name/branding, accounts, analytics, complex lesson flows, more than 3 digits per operand, GitHub repo creation, DNS setup, and production deployment. These require separate approval.

## 10. Decision ledger

**Confirmed by owner:** sepia; Arial; very large arithmetic numbers; correct/incorrect completion time in black/red upper-left; live tenths timer beside answer field bottom-right; immediately progress after a full-length entry regardless of correctness; Enter is *not* submit; no wrong-answer review; score only out of ten at the end; manually start each next round; between rounds choose addition/multiplication and digit count; equal digit counts for operands; random within range; no repeats in ten; max 3×3; leading zeros wrong; accidental extra keystrokes intended as wrong.

**Explicitly provisional / requires later signoff:** one-digit use of zero, Backspace behavior on incomplete input, and attribution of physical keystrokes after automatic submission. These should be isolated in implementation, not smuggled in as owner decisions.
