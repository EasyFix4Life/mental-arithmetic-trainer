# Acceptance checks for Codex — Mental Arithmetic Trainer v1

## Functional tests

1. Configuration screen offers exactly two operations (addition, multiplication) and digit counts 1, 2, 3. Starting a round creates precisely ten problems.
2. For all six configurations, generated operands have the selected number of digits and are randomly selected within their defined ranges. Pre-generated round contains ten unordered-unique operand pairs. No repeats, including reversed pairs.
3. Randomization is testable by injecting a seeded pseudo-random number generator or mock; do not hardcode the same ten questions for each round.
4. Addition and multiplication expected answers and expected decimal lengths are computed correctly, including boundary cases `9 + 9 = 18`, `99 + 99 = 198`, `999 + 999 = 1998`, `10 × 10 = 100`, `50 × 50 = 2500`, `999 × 999 = 998001`.
5. While solving, an entry shorter than the correct answer's *digit count* does not submit; timer continues.
6. Entry exactly matching the correct representation immediately submits correct; visually the next problem appears without blocking UI or an imposed wait.
7. Entry with the expected length but wrong digits immediately submits incorrect; visually the next problem appears at once. Do not require the user to correct a wrong full-length answer.
8. Leading-zero answer counts wrong; do not parse away zeros and then compare numerical equality.
9. For a single atomic input update containing more than expected digits, mark incorrect. Never silently truncate it to a correct prefix.
10. Enter does not submit, progress to next problem, or submit a form. Backspace on an incomplete answer follows the provisional editing policy, documented in README.
11. Focus remains on answer input after each of problems 1–9. No click required between questions. Keyboard input is handled once per key event, without double submission.
12. Live timer starts at `0.0` for every new problem, updates in tenths using monotonic clock, and stops at submission.
13. Previous completion time is shown upper-left on following problem: black for correct, red for incorrect. It stays until replaced by the next result; no full feedback screen.
14. Current running time is placed next to answer-entry area at lower right, not in the top-left result area.
15. After the tenth submission show `N / 10`, hide the active problem and running timer; never show problem eleven.
16. End screen has no performance data besides the count correct out of ten; it provides controls to change operation/digits and manually start another round.
17. A new round begins only from explicit user action; changing selection does not launch a round.
18. No explanatory teaching text, hint, answer review, retry prompt, reward pop-up, animations, sounds, or extra scoring features appear during practice.
19. UI is sepia with large Arial digits, readable on desktop and mobile widths; arithmetic digits do not get reduced to small text by accident.
20. Input code makes extra-physical-keystroke attribution an isolated, documented provisional rule rather than hiding the unresolved owner decision.

## Sample UI walkthrough

- Choose Multiplication, two-digit operands, Start.
- Problem `50 × 50` appears in large Arial on sepia; live timer beside blank input reads `0.0`.
- Type `2`, `5`, `0`: field is incomplete (3 of 4 expected digits); timer continues.
- Type `0`: the current problem is immediately scored correct; the next problem replaces it; prior duration appears black in upper-left; next live timer starts at `0.0`.
- On a later `10 × 10`, type `101`: that 3-digit response is immediately scored wrong, and the subsequent problem appears; prior duration is red in upper-left.
- Continue through exactly ten answers; score e.g. `8 / 10` appears. Learner must choose Start Another Round (may first change operation/digits).

## Quality gates

- Run unit tests and report results.
- Run lint/typecheck if configured.
- Run production build and report results.
- If browser test tooling is available, verify focus, color, timer placement, tenth-answer behavior, mobile-width layout, and lack of Enter submission.
- Do not deploy or connect the domain.
- Flag every provisional rule in the handoff without making the owner repeat the settled decisions.
