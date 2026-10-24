# Windows 1.1.0 package verification — 24 October 2026

The Windows 10/11 x64 installer and application ZIP were built from the final corrected production frontend and passed package verification. **Windows 10/11 runtime execution was not performed.** This report establishes package integrity and shared code identity; it does not claim a Windows installation or launch pass.

## Delivered release bytes

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `Mental-Arithmetic-1.1.0-Windows-x64-Setup.exe` | 121,273,441 bytes | `32b884b2f08c249f943afb01fd9c05f5518434d4705823f55e85e7323c938721` |
| `Mental-Arithmetic-1.1.0-Windows-x64.zip` | 153,161,130 bytes | `a46c1675b1bbd61b588fb19a4e9316a69153bba9b25171eba46f0f9e1062c011` |

The main app and all runtime DLLs are AMD64 PE32+ files. The NSIS installer stub and installer-only elevation helper use i386 PE32 headers while installing the complete x64 application. The application and installer are unsigned. Windows ARM64 and 32-bit Windows packages are not included.

## Shared application behavior

Version 1.1.0 includes complete instruction and random examples for all six lesson categories: addition and multiplication with one-, two- and three-digit operands. Addition uses above/below operands with aligned columns, including its final answer. Multiplication stays horizontal. The two-digit **First → Inside → Outside → Last** trace and owner-confirmed 12 × 12 / 18 × 18 demonstrations remain available. Three-digit multiplication uses the owner's five specified product groups. Every walkthrough ends with its final answer.

Practice retains ten unique problems, expected-digit automatic submission, immediate advancement after correct and incorrect submissions, prior-answer timing, the bottom-right live timer, manual restart and the final score. Each completed set also shows maximum, minimum and average time from all ten accepted raw durations, including incorrect answers, floored to completed tenths only for display.

The actual Mac and Windows `app.asar` contents were compared directly. All three production frontend files and both desktop shell modules match one another and the current project byte-for-byte. The frontend includes the final correction aligning wider addition answers with the units column. See `cross-platform-frontend-integrity.json`. The current frontend source manifest contains 18 files.

The shared code passes **196 TypeScript unit tests**, **54 browser tests**, and **5 native Mac Electron tests** against the final delivered Mac DMG. These checks cover the shared arithmetic, lessons, rendering and timing. They are not Windows native execution tests. The separate native iOS app has its own Swift/UI verification records.

## Actual Windows package checks

The command executed against the delivered output files was:

```text
npm run verify:windows -- ../Mental-Arithmetic-1.1.0-Windows-x64.zip ../Mental-Arithmetic-1.1.0-Windows-x64-Setup.exe
```

The reusable verifier passed:

1. Complete ZIP extraction and archive CRC checks.
2. Required app executable, Electron DLLs, locales, PAK resources, ICU/snapshot data, licenses and `resources/app.asar` are present and nonempty.
3. All **7 application/runtime PE executables and DLLs** have x64 PE32+ headers; **55 locale PAK files** are present.
4. Packaged version **1.1.0** and main entry point `desktop/main.cjs` match the project.
5. All three production frontend files and both shell modules match the current source build byte-for-byte.
6. The installer is a valid Windows PE/NSIS file; its archive and embedded offline x64 application archive pass integrity checks.
7. **All 72 application ZIP files match the NSIS payload byte-for-byte.** The payload contains 73 files, including one separately inspected installer-only elevation helper.

`windows-artifacts.json` records the exact output paths, sizes, hashes, file-level comparisons and explicit `runtimeExecution.performed: false`. `windows-archive-integrity.txt` records the ZIP, NSIS and embedded application archive integrity output. `windows-build.txt` records the final packaging run; `windows-verification-run.txt` records the final verifier invocation. The script extracts to its own temporary folder and removes that folder afterward. It does not run Windows binaries.

## Limits and preservation

Windows 10 and Windows 11 installation, first launch, keyboard behavior, display scaling and uninstall remain unverified on an actual Windows runtime. The build host is an Apple silicon Mac without a Windows VM/runtime. Electron's bundled version targets Windows 10 and later, but that platform declaration does not replace application-level Windows testing.

The prior 1.0.2 desktop release files remain preserved. No deployment, repository creation, DNS change, public upload or system security setting change was performed.
