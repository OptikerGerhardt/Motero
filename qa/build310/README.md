# Build 310 verification

Build 310 contains the complete reader changes from [Build 309](../build309/README.md), plus cancellation of the deferred chrome-tap timer when an edge/bookmark shortcut consumes a gesture. The added regression exercises the 350 ms timer and verifies that no pointer-down is replayed after navigation.

- 290 reader unit tests; 118 Android unit tests in 27 suites.
- Browser coverage includes controls, edge navigation, complete gesture paths, native crop commands, centered bookmarks and bounded rapid turns. The GitHub workflow repeats all eleven browser suites.
- Signature, package, permission namespace and embedded sources are verified against the same production policy.
- Before publication, API 31/35 gates require legacy-303 migration and update from the verified Build 309 APK, retaining private data and UID and rejecting the old key.
- Physical-device interaction and live-account sync remain separate from these checks. The exact Kant/Fuchs originals shown in the latest screenshots were unavailable; the private original Plessner regression is documented under Build 309.
