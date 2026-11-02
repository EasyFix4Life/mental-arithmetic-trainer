# Mental Arithmetic — 1.1.2

**1.1.2 available-options update:** Learn and Practice offer **two-digit addition** and **one-, two- and three-digit multiplication**. One-digit and three-digit addition have been removed at the owner's request. The prominent **? Click Here to Learn How!** button remains in every available lesson. See [the update report](verification/ADDITION_OPTIONS_UPDATE.md) for current checks; older verification reports are historical baselines.

Mental arithmetic lessons and ten-problem Practice for **web, macOS, Windows 10/11, Android, iPhone and iPad**. All versions offer **two-digit addition** and **one-, two- and three-digit multiplication**. Each of the four Learn categories has complete instructions, random examples, digit highlights, carry steps and a final answer. The prominent **? Click Here to Learn How!** button opens the walkthrough in every lesson. Addition uses operands above and below one another, aligned by place value. The owner's confirmed **12 × 12 = 144** and **18 × 18 = 324** demonstrations remain available unchanged.

Practice preserves the original behavior: ten unique unordered operand pairs, large Arial numerals on sepia, automatic submission at the expected digit length, immediate advancement after correct and incorrect entries, a live timer beside the bottom-right answer field, and the previous time in black or red at the upper left. A completed round shows score out of ten and maximum, minimum and average answer times. Each new round starts manually. Learn remains separate from active timed Practice.

There is no backend, account, advertisement, analytics, saved learner history, explanation or mistake review during Practice. The apps run offline. The web application is also live at **https://whoami.school/** through its existing Cloudflare Pages project. App Store/Play Store submission is not included.

## Downloads and platform guides

