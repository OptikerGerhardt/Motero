# Motero 1.0.8 / Build 323 verification

[Motero 1.0.8](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.8-323) is published. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43031667034) passed its complete build and release jobs.

Application source: `f3ab0b897e6714e0214d05c56864766b869478ca`. Reader: `db317a71a333caf7fcd4a129379315c5f47f2265`. PDF.js 5.7.330 / `5f95f712bc629ac11159cb4859ed8091fdffa87b` remains unchanged. The release source snapshot manifest records the authoritative revisions and file hashes; subsequent documentation corrections do not replace release assets.

402 reader cases in 47 files, 147 native tests in 36 suites, 43 engine pixel cases and all 21 browser suites pass. The engine browser gate includes 19 official viewer cases. Native preview tests verify immediate current-page delivery, one bounded batch for neighbours, recovery cancellation and cache budgets.

Browser regressions cover EPUB white line gaps through hold and explicit tools in both flows, automatic palette hiding/restoration, preserved annotation IDs and Undo, all six PDF spread/scroll combinations, automatic/manual fitting, cover/final singletons, focused pages and overview restoration. Worker tests cover shared raster ownership, cancellation, startup disposal and execution/transfer failure. An additional local browser probe injects a post-transfer worker failure and verifies identical geometry through re-rendering and local fallback.

The deterministic 96-case grayscale/color/noise/header/footer corpus retains the previous geometry hash. Detached buffers in the main WebView are not total process RAM; worker-owned buffers have separate lifetime. Warm layouts remain reused. The pre-existing PDF.js link-layer cancellation warning is recorded in the resource log; the pinned engine is unchanged. [Implementation and measurement limits](../../docs/READER_323.md).

The public APK was downloaded independently: SHA-256 `10e9017cb1f0433d8c28158b822d99f8b888986b9654aa652b33712bb2dec401`. Production signing, restricted V3 rotation, receiver namespace, Android 9+ and non-debuggable manifest pass. 111 main-bundle sources and all emitted worker maps were checked; 114 unique Reader sources match the checkout. 207 engine files and 45 runtime files retain their pinned hashes. All 9332 source archive files, immutable tag, release checksums and public test reports were verified.

Both API 31/35 gates pass: updates from 303 and the signed 322 preserve private test data and UID, start the updated app and reject old-key updates/internal permission access. Latest-release detection selects Build 323 with exactly one APK. No independent anonymous-access claim is made because the managed proxy may supply credentials.

The warm-open pen/eraser/palm regression also passes under fourfold CPU throttling after waiting atomically for a prepared visible body frame; its first fixture page is legitimately only about 17 CSS pixels high. That readiness correction changed only the test, preserving the production bundle.

Final local suite logs and the independent JSON reports are retained here; the complete CI reports are in the release's test-report archive. Physical BOOX/Pixel input, native animation appearance, device-specific WebViews, personal PDFs and live-account synchronization remain separate checks.
