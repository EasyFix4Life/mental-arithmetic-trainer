# Draft App Review notes — version 1.1.4, build 5

Prepare the final signing, contact information, privacy URL, and App Store Connect fields before submitting this draft.

Mental Arithmetic is an offline, native UIKit app for mental addition and multiplication. No account, login, subscription, advertisement, analytics service, external content download, or in-app purchase is used.

## Practice

1. Select **Practice**. Choose two-digit Addition or Multiplication with one, two, or three digits per operand. Addition offers only **2**; switching from one- or three-digit multiplication to Addition selects **2**. Tap **Start**.
2. Type the answer using the numeric keyboard. Submission is automatic as soon as the expected number of answer digits has been entered. Enter/Return is not required and does not submit.
3. Each accepted entry advances immediately, including incorrect entries. Incorrect answers do not open an explanation or correction screen.
4. The live timer is beside the answer field. The previous completion time appears at the upper left in black for correct or red for incorrect.
5. After ten unique problems, the app displays the score out of ten and the maximum, minimum, and average answer time for that round. Times include both correct and incorrect submissions. The mean is calculated from raw elapsed durations; displayed times show completed tenths of a second.
6. Another round starts only when the user taps the start control.

## Learn

Choose **Learn**, select one of the four lessons: two-digit addition or single-, two-, or three-digit multiplication, then use **New random example** for a fresh problem. Every lesson provides instructional calculation screens and a final-answer item. Addition shows digit sums and right-to-left carries. Single-digit multiplication shows the product. Two-digit multiplication follows the owner's confirmed First → Inside → Outside → Last sequence, with carry screens under Last and the final answer after Last. Three-digit multiplication uses the owner-described five groups of digit products followed by right-to-left carries. The fixed 12 × 12 and 18 × 18 demonstrations are available alongside generated examples. Generated examples are implemented from the owner-described methods; they are not represented as individually confirmed scripts or demonstrations.

Version 1.1.4 corrects the Inside/Outside selections: for **82 × 76**, Inside is **2 × 7 = 14** and Outside is **8 × 6 = 48**. Their cross sum is **14 + 48 = 62**, and the final answer remains **6232**.

## Input decision retained from the supplied requirements

The original specification leaves treatment of a later key after automatic submission unresolved. The provisional policy is isolated in `InputPolicy`: a new editing transaction belongs to the problem active when it arrives. A complete overlong insertion is assessed once and its remaining digits are discarded. Decimal digits are ASCII 0–9; separators, signs, spaces, and non-ASCII numerals are rejected rather than converted. Partial deletion is permitted. Leading zeros fail exact answer matching.

## Data and permissions

The app does not send answers, timings, identifiers, or other app data to the developer or third parties. Round state exists in memory during the current process. The application requests no personal-data permissions. No demo account or network access is necessary to review the app.

App Review contact, public support URL, and public privacy URL must be supplied in App Store Connect before submission.

## Installed version

Open the existing **Privacy** sheet from setup or Learn to see **Version 1.1.4 (build 5)**. This identifies the installed release without adding controls during timed Practice.
