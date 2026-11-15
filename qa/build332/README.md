# Motero 1.1.6 / Build 332 verification

Scope: Quick Tags/comment divider, stable long-hold quickbars and native selection echoes, temporary PDF reading-word oval replacing the next-page arrow. The old implementation remains in the Build 331 Reader history.

449 Reader cases in 53 files and 168 native tests in 42 suites pass. Browser checks exercise real holds, synthetic unchanged scroll events, palette editing/Undo, reading-edge and new-page cues. All 23 local browser suites pass; final word-geometry/palette changes are additionally covered by features, page-navigation and touch-editing suites, with the final stationary-guide guard covered by touch-editing. TypeScript and 43 PDF.js core tests pass. The unsigned APK builds with 121 unique embedded Reader/worker sources and all 207 pinned engine/45 runtime files matching. [Protected release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43772484302) passes signing and both Android update gates.

Update baseline: signed Build 331, SHA-256 f28d1ffe73a77b8b5261c26b706feda7ada2bc65da644d7074d991ef0eee5475. API 31/35 updates from 303 and 331 preserve data/UID, start the updated application and reject the old key. Published sources and APK were independently downloaded and verified.

Physical BOOX/Pixel/tablet visuals and live-account sync were not tested. No private document content is included. [Scope](../../docs/READER_332.md).

[Published release](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.1.6-332), application source `30b6d7b76aacd10cd7875ab221598ceafc387122`. All 23 CI browser suites and the signing/update gates pass. Independent APK SHA-256 `31a73cbf33635ec37beef2ee8e85e7b09aeb9fa0f17a51c0f30d7044953a29a3`; 118 main-bundle and 121 unique Reader/worker sources, all 207 engine/45 runtime files, 9649 archived sources and all release checksums match. Latest-release detection selects Build 332 with one APK. Anonymous access was not independently established because the managed proxy may supply credentials.
