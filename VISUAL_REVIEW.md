# Review the scholarly visual preview

This local **1.2.0-preview.1** design preview starts from the latest published **1.1.4**, including the corrected Inside/Outside method and two-digit-only addition. It is on `design/scholarly-visuals-2026-11-03`. The production website and public release remain 1.1.4 pending review.

## What to look at

1. Open Learn → Two-digit multiplication → **18 × 18 — carrying** → **Click Here to Learn How!**.
2. Compare First, Inside, Outside and Last. Teal marks First, violet marks both middle contributions, and amber marks Last. The bracket connects the actual selected digit pair; the calculation and accessible digit descriptions remain authoritative.
3. Advance through Last. Check the **Last (64) → carry 6 → Carry to the middle** route, followed by the incoming/outgoing carry routes and developing answer slots. Carries retain their whole values.
4. Choose **New random example**, and compare Inside/Outside on unequal operands. The fixed 12 × 12 and 18 × 18 examples remain available, and every example retains its final answer.
5. Try two-digit addition. Its operands and calculation terms remain vertically aligned. Other lessons retain their existing numbered stages.
6. In Practice, enter a wrong answer with the expected digit length. The next problem appears immediately; the previous time is black with a **×** and border. There is no colored feedback or review interruption. Finish ten problems to check the score and min/max/average timing.

## Run the website locally

From the source project, with the existing Node toolchain:

```bash
npm ci
npm run dev -- --port 5196
```

Open `http://127.0.0.1:5196/`. If reviewing an already-built preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 5196
```

The final handoff records the actual running review URL. These commands only listen on this computer. Stop a server with Ctrl+C. `dist/` should be served over HTTP rather than opened directly as a file.

## Review packages

Current preview packages use the prefix **Mental-Arithmetic-1.2.0-preview.1-** in the parent outputs folder:

| Platform | Local preview |
|---|---|
| Web | `Web.zip` |
| Apple silicon macOS | `macOS-arm64.dmg` or `macOS-arm64.zip` |
| Windows 10/11 x64 | `Windows-x64-Setup.exe` or `Windows-x64.zip` |
| Android 8+ | `Android.apk`, code 10200, same app/signing identity |
| iPhone/iPad | `iOS-Simulator-app.zip`, `iOS-unsigned-archive.zip`, `iOS-submission-files.zip` |
| Editable source for all platforms | `all-platforms-source.zip` |

These are review builds. The website's download cards continue to point to the **published 1.1.4** files, not nonexistent public preview assets. Use the separately supplied local file links for this design review.

macOS retains an ad hoc signature and is not notarized. Windows remains unsigned and needs a Windows computer for native runtime validation. Android can be installed as an update over 1.1.4. Native UIKit identifies itself as **1.2.0, build 6**, and is built with Xcode beta; its unsigned device archive is not an installable IPA or App Store listing.

## Reuse and verification

The exact palette, fonts and layout rules are in [design/VISUAL_DESIGN_SPEC.md](design/VISUAL_DESIGN_SPEC.md). `design/visual-tokens.json` is the canonical token source; `npm run design:tokens` regenerates all platform resources and `npm run design:check` verifies them.

Actual results and representative screenshots are recorded in [verification/VISUAL_REVIEW_RESULTS.md](verification/VISUAL_REVIEW_RESULTS.md). No store, website deployment, hosting or DNS changes are part of this review delivery.
