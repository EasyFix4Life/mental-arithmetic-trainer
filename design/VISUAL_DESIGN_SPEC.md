# Mental Arithmetic visual design specification

Production edition: **1.2.0**, 3 November 2026. Baseline: the approved **1.2.0-preview.4**, local commit `2cd3f1e6f15c0709fe444ff9cf32585d41ac89e2`, which preserves the latest published **1.1.4** arithmetic and behavior. Development branch: `design/scholarly-visuals-2026-11-03`.

This specification implements the owner's [attached design brief](../requirements/design/Math_Trainer_Work_Design_Brief_2026-11-03_NEW.md). The brief's references to a private repository and release 1.1.0 are historical. The corrected 1.1.4 arithmetic, Inside/Outside mapping, available lesson choices, random examples and Practice timing are the starting point.

## Current mode options

The owner's [preview 4 option revision](../requirements/design/OWNER_APP_OPTIONS_2026-11-03.md) controls the current local app offerings. **Learn** contains only single-digit and two-digit multiplication, in that order, starting with the first available lesson. **Practice** offers two-digit addition, single-digit multiplication and two-digit multiplication. The two-digit addition Practice option is retained; addition instruction and three-digit multiplication are removed from active menus. Arithmetic engines, historical lesson data and test fixtures remain separate from these availability policies. The instructional method, ampersand layout, visual tokens, scoring, input and timing behavior are preserved.

## Design tokens

The canonical, reusable source is [visual-tokens.json](visual-tokens.json). Run `npm run design:tokens` to generate the CSS, Swift and Android resources; `npm run design:check` verifies all three agree with it. The normal web/desktop/Android frontend build includes that consistency check.

| Purpose | Exact value |
|---|---|
| Paper/background on every platform | `#FAF7F0` |
| Ink and all Practice foregrounds/borders | `#000000` |
| Answer fields and neutral white surfaces | `#FFFFFF` |
| Learn: First | `#126C70`, restrained teal |
| Learn: Inside and Outside | `#755093`, the same muted violet |
| Learn: Last | `#885A15`, restrained warm amber |

The three instructional colors have closely matched contrast against the ivory paper, approximately 5.6–5.9:1. Automated checks require at least 4.5:1 and less than 10% variation between the highest and lowest contrast. Every named stage box uses the same bold type, padding and 2-unit border. Stage fills are First `#E2F1EF`, Inside/Outside `#EEE5F4`, Last `#F6ECD8`; matching text contrast is approximately 5.1–5.3:1. The selected stage adds an underline rather than a different weight or border thickness; mathematical digits remain clear, with labels and selection outlines providing non-color cues.

The palette is scoped to **Learn**, including its named stage controls, selected digit pairs, connectors and carry routes. Shared navigation, downloads and all Practice states use neutral ink/white/ivory. Numbered/addition instructional stages remain neutral; they do not acquire new multiplication stage names.

## Typography and spacing

- Headings, explanatory text, labels and controls use **Baskerville**, followed on the web by Palatino Linotype, Book Antiqua, Georgia and the platform serif family. Native UIKit uses Baskerville with a native serif fallback.
- Operands, operators, calculations, developing/final answers, answer entry, timers and numeric scores use **Arial**. CSS retains Helvetica/sans-serif fallbacks where Arial is unavailable; native UIKit requests `ArialMT` and its bold face. No proprietary font files are redistributed. Platform fallback availability is reported honestly rather than asserting that Android contains an installed Arial font.
- Use scalable text and suitable line height (about 1.55 for explanatory prose), with mathematics sized independently and kept large. Dynamic Type and text zoom must retain readable content rather than clip or hide it.
- Spacing follows 4, 8, 12, 16, 24, 32 and 48 units. Web values scale through rem units; native points express the same rhythm.
- Normal borders are 1 unit; selected/focused emphasis is 2 units. The control corner radius is 4 units. Touch targets are at least 44 CSS pixels/native points; the prominent **Click Here to Learn How!** control keeps its 64-unit minimum.
- Use generous but practical margins, restrained rules and deliberate alignment. No textures, gradients, ornamental shadows or instructional animation are added.

## Grouped stage structure

The owner's [follow-up specification](../requirements/design/OWNER_GROUPED_STAGE_LAYOUT_2026-11-03.md) adds this visual hierarchy to the existing four-stage multiplication lesson:

`[ First & [ Inside + Outside ] & Last ] = [ Final Answer: #### ]`

