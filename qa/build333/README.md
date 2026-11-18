# Build 333 verification

- Reader unit tests include the new Fit to Width cue, word/guide overlap, spread clearance, elliptical contour and crop spacing. The EPUB tests cover unequal safe areas.
- The browser comfort suite tests real finger input, current-page bounds, crop centering, stable spread flags, Reading Assist after a page turn and the global switch.
- Android unit tests cover throttled scrubbing, completion of pending renderer callbacks, attachment progress and checksum cache invalidation.
- The release gate installs updates from Builds 303 and 332 on Android API 31 and 35 and verifies the production signer, retained data and rejection of the old key.

Physical BOOX, Pixel and tablet testing is listed in the [Feature Plan](../../FEATUREPLAN.md).

All 455 Reader tests, 177 Android tests, 24 browser suites, 43 PDF.js pixel tests and 19 official viewer cases passed. The update gate passed for Builds 303 and 332 on API 31/35. [Release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/44331959479)

The published APK with SHA-256 `c8b3fb672c08c50472d119d20fac2856bb86f64f4e57a38d86b7e2910b9dec33`, signature, source maps, engine/runtime files, 9672 archived files and release checksums were checked after download. [Published release](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.1.7-333)
