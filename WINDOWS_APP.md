# Mental Arithmetic for Windows 10 and 11

**1.1.2 available-options update:** Learn and Practice offer **two-digit addition** and **one-, two- and three-digit multiplication**. One-digit and three-digit addition have been removed at the owner's request. The prominent **? Click Here to Learn How!** button remains in every available lesson. See [the update report](verification/ADDITION_OPTIONS_UPDATE.md) for current checks; older verification reports are historical baselines.

Version **1.1.2** packages the same Learn and Practice frontend as the macOS version with a Windows desktop runtime. The target is **Windows 10 or Windows 11 on a 64-bit Intel/AMD PC (x64)**. Electron 45.0.0 lists Windows 10 and later among its supported platforms and provides x64 binaries; see its [version-specific platform support statement](https://raw.githubusercontent.com/electron/electron/v45.0.0/README.md). This delivery does not include a 32-bit Windows or native Windows ARM64 package.

The app runs offline. A user installing the finished app does not need Node.js, npm, a browser tab, an account or a local web server.

## Download and install

Choose one of these two files:

- [Mental-Arithmetic-1.1.2-Windows-x64-Setup.exe](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.2-Windows-x64-Setup.exe) — the normal Windows installer. Copy or download it to the Windows PC, open it, choose the installation folder and complete the wizard. It installs for the current user, without requesting administrator elevation. It creates Start menu and desktop shortcuts and can open the app when installation finishes. Windows' normal Installed Apps control can uninstall it.
- [Mental-Arithmetic-1.1.2-Windows-x64.zip](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.2-Windows-x64.zip) — the alternative extracted-app distribution. Use **Extract All**, then open **Mental Arithmetic.exe** inside the extracted folder. Keep the whole folder together, including `resources`, `locales` and the runtime DLLs. Opening the executable directly inside the ZIP or copying only that executable is not a supported launch path.

The application and installer are **unsigned**. Windows may display an unknown-publisher or SmartScreen prompt. No Windows signing certificate, Microsoft Store publication or system security setting change is part of this delivery.

Closing the Windows app's final window quits it. Reopen it using its shortcut or the extracted executable to start again. The native Edit and View menus provide standard clipboard and zoom controls.

## Same lessons, examples and Practice timing

- Sepia background, large Arial numerals and responsive layout remain the same.
- Learn lists four available lessons, with full instruction, random examples and **New random example** for two-digit addition and one-, two- and three-digit multiplication. Single-digit examples use 1–9, two-digit examples use 10–99 and three-digit examples use 100–999. The next random pair avoids the immediately previous pair, including its reversal. Addition uses vertically aligned operands and a horizontal rule in Learn and Practice; multiplication remains horizontal.
- Two-digit multiplication applies the confirmed **First → Inside → Outside → Last** method, including required carries, then shows **Final answer** after Last. The owner-confirmed **12 × 12** and **18 × 18** demonstrations remain selectable. Three-digit multiplication uses the owner's five product groups in their specified order. Addition calculates matching digit columns from left to right, then resolves carries from right to left. Single-digit multiplication uses the one-product base case. Every walkthrough ends with its final answer. Generated examples are new calculations using these methods.
- Practice has two-digit addition and one-, two- or three-digit multiplication, ten unique problems per round, automatic answer submission at the expected digit count, immediate advancement after correct and incorrect submissions, the live timer beside the answer field, and the previous answer's time in black or red.
- Each completed set shows the score out of ten plus **Maximum time**, **Minimum time** and **Average time**, in seconds. All ten accepted submissions count, including incorrect answers. The average uses the full-resolution durations before display in completed tenths. A new round starts only when requested. Timing summaries clear when another round starts; no previous-round history is saved.

The Windows app bundles the same production frontend as the macOS app. Its shared desktop wrapper loads `app://trainer/index.html` from the application archive. There is no localhost dependency, analytics, backend or auto-update service. The provisional keyboard-handling decisions remain documented in [README.md](./README.md).

## Build from source

Use the included source project and the Node.js versions specified in [README.md](./README.md). The first dependency installation downloads the runtime and build tools.

```text
npm ci
npm run build:windows
npm run verify:windows -- release/Mental-Arithmetic-1.1.2-Windows-x64.zip release/Mental-Arithmetic-1.1.2-Windows-x64-Setup.exe
```

The finished installer and ZIP are copied to `release/`. The script uses temporary staging and records its unpacked executable and archive paths in `verification/windows-build-location.json`. It invokes electron-builder with `--publish never`; it does not publish an application or create a repository.

`electron-builder.windows.json` extends `electron-builder.json` and adds only the Windows target configuration. The Mac base configuration is preserved. The Windows configuration creates an assisted NSIS installer for the current user, allows choosing the installation directory, disables elevation and code signing, and retains executable product/version metadata. Every file in the ZIP matches its installer-payload counterpart; the installer also includes the standard NSIS elevation helper, which is recorded separately in the verification report.

To launch the shared desktop app from source on the current operating system:

```text
npm run desktop
```

That command builds the frontend and launches the locally installed Electron runtime. It is not a command for running a Windows executable on a Mac.

## Verification and limits

The build and verification records distinguish packaging from native execution:

- `verification/addition-options-windows-build.txt` records the Windows packaging command's output.
- `verification/addition-options-windows-artifacts.json` records the checked release bytes, SHA-256 hashes, ZIP integrity, installer signature/embedded payload, x64 PE executable and DLL headers, required runtime resources, packaged version and frontend/shell comparisons.
- `verification/addition-options-windows-archive-integrity.txt` records archive checks for the ZIP, NSIS installer and its embedded application archive.
- `verification/TEST_RESULTS.md` and `verification/MACOS_TEST_RESULTS.md` record the shared arithmetic, browser and native Mac behavior checks. Those are not Windows runtime test results.

The package verifier compares the installer payload with the extracted ZIP across every application file. It also compares the bundled HTML, JavaScript, CSS and desktop shell with the current source build. A small NSIS installer bootstrap may have a 32-bit PE header while containing the complete x64 application; the payload, rather than the bootstrap alone, determines the delivered application's architecture.

An additional read-only check evaluated unchanged `desktop/security.cjs` using Windows path semantics. Seven cases passed: the document and assets resolved under a Windows path containing spaces and `app.asar`, while file URLs, traversal, encoded backslashes, drive-colon paths and query strings were rejected.

**The application and installer have not been executed on Windows 10 or Windows 11.** The build host is an Apple silicon Mac with no available Windows runtime or virtual machine. Native Windows launching, installation/uninstallation, display scaling and physical Windows keyboard behavior therefore remain unverified. Successful cross-platform packaging and exact payload comparisons do not replace those checks.

## Exact paths for the macOS downloads

The corresponding updated Mac delivery is version **1.1.2**, for **Apple silicon with macOS 13 or later**. Its ad hoc signature and lack of Apple notarization are described in [MACOS_APP.md](./MACOS_APP.md). These are the exact saved files on this Mac:

- [Mac disk image — Mental-Arithmetic-1.1.2-macOS-arm64.dmg](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.2-macOS-arm64.dmg)
- [Mac application ZIP — Mental-Arithmetic-1.1.2-macOS-arm64.zip](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.2-macOS-arm64.zip)
- [Shared source for all platforms — Mental-Arithmetic-1.1.2-all-platforms-source.zip](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/Mental-Arithmetic-1.1.2-all-platforms-source.zip)
- [Mac installation, launch and build instructions](/Users/pussieromatic/Documents/Codex/2026-10-24/build-my-mental-arithmetic-training-website/outputs/mental-arithmetic-trainer/MACOS_APP.md)

For installation, open the DMG, drag **Mental Arithmetic.app** into **Applications**, then open it there. The Mac ZIP is an alternative copy of the same standalone app bundle.
