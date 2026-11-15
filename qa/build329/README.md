# Motero 1.1.3 / Build 329 verification

Scope: running heads above footnote-heavy prose, bibliography/index/image-body pages and thin rules; Roman/edition header folios distinct from body-margin references; OCR/raster margin stars; shared purple palette; repeatable half-point pen widths.

431 Reader cases in 49 files pass, including six new structural regressions and updated marker-splitting coverage. Native snapping tests cover all 50 positions, bounds and representative intermediate values. Browser comparisons exercise the uploaded Born original without committing personal content; retained numeric results contain no extracted document text. Original Leviathan and Kant verification is incomplete because each upload exceeds the 32-MiB transfer limit. Synthetic cases cover their reported structures.

All 23 local browser suites, 431 Reader cases, TypeScript and the 43 engine pixel cases pass. The non-debuggable native release build and all 160 native cases in 40 suites pass. Embedded sources, 207 engine files and 45 runtime assets match; 117 unique Reader/worker sources were checked. Protected signing/update gates follow. Reader source: `f07ca15099385f5dd28ef71977cf0c7932b0dea6`. API 31/35 gates must update original 303 and signed 328 while preserving data/UID and refusing the old key. Previous-release baseline SHA-256: f2f1e944fecb3b818de35633c892222e69d1ba51406b56779852675f065671fd.

Physical BOOX/Pixel interactions and live-account sync were not tested. PDF.js and runtime pins remain unchanged. [Scope](../../docs/READER_329.md).