The stage enclosure contains First, the visibly outlined middle section, and Last. The middle section contains two distinct tinted buttons and a visible plus sign. The equals sign and neutral black/white Final Answer box are outside the stage enclosure. The owner’s [literal-ampersand correction](../requirements/design/OWNER_AMPERSAND_CONNECTORS_2026-11-03.md) replaces the two header arrows with upright **&** symbols, in both horizontal and stacked layouts. The ampersands connect the stages visually; they do not add an arithmetic operation. Carry-route arrows remain unchanged. Four colored boxes always use bold text, matching tint, equal 2-unit borders and equal padding; selected-state underlining retains a separate non-color cue.

The logical focus/action order stays First, Inside, Outside, Last, Final Answer. Direct stage/final selection and Next/Back retain their existing behavior. On narrow or enlarged-text layouts, the outer units may stack and the middle pair may stack around its plus sign, while remaining inside the same outlined middle group. No labels are split into letters or clipped. Other numbered lessons keep their existing navigation and do not acquire invented four-stage names.

## Digit pairings

The equation remains the centerpiece. Multiplication stays horizontal; addition stays vertically stacked and place-aligned. Selected digits retain their existing authored references, augmented by a static connector/bracket where the current calculation identifies a single pair unambiguously. The connector supplements a consistent selected-digit treatment and readable calculation text.

For horizontal `ab × cd`, the unchanged contract is:

| Stage | References | Pair |
|---|---|---|
| First | `left:0`, `right:0` | `a × c` |
| Inside | `left:1`, `right:0` | `b × c`, the two inner digits |
| Outside | `left:0`, `right:1` | `a × d`, the two outer digits |
| Last | `left:1`, `right:1` | `b × d` |

Inside and Outside share violet because both contribute to the middle group. Their spatial pairing, stage labels and calculation distinguish them. No acronym or alternative teaching sequence is introduced.

Pair connectors must agree with the selected digits and current calculation. A carry-completion screen may highlight an earlier group without recalculating that operand pair; it must not gain a misleading multiplication connector. Multi-product groups retain their explicit grouped highlights/calculations rather than guessed pairings. The renderer performs no new arithmetic and does not alter the lesson generators.

## Carries and developing answers

Present each carry as a readable static route: **origin → carried value → destination**. Use the existing `carryFrom*`, `carryTo*`, `carryIn` and `carryOut` values and labels. Where one screen has incoming and outgoing carries, show their routes separately. Include the calculation context so the learner can see what is being carried and where it is used.

Preserve the full carried value, including multi-digit carries such as 13. Do not truncate to one digit, alter carry direction, add automatic steps or change the final answer. Two-digit multiplication carry screens remain within the existing Last sequence; other lessons retain their existing numbered steps. The developing answer uses the existing visible-result characters in aligned slots; empty places remain empty, and no answer is revealed earlier.

## Practice monochrome and behavior

Practice uses black text/symbols/borders, white answer fields and the shared ivory page. The previous-answer time stays in the upper-left corner, and the current timer remains beside the answer field at the bottom right. Incorrect feedback uses a **black × marker and border/weight distinction** instead of red. Its accessible label continues to identify correctness, so color is not required.

Preserve the numeric time text, immediate progression, input transaction policy, expected-digit automatic submission, scoring, all ten raw timings, min/max/average statistics and manual round starts. The × marker is presentation, not an input character or a new review step. No Learn colors, red/green feedback, hint detours, review screens, accounts, backend or analytics are added.

In short landscape keyboard viewports, the problem uses the left region and the answer/live timer retain the bottom-right region; feedback stays upper-left. A container query respects the actual visual viewport height even when the layout viewport remains tall. Native UIKit fits the rendered mathematics using actual Dynamic Type traits after keyboard layout resolves.

System keyboards and accessibility settings remain under platform control. App-owned selection, tint, borders, focus and feedback follow this specification; the implementation does not replace native keyboards or weaken system accessibility choices.

## Approved publication and delivery

The owner approved publishing the completed preview 4 to whoami.school and GitHub app downloads on 3 November 2026. Production release **1.2.0** preserves that approved interface and behavior, with updated release metadata/download destinations. Public download cards point to version **1.2.0**. Android uses code **10204**; native Apple uses **1.2.0/build 10**, built with Xcode beta. iOS files remain clearly labeled Xcode development/simulator downloads, with an unsigned device archive rather than an installable IPA or App Store listing.

No registrar, DNS, TLS or unrelated hosting settings need to change. The existing Cloudflare Pages project deploys the approved source from main after the complete GitHub release assets are available. Earlier release assets and all original requirements remain preserved. Current verification is recorded in `verification/RELEASE_1_2_0_RESULTS.md`; external live/deployment/download checks are recorded after publication.
