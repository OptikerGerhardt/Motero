# Build 311 verification

Local release build and 118 native tests, 305 Reader tests, 12 browser suites and 11 publication/signing helper tests passed. Reader revision: `2d0fc4a9b428affb2125442a27388f3c99468a81`.

Browser evidence includes explicit Reader Light under OS Dark before HTML initialization, theme-aware preview pixels and stale-generation rejection, bookmark flag opacity and ordinary-note exceptions, Android Undo bridge, overlay-node reuse, persistent geometry/numeric learning on reopen, real Chromium pen input with release/cancellation/second-pointer handling, manual crop masking, and existing navigation/gesture regressions.

The UI-consistency log includes cold/cached fixture opening times under the test runner's load. These are browser measurements, not physical BOOX latency guarantees. Device rendering, hardware eraser mapping and live-account synchronization require separate physical testing.

The signing and actual API 31/35 data-retaining update reports were verified after publication; see `github-*.json`.

The CI landscape failure was reproduced by a unit regression and fixed before publication. Additional regressions cover late same-parity model evidence, delayed hover and deferring crop changes until a pen stroke ends. The fitting suite also passed with 2× CPU throttling.

Queued navigation has priority over deferred crop layouts and automatic refits. The browser test forces a buffered geometry update during target preparation and passes with 2× CPU throttling.

Published Build 311 was downloaded independently. Signature/rotation, all 98 embedded Reader sources, 207 pinned PDF.js files, 45 runtime assets, checksums, anonymous latest-release access and both actual API 31/35 update reports passed. The update baselines were the original Build 303 and the verified Build 310; private test data and UID were retained, and old-key access was rejected. See `github-*.json`. Physical-device tests remain separate.
