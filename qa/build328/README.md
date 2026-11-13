# Motero 1.1.2 / Build 328 verification

Collected fixes: collection/filter footer alignment, notch-independent native crop insets, fullscreen Stylus settings/system bars, inline Page Turning, a full-width pen palette with separate size controls, double-tapped column focus, bounded stable column raster and clearer Continuous page gaps.

The Reader passes 425 cases in 49 files, including delayed-focus cancellation, right-column focus/restoration and raster restoration. Native regressions include persisted inline Page Turning preferences. Browser checks exercise actual double taps and SmartScroll at device pixel ratio 3, bounded raster reuse, fitting, spreads and existing PDF/EPUB interactions.

The native release build, all 158 native cases in 39 suites, TypeScript, 425 Reader cases and all eight affected browser gates pass locally. The APK embeds 117 matching Reader/worker sources, 207 pinned engine and 45 pinned runtime files. All 23 local browser gates now pass; the protected release checks follow. Reader source: `6114aeb26daf02104c9757423183994b31df27e9`. Production signing, API 31/35 update/data-retention and old-key-refusal gates must pass before publication. Preceding update baseline: signed Build 327, SHA-256 786dd8e8fba192fe2fa4a174cb3001027d4b81e8bf73f6934f046ddf7cdcee21.

Physical BOOX/Pixel UI and live-account sync remain separate. The original two-column PDF was unavailable; generated fixtures reproduce the relevant structure. Detail rendering is restored outside column reading. In column reading, the unchanged canvas-pixel cap can limit sharpness on very large/high-DPI pages. [Scope and limits](../../docs/READER_328.md).
