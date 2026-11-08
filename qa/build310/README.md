# Build 310 verification

Build 310 contains the complete reader changes from [Build 309](../build309/README.md), plus cancellation of the deferred chrome-tap timer when an edge/bookmark shortcut consumes a gesture. The added regression exercises the 350 ms timer and verifies that no pointer-down is replayed after navigation.

- 290 reader unit tests; 118 Android unit tests in 27 suites.
- Browser coverage includes controls, edge navigation, complete gesture paths, native crop commands, centered bookmarks and bounded rapid turns. The GitHub workflow repeats all eleven browser suites.
- Signature, package, permission namespace and embedded sources are verified against the same production policy.
- Before publication, API 31/35 gates require legacy-303 migration and update from the verified Build 309 APK, retaining private data and UID and rejecting the old key.
- Physical-device interaction and live-account sync remain separate from these checks. The exact Kant/Fuchs originals shown in the latest screenshots were unavailable; the private original Plessner regression is documented under Build 309.

Publication verified: [Build 310](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-310), successful run [42471775635](https://github.com/OptikerGerhardt/Motero/actions/runs/42471775635). All 290 reader tests, 118 native tests, eleven browser suites and both API 31/35 migration/update gates passed in GitHub Actions.

The independently downloaded APK has SHA-256 `879262bb37b4b343e65f9b2ec1bc4fd9d8edda7a6e8e17280718e4df12491e8d`. Its pinned certificate/V3 proof, receiver permission, 95 embedded reader sources, 207 PDF.js files, 45 runtime files, release checksums and API reports match. Both update reports confirm startup and data/UID retention after the Build 309 update and refusal of the old key. Anonymous latest-release discovery returns Build 310 and its APK, as required by Obtainium.