The public GitHub repository is [EasyFix4Life/mental-arithmetic-trainer](https://github.com/EasyFix4Life/mental-arithmetic-trainer). The [v1.1.2 release](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/tag/v1.1.2) carries the downloadable packages. Local packages are also in the parent `outputs` folder.

The live website's **Download Apps** link opens clearly labeled macOS, Windows, Android, and iPhone/iPad download cards, plus web and complete-source ZIP links. macOS requires Apple silicon and macOS 13 or later; Windows supports Windows 10/11 x64; Android requires Android 8 or later. iOS downloads are unsigned Xcode development files, not a directly installable app or an App Store listing. Download links use the fixed, tested v1.1.2 release assets. This website-only section stays hidden during active Practice and is excluded from native app shells.

| Platform | Package | Guide |
| --- | --- | --- |
| Web | Production `dist/` ZIP and editable Vite/TypeScript source | This README |
| macOS 13+ Apple silicon | Standalone app DMG or fully extracted app ZIP | [MACOS_APP.md](MACOS_APP.md) |
| Windows 10/11 x64 | Setup EXE or fully extracted app ZIP | [WINDOWS_APP.md](WINDOWS_APP.md) |
| Android 8+ | Signed APK, targeting Android 17/API 37 | [ANDROID_APP.md](ANDROID_APP.md) |
| iOS/iPadOS 17+ | Native Swift/UIKit Xcode project, unsigned device archive and simulator app | [IOS_APP.md](IOS_APP.md) |

The iOS version is prepared using the owner's requested **Xcode 27 beta**, build 27A5228h. Apple Developer enrollment has not been completed, so its device archive is unsigned. It is not an installable signed IPA or an App Store listing. Submission drafts are under `ios/AppStore/`.

## Launch the web version

Use Node.js 22.12+ within 22.x, 24.x, or 26+. This release uses Node 26.11.1 and npm 11.20.0.

```bash
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. The server listens on this computer's loopback interface. Stop it with Ctrl+C. If 5173 is occupied, use `npm run dev -- --port 5174` and the printed URL. Browser tests expect port 5173.

Choose **Learn**, then any lesson. Each selection begins with a random example. **New random example** avoids immediately repeating the same operand pair, including its reversal. The ranges are 1–9, 10–99 and 100–999. Choose **? Click Here to Learn How!** for the walkthrough, then use Next, Back or its navigation buttons. Two-digit multiplication keeps **First → Inside → Outside → Last → Final answer**. Other lessons use neutral Step labels; the carry screens precede the final answer. The fixed 12 × 12 and 18 × 18 examples remain in the two-digit multiplication selector.

Choose **Practice**, select an operation and digit count, then **Start**. Type digits; the expected final digit submits without Enter. Learn navigation is hidden during the round. After ten submissions, score and timing appear; **Start Another Round** starts the next round. Visiting Learn between rounds preserves selected settings and the completed result.

Round statistics include all ten submissions, including incorrect answers. They use full-resolution durations; the average is calculated before display truncation. Times display completed tenths of a second. Statistics clear when a new round starts; no history is stored.

## Tests and builds

```bash
npm test
npm run typecheck
npm run build
PW_CHANNEL=chrome npm run test:browser
npm run test:desktop
```

Browser tests use installed Google Chrome when `PW_CHANNEL=chrome`. Alternatively run `npx playwright install chromium` and omit the environment variable. The mobile browser project is a Chromium iPhone viewport/touch emulation, not Safari or physical iPhone testing.

```bash
npm run build:mac
npm run build:windows
npm run build:android
npm run build:ios:simulator
npm run build:ios
```

Platform toolchain and signing details are in the guides. Desktop packaging stages outside the Documents File Provider folder to avoid resource-fork signing problems. Android reuses its persistent release key; signing secrets are excluded from this repository and source archives. iOS prefers `/Applications/Xcode-beta.app/Contents/Developer`, respects `DEVELOPER_DIR`, and produces unsigned outputs until a team is assigned.

To review the production web build, run `npm run preview` and open http://127.0.0.1:4173/. Serve `dist/` over HTTP; opening HTML directly as a file is not the supported browser launch path.

## Explicit provisional input decisions

These are isolated implementation choices from the supplied v1 specification, not newly confirmed teaching rules:

1. One-digit operands use **1–9**, preserving the provisional exclusion of zero. Ranges are isolated in `src/generateRound.ts` and the separate Learn generator.
2. Backspace edits incomplete input. Submitted answers cannot be edited. This is explicit in `src/inputPolicy.ts`.
3. Each separate physical input event belongs to the problem active when it arrives. A digit typed after automatic submission starts the next answer. The owner's preferred attribution of accidental extra physical keystrokes remains unresolved. A single overlong transaction, such as paste, is incorrect exactly once; excess digits never spill into the next problem.

Only ASCII decimal digits are accepted. Invalid transactions are rejected whole, preserving prior incomplete input. Signs, spaces, separators, letters and non-ASCII numerals are not normalized. Leading zeros are compared exactly and cannot produce a correct positive answer. The native Swift core mirrors these policies.

## Architecture and instructional provenance

The arithmetic generators, answer/input policy, monotonic timer and round state are separate modules. Learn has no dependency on the Practice controller or timer. `src/learn/positionalInstructions.ts` generates explicit instruction data; the renderer displays it. Future teaching methods can be incorporated at that boundary without changing Practice. The iOS Foundation core mirrors the same boundary; UIKit is a separate presentation layer.

| Path | Responsibility |
| --- | --- |
| `src/generateRound.ts`, `roundController.ts` | Unique rounds, immutable transitions and raw timing |
| `src/answerPolicy.ts`, `inputPolicy.ts`, `timer.ts` | Exact input behavior and timing policies |
| `src/practiceView.ts`, `view.ts` | Practice rendering and mode navigation |
| `src/learn/lessonCatalog.ts`, `lessonTypes.ts` | Four available lesson categories and explicit step schema |
| `src/learn/confirmedMultiplicationExamples.ts` | Preserved owner-confirmed fixed examples |
| `src/learn/randomExample.ts`, `positionalInstructions.ts` | Random examples and owner-described positional procedure |
| `src/learn/instructionStepRenderer.ts`, `carryVisualizer.ts` | Digit selections, vertical addition, explicit carries and final answer |
| `desktop/` | Offline Electron shell shared by macOS and Windows |
| `android/` | Offline native WebView shell and native instrumentation |
| `ios/MentalArithmetic/Core/`, `UI/` | Native Swift arithmetic/state and UIKit views |
| `ios/AppStore/` | Submission metadata, policy/rating drafts and screenshots |
| `tests/`, `ios/MentalArithmeticTests/`, `ios/MentalArithmeticUITests/` | Shared and native tests |
| `requirements/` | Original supplied package, preserved unchanged |
| `requirements/instruction/` | Original supplied lesson files and separate later owner instructions |
| `verification/` | Actual results, package checks and review evidence |

The original handoff's restrictions on missing scripts and three-digit instruction were superseded by the owner's later all-length instructional request and description of the common algorithm. The subsequent 1.1.2 request removes one-digit and three-digit addition from the available Learn and Practice options. The general arithmetic algorithms and original supplied fixtures remain preserved. The exact later scope is recorded in [OWNER_ADDITION_OPTIONS_2026-11-02.md](requirements/instruction/OWNER_ADDITION_OPTIONS_2026-11-02.md). The original files remain unchanged. Generated examples apply that described method; they are not represented as individually owner-authored examples. See [INSTRUCTIONAL_HANDOFF.md](INSTRUCTIONAL_HANDOFF.md) and its separate provenance record.

## Verification boundaries

See [verification/ADDITION_OPTIONS_UPDATE.md](verification/ADDITION_OPTIONS_UPDATE.md) for the 1.1.2 available-options update, [verification/HELP_BUTTON_UPDATE.md](verification/HELP_BUTTON_UPDATE.md) for the 1.1.1 help-button update and [verification/TEST_RESULTS.md](verification/TEST_RESULTS.md) for the 1.1.0 baseline results and the platform reports beside it. Packaged macOS and Android behavior is tested locally. Windows archive/executable integrity and shared frontend bytes are verified, but Windows 10/11 runtime installation and display scaling still need a Windows host. The native iOS app builds, launches and has separate core/integration evidence; Xcode's service-hub test-runner failure and simulator limitations are recorded explicitly. No claim of physical iPhone/iPad testing or App Store approval is made.
