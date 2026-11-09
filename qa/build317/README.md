# Motero 1.0.2 / Build 317 verification

Reader commit: `bdd6c348c7d39d6396e76322924fa5ace4c636fd`.

Local release build and final reader sources: 332 reader unit tests, 125 native release tests in 30 suites, and 11 release-infrastructure tests passed. The local unsigned APK contains the exact current 100 reader sources, 207 pinned PDF.js files and 45 runtime files. Package/version/minimum API and receiver permission checks passed.

Regression cases cover tall-page directional entry without losing short-page centering, conservative running-head/footer recognition, Roman folio sequences, local chapter boundaries, graphics fallback, text-only analysis, reserved foreground work, current-page crop replacement, cancellation recovery, valid crop retention, and palette dismissal without a second action. Responsive preview checks cover small/tall/landscape/tablet sizes including side cutouts.

All 14 final Chromium browser suites passed. Build 317 was published while its workflow cancellation was being processed. It has a reference-mask redraw issue corrected in Build 318; its existing tag and assets are retained. Production-signing and update reports accompany the release. Physical BOOX/Pixel appearance, e-ink latency and live account synchronization are separate from these checks. The original Kant/Fuchs PDFs shown in screenshots were not available for this build; matching synthetic cases are covered.
