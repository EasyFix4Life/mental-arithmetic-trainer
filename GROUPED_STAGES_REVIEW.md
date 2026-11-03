# Review the grouped instructional stages

Local review edition **1.2.0-preview.2**, based on the completed scholarly preview 1 (`f01c38aa8f14ea6f752db9a4c37ed94e3ffd0969`). The published application remains **1.1.4**. Development branch: `design/scholarly-visuals-2026-11-03`.

## Visual arrangement

`[ First → [ Inside + Outside ] → Last ] = [ Final Answer: #### ]`

The outer enclosure contains First, the middle section and Last. Inside and Outside remain separate violet boxes inside the middle section, with an explicit plus sign. The equals sign and Final Answer box sit outside the stage enclosure. Arrows are visual connections rather than multiplication operations.

All four named stages have equally bold text, 2-unit borders and matching padding. First uses teal `#126C70` on `#E2F1EF`, Inside/Outside violet `#755093` on `#EEE5F4`, and Last warm amber `#885A15` on `#F6ECD8`. Matching text/background contrast is approximately 5.1–5.3:1. The current stage is underlined; selection does not change its weight or border thickness.

On narrow or enlarged-text layouts, the stage units can stack while retaining their outlines and visual connections. The middle pair stays grouped together, with its plus sign between the two boxes. Other numbered lessons retain their existing stages and navigation.

## Try it locally

Open **http://127.0.0.1:5198/** for the final built review preview. The previous preview remains available separately at port 5196 while its server is running.

1. Choose Learn → Two-digit multiplication → **18 × 18 — carrying**.
2. Open **Click Here to Learn How!** and inspect the stage enclosure, middle sum and separate Final Answer box.
3. Activate First, Inside, Outside and Last directly, or use keyboard Tab/Enter and Next/Back. The existing calculations and selected digit references remain unchanged.
4. From Last, choose Next to follow the incoming and outgoing carry routes. Whole values and developing answer boxes are preserved.
5. Activate **Final Answer: 324**, then Back. The existing result/carry progression is retained.
6. Try random examples and a small/enlarged-text view. In Practice, timing, automatic submission, ten-question rounds and monochrome feedback remain unchanged.

## Local review files

Package filenames use **Mental-Arithmetic-1.2.0-preview.2-** in the parent outputs folder:

| Platform | File suffix |
|---|---|
| Web | `Web.zip` |
| Apple silicon macOS | `macOS-arm64.dmg` or `macOS-arm64.zip` |
| Windows 10/11 x64 | `Windows-x64-Setup.exe` or `Windows-x64.zip` |
| Android 8+ | `Android.apk`, code 10201 |
| iPhone/iPad | `iOS-Simulator-app.zip`, `iOS-unsigned-archive.zip`, `iOS-submission-files.zip` |
| Editable source | `all-platforms-source.zip` |

The iOS app uses native version **1.2.0, build 7**, built with Xcode beta. Its device archive is unsigned development software, not an installable IPA or App Store release. The Mac app remains ad hoc signed, and Windows remains unsigned. Actual platform verification and representative screenshots are recorded in [GROUPED_STAGES_REVIEW_RESULTS.md](verification/GROUPED_STAGES_REVIEW_RESULTS.md).

The website's download cards continue to link to **published 1.1.4**. Use the separately supplied local preview files for this review. No preview has been deployed, uploaded to stores or published as a GitHub release.

## Source commands

From the included source project:

```bash
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 5198
```

For development, use `npm run dev -- --port 5199`. The server is local to this computer; stop it with Ctrl+C. Source-build instructions for the native platforms remain in their platform guides. The reusable palette/layout contract is [design/VISUAL_DESIGN_SPEC.md](design/VISUAL_DESIGN_SPEC.md), with canonical tokens in `design/visual-tokens.json`.
