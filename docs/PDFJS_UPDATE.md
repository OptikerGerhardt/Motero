# PDF.js update in Motero 1.0.5 / Build 320

The Android reader uses Zotero's PDF.js fork, pinned to the same commit as the official Zotero Reader at the time of this update: [`5f95f712bc629ac11159cb4859ed8091fdffa87b`](https://github.com/zotero/pdf.js/commit/5f95f712bc629ac11159cb4859ed8091fdffa87b), compiled as **5.7.330**. The previous pin was `3ec7e00205d95c512a8d74fefee5228611416d46`. [The two upstream commits](https://github.com/zotero/pdf.js/compare/3ec7e00205d95c512a8d74fefee5228611416d46...5f95f712bc629ac11159cb4859ed8091fdffa87b) provide:

- Region-based text coloring with contrast checks and conservative fallback for overlapping images, transparency and unsupported glyphs. Viewer recoloring preserves text selection and focus and rejects stale render results. Motero does not enable a new coloring UI or recolor existing annotations automatically.
- Correct handling of embedded bold/italic fonts: no additional synthetic styling on an already styled font. Separate semantic flags remain available to the text evaluator.

Only the three compiled JavaScript files in the pinned distribution change. The Zotero/Motero viewer stylesheet, compatibility prelude, all CMaps, fonts, WASM/ICC assets, licenses and the other 45 pinned runtime files remain identical. No cropping, gesture, annotation persistence or native stylus implementation is replaced.

## Rebuild and provenance

Ordinary CI validates and extracts `vendor/pdfjs-mobile.zip`; it does not rebuild the engine. For an intentional future engine upgrade:

1. Check out the chosen Zotero PDF.js commit in `reader/pdfjs/pdf.js`, with its full history. Install that checkout's locked dependencies and run `npx gulp generic` there. A shallow-history version fallback must not be used.
2. Run `python3 scripts/update_pdfjs_assets.py` from the Android repository. It preserves the mobile layout and compatibility prelude, includes licenses and writes a deterministic ZIP and hash manifest.
3. Run `python3 scripts/prepare_reader_assets.py`, then the normal reader/Android build and all regression gates. The submodule pin, compiled versions and individual hashes must agree before packaging.

## Regression gate

- All existing reader, native and Chromium suites remain mandatory, including cropping/fitting in all layouts, SmartScroll/Jumped navigation, manual cropping, bookmarks, light/dark thumbnails and toolbars, EPUB navigation and stylus/palm/history behavior.
- `reader/scripts/test-pdfjs-core.mjs` runs all 43 upstream text-color pixel tests against the exact shipped Android engine. Node receives DOMMatrix/ImageData/Path2D from a test-only Skia canvas. Its adapter retains and registers the PDF's real font bytes for native text drawing because Node lacks WebView's FontFaceSet. No upstream assertion is skipped or weakened.
- The additional `pdfjs-engine` Chromium suite runs the 19 official viewer tests, including cancellation, late render results, selection/focus and thumbnail/detail state. It then exercises the shipped client and real worker with synthetic PDFs and the already licensed, bundled Liberation Sans BoldItalic font. Embedded fonts must render without synthetic bold/italic; region-color glyph pixels must remain visible in light and dark themes.
- Five package-integrity tests reject mixed versions, stale source pins and omitted compatibility code even if file hashes were updated.
- The protected release requires signed update/data/UID/start checks on Android APIs 31 and 35, including the actual preceding Build 319, and rejection of the old public signing key.

Synthetic fixtures contain no personal PDFs or account data. Physical BOOX/GrapheneOS interaction, device-specific WebView behavior and live account synchronization require separate device testing. Automated checks cannot guarantee the absence of every defect.
