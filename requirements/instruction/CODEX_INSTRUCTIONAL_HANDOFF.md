# CODEX INSTRUCTIONAL HANDOFF — Mental Arithmetic Website

**Date:** October 24, 2026  
**Owner:** Jeff  
**Status:** Build the instructional section together with Practice; implement confirmed elements and preserve the owner's algorithm where its exact mechanics remain unspecified.  
**Companion requirements:** `PRODUCT_SPEC.md`, `EXAMPLES_AND_EDGE_CASES.json`, `QA_CHECKLIST.md`.

## 1. Your assignment

The site has **two distinct experiences: Learn and Practice**. The initial practice-only brief was incomplete. The instructional portion is a core part of the website, not a hypothetical replacement project. Build an actual, navigable Learn experience in this iteration and a reusable interactive demonstration framework. Preserve the algorithm as Jeff described it; **do not substitute textbook FOIL, long multiplication, vertical columns, or generic cross-product lessons as though those were his words**.

Learn is for people **of any age**. Difficulty is determined by mathematical skill, not chronological age. The website may initially be useful to Jeff's son, but must not be presented as a children's-only product.

## 2. Confirmed lesson order

Create selectable instructional lessons in this exact progression:

1. **Single-digit addition**.
2. **Single-digit multiplication**.
3. **Two-digit addition**.
4. **Two-digit multiplication**.

Provide a simple entry into Learn and navigation among these lessons. Keep the user interface minimal and consistent with the sepia background and large, legible Arial numerals specified for the website.

**Scope limit:** Three-digit-by-three-digit *instruction* is **deferred**. Practice may support up to three-digit operands under the separate practice specification. Do not expand the app beyond three digits per operand, and do not invent a lesson for 3×3.

The existence and order of the first three lessons are confirmed. Their **specific owner-authored instructional scripts and demonstrations have not been recovered**. Build the lesson cards, views, and authored-step capability without attributing improvised teaching text to Jeff. Math calculations can be verified with ordinary arithmetic, but that does not authorize inventing his pedagogy.

## 3. Visual form and instructional help

- Write the arithmetic operands **horizontally, side by side**, with the operation symbol between them. **Never stack the two numbers vertically** in the worked demonstration.
- Use **large Arial numerals**, generous spacing, dark contrast on a warm **sepia** background.
- Include a **small circled question mark ( ? )** associated with a worked problem. Activating it opens an **interactive instructional demonstration**. This is an explicit design element, not an invitation for generic hints.
- In the demonstration, **highlight the relevant operand digits** for the current step. Only the step's relevant positions should be emphasized; keep enough context visible to follow the full expression.
- Show the intermediate calculation and any carry associated with that step. Advance step by step. The learner controls the instructional progression; it is **not** the rapid-fire ten-question practice loop.
- For keyboard and assistive technology access, the `?` control must be focusable and clearly labeled nonvisually; digit highlights must not rely on color alone.

## 4. Two-digit multiplication: owner's named sequence

The owner's **actual spoken names and order** are:

**“First, Inside, Outside, Last.”**

These are *stage names*, not a newly approved acronym. **Do not name the method “FIOL,” “FOIL,” “FEAL,” or another abbreviation.** A previous assistant attempted to impose acronyms and misheard “last” as “left”; those alterations were corrected.

The interactive demonstration should preserve this order and these behaviors:

1. **First:** highlight the *first relevant digit pair* and show their multiplication.
2. **Inside:** highlight the *inside digit pair* and show their multiplication.
3. **Outside:** highlight the *outside digit pair* and show their multiplication; show the **inside and outside products being added**.
4. **Last:** highlight the *last digit pair* and show their multiplication.
5. Throughout the demonstration, visibly account for **carrying between intermediate operations** and build the **answer digits sequentially**. The earlier discussion described three sequential answer-digit stages; do not reinterpret that phrase as a universal claim that every two-digit product has exactly three digits. Two-digit operands can yield three- or four-digit products.

The recovered explanation mentioned an intermediate multiplication producing **64**: the instructor **writes 4 and carries 6** onward into the inside/outside calculation. A further carry into the final stage was also described. Preserve that description as an *example of the carrying explanation*, **not** as a complete executable fixture: the original operand pair and full arithmetic trace for that example are not present in the recovered handoffs.

