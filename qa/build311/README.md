# Build 311 verification

Local release build and 118 native tests, 299 Reader tests, 12 browser suites and 11 publication/signing helper tests passed. Reader revision: `e820640f4a43a1dd42c4be24b7fb411e76f5dec0`.

Browser evidence includes explicit Reader Light under OS Dark before HTML initialization, theme-aware preview pixels and stale-generation rejection, bookmark flag opacity and ordinary-note exceptions, Android Undo bridge, overlay-node reuse, persistent geometry/numeric learning on reopen, real Chromium pen input with release/cancellation/second-pointer handling, manual crop masking, and existing navigation/gesture regressions.

The UI-consistency log includes cold/cached fixture opening times under the test runner's load. These are browser measurements, not physical BOOX latency guarantees. Device rendering, hardware eraser mapping and live-account synchronization require separate physical testing.

The signing and actual API 31/35 data-retaining update reports will be attached by the GitHub release workflow before publication.
