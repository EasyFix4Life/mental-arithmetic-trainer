# Mental Arithmetic for macOS

**1.1.4 Inside/Outside correction:** Two-digit multiplication now uses **Inside = top units × bottom tens** and **Outside = top tens × bottom units**, including their highlighted digits, calculations and intermediate results. For **82 × 76**, these are **2 × 7 = 14** and **8 × 6 = 48**. Learn and Practice retain **two-digit addition** and **one-, two- and three-digit multiplication**. Use the [current release](https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/tag/v1.1.4) or [website downloads](https://whoami.school/#app-downloads). See [the correction report](verification/INSIDE_OUTSIDE_CORRECTION.md).

This desktop build contains the same Learn and Practice application as the website, packaged with its own runtime. It runs offline, without Node.js, npm, a browser tab or a local HTTP server on the user's computer.

## Open or install

Use **Mental-Arithmetic-1.1.4-macOS-arm64.dmg**. Open the disk image and drag **Mental Arithmetic.app** to **Applications**, then open it there. The alternative ZIP contains the same standalone app bundle.

This build targets **Apple silicon Macs**, with **macOS 13.0 or later** required by the bundled runtime. It was built and tested on this Apple silicon Mac running macOS 27.2. It is not an Intel Mac or Windows build.

The app has a valid **ad hoc code signature** for this local build. It has **not been notarized by Apple** and does not have a Developer ID distribution signature. Publicly notarized distribution is not part of this local delivery.

On this Mac, synced Documents adds Finder metadata to app/framework directories, which interferes with signing. Packaging therefore occurs in temporary staging; the finished ZIP and DMG are copied into the outputs folder. Using the DMG to place the app in Applications keeps the runnable bundle outside that synced build location. No system security settings were changed.

## Equivalent application behavior

- Sepia background, Arial numerals and responsive layout.
- Learn and Practice remain separate. All four available lessons provide complete instruction and **New random example**: two-digit addition and multiplication with one-, two- and three-digit operands. Their ranges are 1–9, 10–99 and 100–999; an immediately reversed duplicate is avoided too. Addition operands are arranged above and below one another with aligned columns and a horizontal rule; multiplication operands remain horizontal.
- Two-digit multiplication retains **First → Inside → Outside → Last**, required carry screens and **Final answer** after Last. The owner-confirmed 12 × 12 and 18 × 18 demonstrations remain selectable. Three-digit multiplication follows the owner's five specified product groups, including the specified middle-group order. Addition calculates the corresponding columns from left to right, then resolves carries from right to left. Single-digit multiplication uses the one-product base case. Generated examples apply these methods to new operands; they are not individually owner-authored scripts.
- Practice supports two-digit addition and one-, two- or three-digit multiplication, ten unique problems, automatic submission, immediate advancement, both timer displays, final score out of ten and manual restart. It also shows maximum, minimum and average answer time for each completed round, using all ten full-resolution durations, including incorrect submissions. Practice's provisional one-digit range remains 1–9.
- Native Mac Edit, View and Window menus; copy/paste and standard keyboard behavior. Command-Q quits. Closing the window follows the normal Mac app lifecycle; reopening from the Dock creates a window again.
- No account, server, analytics, auto-update or new scoring policy was added.

The desktop and website share the same source and production frontend. The random Learn examples and round timing summaries apply to both. The desktop wrapper loads that production build using `app://trainer/index.html`, a bundled local protocol. No localhost server is involved. The wrapper uses renderer isolation and sandboxing and exposes no Node or IPC bridge, following the [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

## Source commands

Use the included source project and its locked dependencies:

```bash
npm ci
npm run desktop
```

The first dependency installation downloads the desktop runtime. `npm run desktop` builds the web frontend and launches Electron from the project root. Direct entry-file launches also resolve the build correctly.

Build the Apple silicon disk image and app ZIP on a Mac:

```bash
npm run build:mac
```

The final archives appear in `release/`. `scripts/build-mac.mjs` stages the `.app` in a unique system temporary directory so File Provider metadata cannot interfere with signing. The current staging location is recorded in `verification/desktop-build-location.json`. A directory-only build is available with `npm run build:mac:dir`.

## Verification

```bash
npm test
PW_CHANNEL=chrome npm run test:browser -- --workers=2
npm run test:desktop
```

By default, the desktop tests launch the source shell against the production build. To test a packaged application, set `DESKTOP_EXECUTABLE` to its `Contents/MacOS/Mental Arithmetic` executable before running `npm run test:desktop`. The suite follows [Playwright's Electron testing API](https://playwright.dev/docs/api/class-electron), and requires no Vite server.

Current results and package-integrity evidence are recorded in `verification/INSIDE_OUTSIDE_CORRECTION.md`, `verification/inside-outside-macos-results.json` and `verification/inside-outside-mac-package.json`; `verification/MACOS_TEST_RESULTS.md` remains a historical baseline. The equivalent Windows 10/11 x64 build and its verification limits are documented in `WINDOWS_APP.md`.
