# Mental Arithmetic 1.2.0 — release certification

**3 November 2026.** The owner approved publishing completed preview4 (`2cd3f1e6f15c0709fe444ff9cf32585d41ac89e2`) to the existing whoami.school deployment and GitHub downloads. Production1.2.0 updates version/download metadata and publication documentation, with the approved app behavior unchanged. [Approval record](../requirements/design/OWNER_APPROVED_PUBLICATION_2026-11-03.md).

## Certified app inventory

| Mode | Configurations | Default |
| --- | --- | --- |
| Learn | **1-digit × 1-digit**, **2-digit × 2-digit** | 1-digit multiplication |
| Practice | **2-digit + 2-digit**, **1-digit × 1-digit**, **2-digit × 2-digit** | 2-digit addition |

Addition remains Practice-only; three-digit multiplication is absent from active menus. Random examples, confirmed12×12/18×18 demonstrations, corrected Inside/Outside digit references, literal upright ampersands, separate middle sum/Final Answer, scholarly ivory styling and monochrome Practice are preserved. Practice retains ten unique questions, expected-digit automatic submission, immediate progression, manual restarts, score and minimum/maximum/average answer times.

## Final production-package checks

| Area | Current result |
| --- | --- |
| Shared unit suite | **221 passed** |
| Browser suite | **82 passed**, zero failed/skipped/flaky |
| Final DMG macOS app | **8 passed** |
| Signed Android1.2.0/code10204 APK | **13 native acceptance cases passed**, plus build/lint/signing/alignment/integrity |
| Final ZIP-extracted iPhone1.2.0/build10 Release app | **552 assertions passed**, packaged/installed executable unchanged |
| Final ZIP-extracted iPad1.2.0/build10 Release app | **552 assertions passed**, packaged/installed executable unchanged |
| Windows x64 | **72 archive files** match installer payload, **7 x64 headers**, four frontend and two shell files verified |

The [shared summary](release-120-shared-summary.json) checks normal and enlarged/narrow layouts, both available lessons, all three Practice settings, the current1.2.0 version badge and every download button targeting `/v1.2.0/Mental-Arithmetic-1.2.0-*`. Shared executable TypeScript/styles/options/math/input/timing code matches the approved preview; the release/download source-file differences are comments. Three generated visual resources remain consistent with the canonical tokens; strict TypeScript and production builds pass.

The [Android report](RELEASE_120_ANDROID_TEST_RESULTS.md) records an actual approved-preview4/code10203 → stable1.2.0/code10204 update with the original certificate, UID10236 and a cold-relaunch storage marker retained. Exact menus/version, seeded two-digit addition, partial input and automatic125 submission, all three Practice rounds, timing, native keyboard/short landscape layout, Inside/Outside, whole carry13 and both ampersands pass. The first emulator host exited with signal9 before boot/app launch; one unchanged retry booted and passed. Its cause is unestablished. The owned emulator is stopped and its host process exited.

The [native Apple summary](release-120-ios-summary.json) records final Release app verification on phone/tablet, full current menus and rounds, pair/carry/grouped-header behavior, enlarged layouts and visible1.2.0/build10 identity. Thirty current native inputs match the healthy build mirror. Thirty-one app/core/test/auditor files are byte-identical to approved preview4; only six project build-number fields change9→10. The approved **38 core tests** are preserved evidence through exact source comparison and were **not rerun** for this metadata-only packaging step. Both task-owned simulators are shut down. The separate simulator auditor is not shipped.

Mac ZIP/DMG app archives are identical, the ad hoc code signature and DMG checksum verify, and actual packaged frontend/shell bytes match the tested build. The owned DMG was ejected. [The cross-package audit](release-120-cross-platform-packages.json) verifies actual Web ZIP, Mac ZIP/DMG, Windows ZIP/installer and signed APK bytes against the frozen production build, with stable1.2.0, production flag, matching download version and Android10204 metadata.

## Publication sequence and retained history

The GitHub release is prepared with all ten complete platform/source packages plus SHA256 checksums. Its asset bytes and source tree are verified before release publication. The existing main branch is promoted only after release assets are available, so the website's1.2.0 download destinations resolve when Cloudflare publishes it. External post-publication records verify current release/tag/main metadata, actual public asset hashes, live website content/options/download links and HTTPS/redirect behavior. Those time-dependent records are saved outside this frozen source snapshot.

Previous releases, all local preview packages, all earlier source/evidence paths and original requirements remain preserved. No registrar, DNS, TLS, paid plan, account protection or unrelated hosting configuration change is required. Existing Cloudflare Pages builds main with `npm run build` and output `dist`.

## Scope of platform verification

Windows runtime installation/rendering remains unverified; package/content inspection is recorded separately. Native Apple checks use simulator UIKit/delegate automation, not physical-device, external XCUITest or manual VoiceOver execution. Apple packages were built with the requested Xcode27 beta. The unsigned device archive is **not an installable IPA**, and there is no App Store/TestFlight publication in this task. Mac is ad hoc signed and Windows unsigned.

See [RELEASE_1_2_0.md](../RELEASE_1_2_0.md) for current downloads and launch instructions. Native source and production package guides remain in the source bundle.
