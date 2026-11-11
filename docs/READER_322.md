# EPUB layout and reader resource use — Build 322 / 1.0.7

## EPUB corrections

A horizontal swipe beginning on EPUB text was claimed by the pending hold gesture. On pointer-up the hold recognizer prevented the normal flow from turning the page. The regression is reproduced against Build 321. A moved, inactive hold now releases page navigation and suppresses only the unrelated default backdrop action. An active highlight, a selection handle and palette dismissal still own their respective gestures. Word segmentation runs after the hold delay, rather than on every initial touch.

For reflowable EPUBs, Appearance adds **Top and bottom margins**, 0–15% of the reader viewport on each side, independent of the horizontal Margins control. Missing old preferences migrate to 3%; invalid stored values are sanitized. Native EPUB reading space reserves equal, stable vertical clearances large enough for the status bar/cutout and bottom progress/navigation area. Toggling toolbars does not resize or repaginate that frame. The sidebar uses the same header clearance as PDF so the bookmark filter is no longer hidden behind the floating toolbar.

The Zotero EPUB annotation format supports highlights, underlines and anchored notes. This release does not add unsupported PDF-style ink or floating text annotations to EPUBs.

A stationary PDF hold also survives delayed scroll events and subpixel layout corrections; real scrolling still cancels it. The touch-editing suite waits for initial fitting before measuring targets and then injects a queued scroll event during every hold.

## Memory and responsiveness

- Android thumbnail metadata remains available for every page; image data URLs have a 32-entry LRU and an 8 MiB byte budget. One oversized requested image may remain alone above that budget. Evicted images are rendered on demand with the same document/render identity. Native bitmap limits and stale-theme guards remain in place.
- Crop learning collects text geometry for its existing sample set, builds the same model, then analyzes raster samples one at a time. It does not retain the full set of sample bitmaps. Resolution, pixel analysis, marginal-reference handling and saved geometry formats are unchanged.
- Whole-document layout is reused only if crop geometry, viewport references, reader dimensions, scale, rotation, scroll mode and margin are all unchanged. Changed frames, late page dimensions and rotation/resize still rebuild layout. Reference masks continue to repaint separately.
- In E-Reader mode, adjacent preparation uses a radius of two pages around visible pages. Current-page work retains foreground priority. Background work pauses during touch and for 350 ms after release; pen ownership and its existing pause remain supported.
- The upper reader toolbar uses the existing E-Reader transition policy. Normal-device transitions and double-tap zoom detection retain their behavior.

## Measurement scope

Before changing the memory path, a synthetic 96-page PDF retained up to 23,040,000 bytes of crop sample arrays in a forced-GC probe, with 96 resident thumbnail images. Corrected runs observed 3,840,000–5,760,000 sample bytes and 32 thumbnail images. This is a measurement of those specific image arrays and JavaScript cache entries, **not total process RAM**, and not a physical BOOX latency claim. The probe inserts identical pauses in both versions to observe live arrays; its pause duration is not a page-turn benchmark. Separate cold/warm navigation timings are recorded without those pauses.

The release retains the existing PDF.js 5.7.330 pin and runtime files, annotation/sync formats, crop settings and production signing identity. Full reader, native and browser regressions and signed Android update checks are required before publication. Physical BOOX/Pixel input, native animation appearance, device WebViews and live account sync remain separate checks.

The stress harness also records an upstream PDF.js link-layer cancellation warning reproduced with the unchanged published Build 321. Its before/after logs are retained alongside the resource measurements; the pinned engine is unchanged.

Verification completed: 382 reader tests, 43 engine pixel cases, 145 native tests and 20 browser suites, plus signed API 31/35 updates from 303/321 and independent public APK/source/checksum verification. [Reports](../qa/build322/README.md).
