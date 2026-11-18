# Reader optimization review — November 8, 2026

Historical review; candidate status checked November 18. Use the [current open feature plan](../FEATUREPLAN.md) for priorities and the [Build 319 integration notes](E_READER_AND_STYLUS.md) for delivered input controls.

## Implemented in Build 311

- Resolve explicit Reader Light/Dark before loading HTML; Automatic follows Android. Avoid identical theme resets, synchronize system-bar contrast and restore the previous window appearance on exit.
- Version preview work by reader instance and theme generation. Discard stale results, batch bridge requests, deduplicate work and bound pending renders to 32. Decode on one background worker with a 16-item input queue and pixel limits. Each native preview cache uses at most 1/16 of the Java heap, capped at 24 MiB; the scrubber and sidebar own separate caches.
- Sample paired pages across the book plus the current neighborhood. Require sufficient same-parity nearby samples of comparable aspect ratio for local header/footer evidence, while keeping per-page content and odd/even fitting. Preserve diagrams, tables and notes through the existing conservative raster/content safeguards.
- Persist bounded view geometry and numeric learning per PDF fingerprint/page count and algorithm version. No bitmaps or document text are stored in this cache. Storage failure falls back to ordinary analysis. Cap analysis at approximately 800,000 pixels and keep valid results during learning and gestures, and defer buffered layout changes while navigation owns the viewport.
- Keep crop refinement outside active pen input, ignore queued hover, preserve short ink strokes and final endpoints, consume coalesced samples, retain collected input on cancellation, isolate the active pointer, draw ink at most once per frame, and reuse unchanged overlay nodes. These are targeted Motero adaptations informed by [Zotero Reader PR #263](https://github.com/zotero/reader/pull/263) by **AI-Kyo-er**. The complete PR and its desktop settings were not merged. It remains open at review.

Browser timings are fixture measurements, not BOOX pen-to-pixel latency or guarantees for personal documents. Physical GrapheneOS/BOOX tests and live-account sync remain separate acceptance checks.

## Next candidates

| Priority | Proposal | Evidence and limits |
| --- | --- | --- |
| Verification | Pen/finger profiles, hardware eraser buttons and diagnostics were delivered in Build 319; physical InkSense/EMR checks remain | [Zotero Android #106](https://github.com/zotero/zotero-android/issues/106), [#321](https://github.com/zotero/zotero-android/issues/321). SDK-specific Nutrient advice does not apply to Motero's PDF.js reader. |
| High | Optional low-latency native BOOX preview with portable Android fallback | [Official Onyx pen SDK](https://github.com/onyx-intl/OnyxAndroidDemo/blob/master/doc/Onyx-Pen-SDK.md) includes a WebView example. [Saber's adapter](https://github.com/saber-notes/saber/tree/main/packages/onyxsdk_pen) is an implementation reference. InkSense compatibility, redistribution terms, native ABI/page-size support and latency require validation before shipping a dependency. |
| Medium | Optional monochrome color labels; E-Reader contrast/reduced motion already delivered in Build 319 | [#232](https://github.com/zotero/zotero-android/issues/232), [#230](https://github.com/zotero/zotero-android/issues/230). Respect Android animation settings. |
| Medium | Sync retries with Retry-After/backoff and clearer diagnostics | [#308](https://github.com/zotero/zotero-android/issues/308). Test server failures and account state independently of reader rendering. |
| Later | Citation generation, images in notes and explicit ink grouping | [#94](https://github.com/zotero/zotero-android/issues/94), [#213](https://github.com/zotero/zotero-android/issues/213), [#190](https://github.com/zotero/zotero-android/issues/190). |
| Experimental | Variable-pressure ink | [Reader PR #264](https://github.com/zotero/reader/pull/264) was a draft at the original review and splits strokes into multiple annotations. Defer until grouping, undo and cross-client behavior are verified. |

Hardware page turning, manual cropping, overview navigation and font-size controls already exist in Motero.

## Research coverage

The direct Zotero forum request was blocked by this session's enforced network policy. The sources above were read on GitHub; linked forum discussions in those issues were not independently read during this review. This is not a completed forum survey.

For performance follow-up, record cold and cached open time, page-turn p50/p95, long tasks, and Android Java/native/WebView process memory separately. Measure actual e-ink pen-to-pixel latency with an external high-frame-rate recording on InkSense BOOX, an EMR BOOX and a non-BOOX Android device. Avoid comparing desktop DOM timings directly with display latency.
