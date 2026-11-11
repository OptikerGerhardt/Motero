# Reader selection, spreads and resource scheduling — Build 323 / 1.0.8

## Selection and editing

EPUB caret results are validated against nearby visible text rectangles. A bounded vertical probe handles line gaps without accepting a spurious section-start caret, walking the whole book, or moving the viewport. The pointer-mode hold recognizer no longer competes with explicit highlight/underline tools. Both paths retain the last valid range when no nearby text exists.

Quick palettes hide while an existing annotation is transformed and return with current annotation geometry after release, only if they were open beforehand. PDF and EPUB retain annotation IDs, Undo and their original synchronization formats. Selected text uses thinner blue, rounded stems and terminal dots; touch targets stay generous. Palette dismissal on an ordinary document tap still consumes that tap without reopening general chrome.

## Spreads

Odd/even parity follows PDF.js: Odd pairs pages 1/2, 3/4; Even leaves page 1 alone and pairs 2/3, 4/5. The final unpaired page stays valid. A reading unit is one page or its configured spread. Crop analysis remains page-local; a spread receives a common zoom and a shared centered frame, without changing PDF coordinates.

Vertical, horizontal and wrapped crop layouts keep pairs together. Jumped mode retains both partner pages, prioritizes the focused page and advances to another unit. Hardware scrolling uses the unit's vertical limits. A normal spread is not an overview of two units: pinch-out remains in overview when at least two complete reading units are visible. Tapping a page restores its reading unit and saved fitting, retaining the spread option.

## Optimizations accepted in the chat: 1–6 and 8

1. The first/current native preview publishes immediately. Other decoded previews publish in a fixed 32 ms batch window, rather than copying a whole-document list per bitmap. Recovery cancels old batches; render/theme identity and bounded input queues remain enforced. A continuous image stream cannot postpone publication indefinitely.
2. The WebView wrapper observes only renderer generation/failure. Its background setter ignores identical colors. Reader recovery, theme changes, pen hooks and the stable WebView instance remain supported.
3. Raster crop geometry is computed in a dedicated, packaged Web Worker using transferable buffers. The small text-only shortcut stays immediate. Worker startup failure has an equivalent local fallback; process failure after transfer re-renders the affected page before fallback. Closing the reader terminates the worker and rejects pending work.
4. Crop images use a one-byte minimum-channel plane plus the original neutral-paper histogram. Colored images retain a second red plane only when necessary to preserve the original vector-rule tests. Grayscale scans need one quarter of RGBA storage; colored samples need at most half. Geometry, marginal-reference options and conservative scan/photo handling retain the previous results.
5. Native/WebView previews, retained crop preparation and recent PDF pages use coordinated conservative device budgets. E-reader/low-memory profiles lower the previous limits. Android memory-pressure callbacks trim native previews and duplicate JavaScript images, release offscreen PDF canvases and cancel distant background analysis. Visible pages/foreground work and annotations survive. Callbacks are unregistered with the reader UI.
6. Existing direction-aware prefetch, foreground priority and interaction pauses remain; worker analysis also prioritizes queued foreground pages and cancels superseded distant requests. Analysis has no persistent bitmap cache.
8. EPUB skips identical appearance applications, restores position after font loading only for an actual font change, coalesces scroll overlay updates per frame and yields between chapter preparation tasks. Existing section virtualization, CFI/page mapping, search and print remain. Foliate's unload-every-other-chapter strategy was not transplanted: Zotero's page mapping and annotation anchors depend on its section model.

Option 7 (removing the double-tap wait) and options 9/10 (bridge redesign/native BOOX ink) are not included.

## References and measurements

Reviewed public source, not an engine upgrade:

- [Zotero Android thumbnail batching, f62ff0d2](https://github.com/zotero/zotero-android/blob/f62ff0d2afaf27d1fcd1a5827e745d814bde6e7e/app/src/main/java/org/zotero/android/screens/reader/sidebar/thumbnails/ReaderThumbnailPreviewManager.kt#L214). Motero retains bounded queues and uses a short fixed window instead of upstream's unbounded, trailing 200 ms collector.
- [Zotero Android WebView, f62ff0d2](https://github.com/zotero/zotero-android/blob/f62ff0d2afaf27d1fcd1a5827e745d814bde6e7e/app/src/main/java/org/zotero/android/screens/reader/ReaderWebView.kt).
- [PDF.js spread grouping, 94a48f3c](https://github.com/mozilla/pdf.js/blob/94a48f3c844d4677b264b6e7c0a1e239c245189f/web/pdf_viewer.js). Reference for parity/grouping only; Motero's pinned Zotero PDF.js 5.7.330 is unchanged.
- [Foliate paginator, 78914aef](https://github.com/johnfactotum/foliate-js/blob/78914aef4466eb960965702401634c2cb348e9b1/paginator.js). Reference for bounded section lifetime and avoiding unnecessary layout. No Foliate source or dependencies are bundled.

The 96-case deterministic gray/color/noise/header/footer corpus has the identical geometry hash before and after compaction: `45da750134702115fd4bbc100c700c533145b38d94491224b73270fc8f266bd1`. Worker transfer tests verify detached source buffers, priority, cancellation and failure fallback. Detached buffer sizes in the main WebView are **not** total RAM: the worker owns them until analysis finishes. Physical BOOX/Pixels, device-specific WebViews, animations, pen-to-pixel latency and live-account synchronization remain separate checks.

Reader/native/browser tests, release verification and API 31/35 update gates from original 303 and preceding 322 are required before publication. Final results are recorded in the build report.

Local verification: 401 reader cases, 147 native cases in 36 suites and all 21 browser suites pass, including 43 engine pixel and 19 official viewer cases. [Reports](../qa/build323/README.md). Public signing/update gates remain pending until the protected release workflow finishes.
