# Motero 1.0.10 / Build 325

This update implements the 15 reader points collected after Build 324. PDF.js 5.7.330, signing identity, PDF/EPUB annotation formats and synchronization data remain unchanged.

## Columns and continuous navigation

A detected right column keeps its own horizontal position when fitting, hardware navigation or overview return requests centering. The prepared page retains the selected column, including reverse entry on the previous page. Column reading now applies only to Jumped. Switching to Continuous discards column fitting and restores the whole text/page frame; switching back prepares column fitting again.

Continuous one-finger panning follows the selected scroll axis: horizontal for Horizontal, vertical for Vertical and Wrapped. Touch-action restrictions preserve two-finger zoom and are released for overview, crop editing and drawing tools. Hardware fractions continue across page boundaries; Jumped retains SmartScroll. Oversized-page browser tests exercise diagonal touches with actual cross-axis overflow.

## Header and blank-page geometry

In addition to learned repeated/parity bands, an isolated small top line with a separate outer Arabic folio can identify a changing running head locally. The existing raster pass removes an associated thin rule. Large chapter headings, ordinary text and Kant's Roman/edition gutter references remain protected by the existing evidence checks and include/exclude setting.

A blank page requires both an empty extracted text layer and a demonstrably white raster. A scan or illustration without OCR remains content. Empty inserts inherit the median physical reading frame of at most three nearby nonempty pages, rather than applying another page's relative crop to an unusually large media box. A single landscape insert therefore does not skew the representative frame. Automatic and manual crops, each fitting direction and shared spread scaling use that frame. The PDF coordinate plane, source PDF and saved manual rectangles remain intact. Neighbor work is bounded and reuses existing text, operator and geometry caches. Geometry-cache version 6 refreshes derived crops once; it does not clear annotations or manual crops.

## Appearance

One Appearance group offers Light, Snow, Sepia, Dark, Black and Automatic. The light/dark interface category follows the explicit paper choice. Automatic follows the operating system and remembers the last light-family and dark-family papers independently across restarts. Existing separately saved paper choices migrate into this selection. Page gutters, inter-page spaces and the host use the selected paper color as well.

E-Reader mode retains Light/Dark/Automatic controls and ignores the additional paper colors. Leaving E-Reader mode restores the saved paper choice unless the user explicitly changed it.

## Annotation controls

The expanded creation palette retains its own tool/color source when placing a note deactivates that creation tool. Deleting the note therefore leaves a populated color row; choosing a color can resume that tool. Area annotations retain Zotero Reader's eight standard colors. Black remains the extra ink/text color, matching the upstream desktop definitions rather than adding an incompatible area-only option.

PDF endpoint targets are at least 48 CSS pixels in each dimension; EPUB endpoints gain a transparent 44-pixel stroke around the slim visible grip. Overlapping targets resolve to the nearer endpoint. Native geometry, annotation identity, palette hide/restore and Undo remain unchanged.

## EPUB reading frame

The progress control is a fixed overlay in the EPUB document, below the quick annotation palette and above edge navigation. Its taps cycle the existing progress modes without turning a page. Native code sends display state only; neither hiding progress nor showing controls changes the text frame, pagination, font or CFI. The default symmetric system/footer clearance is constant across progress modes.

Black bookmark flags grow from a 32- to a 40-pixel SVG and move farther inside the right edge, retaining 70% opacity. The 64-pixel viewport-corner shortcut remains independent of text margins. Line height has 0.05 steps and a two-decimal value. The top/bottom margin slider ends at the screen-specific negative value that removes the safe inset, eliminating the unusable negative tail while retaining edge-to-edge reading. Saved older negative values still render safely.

The Kundera heading observation remains deferred for comparison with another EPUB; this update does not override publisher heading/page-break rules.

## Verification

414 Reader cases in 49 files, 153 native cases in 36 suites and all 22 browser suites pass locally. The local and protected release checks are recorded in [the Build 325 evidence](../qa/build325/README.md). They cover reader/native units, real Chromium touch input, unchanged PDF.js pixel/viewer cases and the signed API 31/35 update gates from original 303 and preceding 324.

Physical BOOX/Pixel input, device-specific WebViews, native animation appearance and live-account synchronization require separate device checks. Synthetic documents exercise the reported structures; no claim is made of testing the user's original PDFs or measuring physical-device latency/RAM.
