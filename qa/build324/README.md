# Motero 1.0.9 / Build 324 verification

[Motero 1.0.9](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.9-324) is published. The [protected build and release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43124008618) passed.

Release application source: `8419a39e551b5bf48366dd730ec9d4b0ad0f101c`. Reader: `b9b28564edfb01d42fbf1ef597f939124619eac7`. Subsequent documentation commits do not replace immutable tags or release assets. PDF.js remains 5.7.330 / `5f95f712bc629ac11159cb4859ed8091fdffa87b`.

411 local Reader cases in 48 files, 149 native cases in 36 suites, all 22 browser suites, 43 engine pixel cases and 19 official viewer cases pass. Node's local aggregate reporter counts passed files; the retained per-file case log and JSON provide the individual 411-case count. The CI Reader reporter records 411 passing entries. Native JUnit totals retain real case counts.

The full final browser run covers shorter selection holds, direct/native selection, word gaps and annotation resizing, manual cropping, all three scroll directions, initial/live Odd/Even spread activation, both centering axes, overview return including fitting Off, theme rendering, erasers/stylus input and cache/worker behavior. An additional local probe enables the app-default direct highlighting and passes all column/swipe/pinch cases. The new column gate uses unequal column widths and verifies stable text size after refitting, both reading directions, no right-column skipping, boundary swipes, a real two-finger pinch, manual-frame precedence, all Continuous axes and actual PDF theme pixels. EPUB tests cover negative margins, safe defaults, corner bookmarking, flag size and the E-Reader theme override.

The downloaded APK SHA-256 is `bf72620240b003efbbc21c7dbe4c87a8c732160804c8e3d71e19fbce65b36c1e`. Production certificate/rotation, receiver namespace, Android 9+ and non-debuggable manifest pass. 112 main-bundle sources and 115 unique Reader sources across all emitted worker maps match the checkout. All 207 engine files, 45 runtime files, 9373 source-snapshot files and release checksums were independently checked.

Both API 31/35 emulator gates pass: original 303 and signed 323 update to 324 while retaining private test data and UID and starting the app. Old-key updates/internal permission access are rejected. Latest-release detection selects Build 324 with exactly one APK. Anonymous access was not independently established because the managed proxy may supply credentials.

Column recognition is conservative and does not semantically reflow arbitrary layouts. Original content, annotation coordinates and synchronization formats remain intact. The Kundera heading issue remains an observation pending another EPUB. Physical BOOX/Pixel touch/stylus input, native animation appearance, device-specific WebViews, personal documents and live-account synchronization remain separate checks. No physical-device latency or total-process-RAM measurement is claimed.
