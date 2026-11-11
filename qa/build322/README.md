# Motero 1.0.7 / Build 322 verification

[Motero 1.0.7](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.7-322) is published. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42929208556) passed its full build and release jobs.

Application source: `0257b1991b86fe843d25c81e37e76827f2106dbf`. Reader: `0aec12a3114e30c53ff4847ffe9351856d02387e`. PDF.js 5.7.330 / `5f95f712bc629ac11159cb4859ed8091fdffa87b` remains unchanged.

382 reader tests, 43 engine pixel cases, 145 Android tests in 35 suites and all 20 browser suites pass. Engine-integrity, publication/build-reuse and production-key/receiver guards pass. The engine browser gate includes 19 official viewer cases.

The EPUB suite reproduces Build 321's word-start swipe failure and checks forward/reverse swipes, margin taps, swipes over annotations and vertical margins in both flows. PDF touch-editing tests use stable measured targets, inject a queued scroll during each hold and verify existing highlight/underline/area/note edits, IDs and Undo. Other fitting, crop, stylus, theme and navigation regressions remain included.

The resource gate uses a synthetic 96-page PDF. Compared with the independently downloaded Build 321 bundle, local observed crop sample arrays decrease from 23,040,000 to 3,840,000 bytes in the final probe; resident JavaScript thumbnails decrease from 96 to 32. Warm turns reuse unchanged layout. These are specific buffer/cache measurements, not total RAM or a physical BOOX latency claim. Both versions can emit the same upstream link-layer cancellation warning, retained in the logs. [Measurement scope](../../docs/READER_322.md).

The public APK was downloaded independently: SHA-256 `9af91ea220698788f9c3bb8784ae970c4207a8cb53ea5d089f1b71c83dc58ebe`. Production signing, restricted V3 rotation, receiver namespace, Android 9+ and non-debuggable manifest pass. All 104 embedded reader sources, 207 unchanged engine files and 45 unchanged runtime files match the checkout. All 9309 source archive files, immutable tag, release checksums and public test reports were verified.

Both API 31/35 gates pass: updates from 303 and the actual signed 321 preserve private data and UID, start the app and reject old-key updates/internal permission access. Latest-release detection selects Build 322 with exactly one APK. No independent anonymous-access claim is made because the managed proxy may supply credentials.

Physical BOOX/Pixel native input and animation appearance, device-specific WebViews, exact behavior of personal PDFs and live Zotero account sync remain separate checks.
