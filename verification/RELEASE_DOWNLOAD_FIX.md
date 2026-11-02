# Version 1.1.3 — identifiable and verified platform downloads

The owner reported that the latest Android application still offered one- and three-digit addition and requested correction of all platform downloads on GitHub and whoami.school.

## Actual public-file audit

The existing public downloads were retrieved anonymously and checked independently of the local build files. Public Android 1.1.1 shows the six historical Learn categories and Addition digit choices 1, 2, 3. Public Android 1.1.2 shows exactly four Learn categories and Addition digit choice 2, both on installation and after upgrading a real 1.1.1 installation while retaining WebView data. Its nine native acceptance cases pass. Therefore the reported phone behavior was not reproduced by those public-file tests, and cached HTML is not an established cause. The exact version running on the owner's phone was requested but remains separate from these observations.

The public 1.1.2 Web ZIP and live website have identical JavaScript and the intended four choices. Public macOS/Windows ZIPs contain that same production JavaScript; the actual downloaded Mac application passes all five native desktop checks. Public iOS downloads also match the published hashes and pass real UIKit option/lesson/round checks using the unchanged downloaded executable in a simulator. These observations do not identify which installed file was opened on the owner's phone.

## Concrete 1.1.3 changes

- A visible Version 1.1.3 identifier appears in shared apps outside active Practice; iOS identifies version/build in its existing Privacy screen.
- Every website platform card and download label states 1.1.3. The build label and asset URLs derive from the package version, so filenames, tags and links cannot drift independently.
- Android keeps its application identity and original signing certificate and clears only its own WebView HTTP cache when the installed app version changes. Existing no-cache/no-store restrictions remain. Its URL allowlist and network protections are unchanged. This is preventive upgrade handling, not a claim that a cache defect was reproduced.
- Website root HTML and index.html use explicit no-store headers. No automatic page reload, update polling or interruption of an active round is introduced.
- Current application binaries and the full source archive are rebuilt as 1.1.3. Historical releases and original requirements remain intact.

Both Learn and Practice continue to offer two-digit addition and one-, two- and three-digit multiplication. Random examples, the owner's instruction method and fixed examples, vertical addition, ten unique problems, automatic submission, immediate advancement, previous-answer colors, final score, and minimum/maximum/average round timing remain available.

## Verification

Shared verification passes 213 unit tests, all 64 desktop/mobile browser checks and the production build/typecheck. Native Mac tests pass all five cases from the final read-only DMG, including the visible 1.1.3 marker, four lessons, all remaining Practice modes and timing. Mac ZIP CRC/signature/version and ZIP-versus-DMG application bytes pass. Windows installer/ZIP payloads, x64 runtime headers and all production files are checked by the package verifier. Windows native execution is not available on this Mac.

Android evidence distinguishes the old public-file audit, the locally built 1.1.3 upgrade checks, and the final post-publication test of the newly downloaded APK. iOS evidence distinguishes Swift core tests, real UIKit checks of downloaded/extracted Release executables and the existing external XCTest/simulator limitations. Refer to the adjacent release-fix-android* and release-fix-ios* reports for actual counts and boundaries.

Final public asset digests, public download HTTP checks, deployed bundle equality and the post-publication Android test are recorded in separate external 1.1.3 verification files in the parent outputs folder after publication. The source snapshot is frozen before these external checks so its ZIP remains exactly equal to the committed tree.
