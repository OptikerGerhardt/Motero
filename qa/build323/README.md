# Motero 1.0.8 / Build 323 local verification

Reader: `db317a71a333caf7fcd4a129379315c5f47f2265`. PDF.js 5.7.330 / `5f95f712bc629ac11159cb4859ed8091fdffa87b` is unchanged.

402 reader cases in 47 files, 147 native tests in 36 suites and all 21 browser suites pass locally. The engine browser gate includes 43 pixel cases and 19 official viewer cases. The local non-debuggable Android-9+ release build contains reader archive SHA-256 `4ceda3a626d3fdfc020111cfe075ba62763fa2de90058e6df4fa625b171612e2`.

New cases cover EPUB line gaps through hold and explicit tools in both flows, palette hiding/restoration, matching existing annotation IDs and Undo, all six PDF spread/scroll combinations, automatic/manual fitting, cover/final singletons, overview entry and tap restoration, focused pages, shared raster ownership, worker failure/cancellation/startup disposal, batched native previews and memory-pressure handling. The 96-case compact-image geometry corpus matches the prior implementation exactly.

The first full local run exposed an overly strict browser-test assumption that an Even-spread cover must have two pages. The final spread test checks cover/pair membership and destination fitting instead. Individual suite logs are included in the release test-report archive; the local summary files are retained here. Shared-raster transfer failures found during development are covered by a regression and absent in the final resource test; a pre-existing PDF.js link-layer cancellation warning remains recorded.

This is local browser/JVM evidence. Worker-owned buffers are outside the main WebView buffer probe; reported buffer sizes are not total RAM. Physical Pixel/BOOX input, native animation appearance, device-specific WebViews, personal PDFs and live-account sync remain separate checks.

Production signing, API 31/35 updates from 303/322 and independent public-asset verification are recorded here after the protected release workflow completes.

A CI warm-open test exposed a readiness assumption: the first cropped fixture page is about 17 CSS pixels high, so the pen target must wait for a genuinely prepared visible body frame. That complete pen/eraser/palm test passes under fourfold CPU throttling after the readiness correction. The production reader bundle remains unchanged by that test-only correction.
