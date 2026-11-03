# iOS development-download review notes — 1.2.0

Native version **1.2.0, build 10**. Prepared for owner-authorized GitHub/website development downloads. No App Store or TestFlight upload occurred. The prepared ZIP retains the legacy submission-files naming convention but is not a completed Apple submission.

Prepare the final signing, contact information, privacy URL, and App Store Connect fields before submitting this draft.

Mental Arithmetic is an offline, native UIKit app for mental addition and multiplication. No account, login, subscription, advertisement, analytics service, external content download, or in-app purchase is used.

## Practice

1. Select **Practice**. Choose two-digit Addition or Multiplication with one or two digits per operand. Addition offers only **2**; switching from one- or two-digit multiplication to Addition selects **2**. Tap **Start**.
2. Type the answer using the numeric keyboard. Submission is automatic as soon as the expected number of answer digits has been entered. Enter/Return is not required and does not submit.
3. Each accepted entry advances immediately, including incorrect entries. Incorrect answers do not open an explanation or correction screen.
4. The live timer is beside the answer field. The previous completion time appears at the upper left in black. Incorrect feedback additionally shows a black **×** and border; the numeric time is unchanged.
5. After ten unique problems, the app displays the score out of ten and the maximum, minimum, and average answer time for that round. Times include both correct and incorrect submissions. The mean is calculated from raw elapsed durations; displayed times show completed tenths of a second.
6. Another round starts only when the user taps the start control.

## Learn

Choose **Learn**, which defaults to single-digit multiplication and offers only single- and two-digit multiplication. Use **New random example** for a fresh problem. Both lessons provide instructional calculation screens and a final-answer item. Two-digit multiplication follows the owner's confirmed First → Inside → Outside → Last instruction sequence, with carry screens under Last and the final answer after Last. The fixed 12 × 12 and 18 × 18 demonstrations remain available alongside generated examples. Addition appears only in Practice (two digits); three-digit multiplication is absent from both app modes. Historical methods and fixtures remain in source.

The preserved 1.1.4 instruction corrects the Inside/Outside selections: for **82 × 76**, Inside is **2 × 7 = 14** and Outside is **8 × 6 = 48**. Their cross sum is **14 + 48 = 62**, and the final answer remains **6232**.

## Input decision retained from the supplied requirements

The original specification leaves treatment of a later key after automatic submission unresolved. The provisional policy is isolated in `InputPolicy`: a new editing transaction belongs to the problem active when it arrives. A complete overlong insertion is assessed once and its remaining digits are discarded. Decimal digits are ASCII 0–9; separators, signs, spaces, and non-ASCII numerals are rejected rather than converted. Partial deletion is permitted. Leading zeros fail exact answer matching.

## Data and permissions

The app does not send answers, timings, identifiers, or other app data to the developer or third parties. Round state exists in memory during the current process. The application requests no personal-data permissions. No demo account or network access is necessary to review the app.

App Review contact, public support URL, and public privacy URL must be supplied in App Store Connect before submission.

## Installed version

Open the existing **Privacy** sheet from setup or Learn to see **Version 1.2.0 (build 10)**. This identifies the installed release without adding controls during timed Practice.

## Scholarly visual review

Learn alone uses First teal#126C70, Inside/Outside violet#755093 and Last amber#885A15 with equal emphasis. Single-digit instructional steps stay neutral. Static connectors follow only explicit single pairs; carries show their authored origin, whole value and destination. Developing-answer boxes display only the existing result string. Practice is black/white/ivory, including incorrect feedback. Baskerville supplies prose; math remains Arial. Dynamic Type reflows accessible controls, while spatial timed math fits available keyboard space. See `../../design/VISUAL_DESIGN_SPEC.md`, `../../IOS_APP.md` and `../../verification/release-120-ios-summary.json` (current build 10 package audit) and `../../verification/grouped-stages-ios-summary.json` (historical full suite).

## Preview 2 grouped controls

The two-digit multiplication navigation is `[First & [Inside + Outside] & Last] = [Final Answer: ####]`. Four discrete buttons retain their original actions, IDs, instruction order and carry screens. Their bold type, padding and two-point borders are equal. Light matching fills pair with First#126C70, Inside/Outside#755093 and Last#885A15. The plus sign stays inside the outlined middle section; equals and the neutral Final Answer box stay outside the outer enclosure. Literal upright ampersands connect the header; existing carry-route down arrows remain unchanged. Native accessible container order preserves all five separate actions. Other numbered lessons and monochrome Practice remain unchanged.

## Preview 3 connector review

The two header connectors are literal upright **&** glyphs in both wide and stacked layouts. Carry-route down arrows remain unchanged. Preview 3 uses targeted checks against the actual final ZIP-extracted Release app at normal and largest accessibility text; the earlier complete preview 2 suite remains preserved historical proof. Historical preview 3 reports use `verification/ampersand-stages-ios-*`. No store or TestFlight upload occurred.

## Preview 4 availability verification

The approved preview 4 final ZIP-extracted Release audit exercised the exact two-lesson Learn catalog and default, all three Practice configurations, complete automatic-answer rounds and their timing/score, plus the retained grouped ampersands and pair/carry presentation. Portable core tests preserve historical three-digit generators separately from app availability. Historical preview 4 counts and limits are recorded under `verification/options-review-ios-*`.

## Version 1.2.0 development-download package verification

Native build 10 changes the build number and release preparation metadata only. All approved preview 4 app/core/test sources remain identical. Current final ZIP-extracted Release checks run on phone/tablet with expected build 10 and verify offered menus, A2/M1/M2 rounds, score/timing/input, random examples, grouped ampersands, pair/carry progression and enlarged layouts. Current proof uses `verification/release-120-ios-*`. The prior 38 core tests were not rerun for this metadata-only step. No App Store/TestFlight submission or signing is implied.
