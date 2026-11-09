# Cropping and scrolling in Build 317

Motero changes reader geometry only. PDF files, annotation coordinates, package identity and signing policy are preserved.

## Detection

The detector combines repeated positions, whitespace separation, body-relative text size, font-family differences and folio sequences. It recognizes canonical Roman as well as Arabic folios, with separate sequences, and admits running heads/footers outside the older fixed edge bands. Small or repeated text alone is insufficient evidence to discard a footnote. Larger chapter titles remain content. Local evidence is split at changing running chapter labels, comparing the two page parities independently.

Automatic fitting uses extracted text geometry only when the pinned PDF.js operator list proves that the page paints text without paths, images, forms, masks or unknown operators. A font-sized safety margin covers glyph overhang. Scans, graphics, separators and ambiguous cases retain the bounded raster fallback. Where no optional marginal references exist, one bounds result serves both reference settings instead of scanning pixels twice.

This is a heuristic detector, not universal semantic understanding of a PDF. The regression fixtures include Roman folios, Kant-style edition references, tight footer spacing, footnotes, different fonts, chapter boundaries, scans and graphics. The original Kant and Fuchs documents shown in the user's screenshots were not provided as PDF files for this build; matching synthetic cases are tested without uploading personal documents.

## Scheduling and layout

- A background analysis cannot occupy every worker; foreground page requests can promote queued jobs.
- Scroll preparation is throttled rather than indefinitely postponed by incoming scroll events. Current/visible pages precede neighbors; the reading direction breaks distance ties.
- Newly learned evidence invalidates provisional prepared pages individually. Valid prepared geometry remains usable.
- Compact layout writes styles only for changed page frames. Position preservation uses known geometry instead of forcing before/after DOM layout reads.
- Geometry cache generation 3 prevents old detector results from hiding the new behavior. Only numeric geometry is persisted; page text and images are not stored there.
- Bounded local numeric timings cover queueing, text, raster, bounds, layout, cache use and navigation. There is no telemetry or document-text logging.

Jumped navigation centers pages shorter than the viewport. Tall pages enter at the top going forward and bottom going backward; an in-page refit preserves the reading position. Hardware SmartScroll continues to step within a tall page before changing pages.

The manual editor receives measured native control height plus top/bottom/side safe insets. Narrow control rows wrap; compact landscape screens omit explanatory text. Preview handles fit within the remaining area and preview raster size has a total-pixel cap.

A tap outside the drag-highlighting palette consumes the dismissal gesture, including compatibility mouse input. It cannot also open chrome, turn a page or toggle a bookmark. Annotation page labels share a fixed icon column.

## Research references

These are design references, not newly bundled dependencies or copied implementation code:

- [pdfCropMargins](https://github.com/abarker/pdfCropMargins/blob/master/src/pdfCropMargins/main_pdfCropMargins.py): per-parity margins and order statistics for outliers. Motero already used robust parity profiles; this build retains them rather than adding a second engine.
- [KOReader's crop interface](https://github.com/koreader/koreader/blob/master/frontend/document/koptinterface.lua): cached automatic/semi-automatic bounds.
- [MuPDF's bbox device](https://github.com/ArtifexSoftware/mupdf/blob/master/source/fitz/bbox-device.c): measuring painted geometry independently of a page raster. Motero uses a narrower PDF.js text-only shortcut and retains raster analysis for graphics.
- [pdfplumber #843](https://github.com/jsvine/pdfplumber/issues/843): header/footer identification cannot generally be inferred from a universal fixed rectangle.
- [PDF.js #18148](https://github.com/mozilla/pdf.js/issues/18148): memory cleanup versus repeated parsing/rendering. This is an open discussion, not a shipped upstream fix adopted here.
- [Zotero Reader PR #261](https://github.com/zotero/reader/pull/261): geometric text-column fitting; no ready-made fix for Motero's header/footer detector was found.

The direct Zotero forum request remained blocked by HTTP 403 in the managed environment. This document does not claim a completed forum survey.

## Validation scope

Reader/native unit tests and real Chromium suites are release prerequisites. `crop-performance` checks the text-only path, graphics fallback, cold/warm work counts and directional entry in all three scrolling layouts. It reports local stage timings, stable-frame turn times and browser long tasks. These synthetic browser results do not establish physical BOOX speed, display latency or live account synchronization.

The protected release workflow additionally verifies production signing, embedded sources and API 31/35 updates from Builds 303 and 316 with data/UID retention and old-key refusal.