**Important implementation boundary:** The source material does **not** unambiguously specify which concrete character indices correspond to “first/inside/outside/last,” the exact positional-weighting and carry destinations, or a complete verified worked example. Standard FOIL conventions are **not** permission to fill those in. Build the stage UI, highlighting mechanism, carry visualization, and step-data schema now; do not claim that a placeholder implements Jeff's finished mathematics. Do not silently choose a different algorithm.

## 5. Separate learning behavior from practice behavior

Learning pages must not start the ten-question practice timer or consume a practice score. The **circled `?`** opens the instructional walkthrough and the learner may advance/back through the demonstration. This does **not** change practice's rules:

- Practice automatically submits once the expected answer digit count is entered.
- Practice advances immediately after correct *or* incorrect answers.
- Practice has a live timer, upper-left prior-time feedback, and a final score out of ten.
- Practice has no mistakes review, hint pauses, or step-by-step solution between questions.

A help control in **Learn** must **not** become a hint or review screen in timed **Practice**.

## 6. Concrete architecture requested

Implement separate components/modules for:

- `LessonCatalog`: four lessons in the confirmed order, without age-based tracks.
- `LearnView`: horizontal arithmetic expression, lesson name, large numerals, circled-question-mark control, and learner-directed demonstration navigation.
- `InstructionStepRenderer`: consumes authored step data and highlights relevant operand-digit references; renders product/sum/carry/result fragments when provided.
- `CarryVisualizer`: can display a carried digit/value moving from one authored step to the next **without inventing arithmetic meaning**.
- `PracticeView`: remains governed by the existing timed-practice specifications.

Use an **explicit data-driven lesson schema**. A possible structure (names are implementation suggestions, not owner-specified terminology):

```ts
type InstructionStep = {
  id: string;
  stageName?: 'First' | 'Inside' | 'Outside' | 'Last';
  highlightedDigitRefs: string[]; // concrete digit refs supplied by authored lesson data
  operationDisplay?: string;      // verified intermediate expression
  intermediateResult?: string;    // verified intermediate arithmetic
  carryIn?: string;
  carryOut?: string;
  visibleResultDigits?: string;   // digits already established by this lesson step
  narration?: string;             // only source-supported or later owner-authored text
};
```

Make addition lessons and multiplication lessons reuse the same display primitives without forcing the multiplications' four stage names onto addition.

For lessons without a verified script, show a **structural lesson view** (title, horizontal example area, explanation control that can indicate that authored steps are pending) rather than making up proprietary instructional content. Avoid exposing misleading arithmetic or declaring those lessons finished.

## 7. Data and tests

Read `INSTRUCTIONAL_LESSON_DATA.json`, which preserves the lesson registry and the named two-digit multiplication stages **without falsely assigning operand character indexes**. Use this as initial data, extend only with arithmetic content actually verified or approved.

Write acceptance tests verifying:

1. Learn and Practice are both accessible.
2. The Learn catalog contains the **four specified lessons in order**.
3. Learn does **not** start the practice timer, advance through ten problems, or affect practice scoring.
4. Arithmetic operands in instructional mode are **horizontal**.
5. The circled `?` opens an interactive, accessible walkthrough affordance.
6. The engine can highlight *exactly* the digit references supplied for a step.
7. The two-digit multiplication demonstrator's stage labels are **First → Inside → Outside → Last**; it must not display an invented acronym.
8. The demonstration can render intermediate products, addition of the inside/outside products, carry information, and progressive result digits when supplied by verified lesson data.
9. No invented 3×3 instruction appears.
10. Practice retains its **immediate progression and no-review** behavior even though Learn offers instruction.
11. A missing full worked example is clearly reported as such in the implementation handoff, not quietly replaced with textbook steps.

## 8. Build priorities and delivery

1. Update the project navigation to expose **Learn** and **Practice**.
2. Implement the four lesson entries, horizontal instruction layout, and circled `?` demonstration shell.
3. Implement generic step-state controls and digit highlighting, intermediate result and carry display using supplied authored data.
4. Implement the named two-digit multiplication stage sequence as a **structural interactive preview**, not a falsely complete algorithm.
5. Integrate with the practice engine without altering the practice requirements.
6. Run tests and document what is working, what is structurally ready, and which owner-specific arithmetic step details remain unverified.

The original project's goal is an instructional **and** practice website. Do not deliver a practice-only site and call it complete. Do not ask the owner to reconstruct settled requirements that are written above.

**No GitHub repository creation, production deployment, or DNS changes without express authorization.**
