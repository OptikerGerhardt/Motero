# Motero 1.0.8 / Build 323 local verification

Reader: `cf40afbfadf28d7ca5cd2cb63f45bfdb640150a1`. PDF.js 5.7.330 / `5f95f712bc629ac11159cb4859ed8091fdffa87b` is unchanged.

401 reader cases in 47 files, 147 native tests in 36 suites and all 21 browser suites pass locally. The engine browser gate includes 43 pixel cases and 19 official viewer cases. The local non-debuggable Android-9+ release build contains reader archive SHA-256 `a1787610daf9c9187e69603b5d8e1f997a7e5b5239abc9d9a998ef3aaee787a0`.

New cases cover EPUB line gaps through hold and explicit tools in both flows, palette hiding/restoration, matching existing annotation IDs and Undo, all six PDF spread/scroll combinations, automatic/manual fitting, cover/final singletons, overview entry and tap restoration, focused pages, shared raster ownership, worker failure/cancellation/startup disposal, batched native previews and memory-pressure handling. The 96-case compact-image geometry corpus matches the prior implementation exactly.

The first full local run exposed an overly strict browser-test assumption that an Even-spread cover must have two pages. The final spread test checks cover/pair membership and destination fitting instead. All final individual suite logs are retained here. Shared-raster transfer failures found during development are covered by a regression and absent in the final resource test; a pre-existing PDF.js link-layer cancellation warning remains recorded.

This is local browser/JVM evidence. Worker-owned buffers are outside the main WebView buffer probe; reported buffer sizes are not total RAM. Physical Pixel/BOOX input, native animation appearance, device-specific WebViews, personal PDFs and live-account sync remain separate checks.

Production signing, API 31/35 updates from 303/322 and independent public-asset verification are recorded here after the protected release workflow completes.
