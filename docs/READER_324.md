# Motero 1.0.9 / Build 324

This update implements the reader changes collected after Build 323. PDF.js 5.7.330, signing identity, original annotation coordinates and synchronization formats are unchanged.

## Selection and controls

PDF and EPUB hold-to-highlight share a 250 ms threshold (previously 450 ms). Early navigation gestures still cancel a hold; a second finger cancels selection. Native gesture-driven toolbar hiding stops before the hold can activate. Long-pressing the pen in the upper reader toolbar opens Stylus settings in a native dialog without replacing the WebView. A short tap still toggles annotation tools. The redundant Stylus row in Appearance is removed.

## EPUB frame and bookmarks

The EPUB WebView occupies the full reading area. Its safe default frame is applied inside EPUB layout, rather than by removing a fixed strip from the WebView. The top/bottom slider supports -20% to 15%; the default remains 3%, added to the symmetric system/footer clearance. Negative values can remove that clearance. Hide reading progress by tapping its footer when an unobstructed bottom edge is wanted. Opening/closing reader controls does not change the text frame.

The bookmark shortcut uses a 64 CSS-pixel viewport corner, independent of text margins. Black flags are larger, remain at 70% opacity and are positioned safely for visible anchors. Offscreen bookmark anchors are not moved onscreen. Annotation-list symbols retain full opacity.

The reported heading at the bottom of a page in the Kundera EPUB remains a book-specific observation pending comparison with another EPUB. No blanket override of publisher heading or chapter formatting is introduced.

## Page backgrounds

Appearance offers Default, Snow, Sepia, Dark and Black for PDFs and EPUBs, using Zotero Reader's existing desktop theme colors and rendering. The choice persists independently of the interface's Light/Dark/Automatic mode and is applied before document initialization. E-Reader mode ignores the extra page-background choice; leaving E-Reader mode restores it. Tests verify actual PDF canvas pixels as well as EPUB styles.

## Spreads and page fitting

Spreads and Page Fitting no longer disable each other in Android settings. Fit to Width, Height and Content use a common scale for each PDF pair, while automatic/manual crops remain page-local. Switching the live document schedules fitting without restoring stale pan coordinates. The spread rendering queue is refreshed without promoting a different partner page.

Short reading units are centered during fitting and overview restoration, including Continuous mode. Tall units still enter at the appropriate reading edge; ordinary scrolling remains free. Tests cover initial and live Odd/Even spread activation in vertical, horizontal and wrapped layouts, both axes of centering, manual crops and overview return.

## Continuous volume scrolling

Continuous volume-button navigation advances the configured fraction of the actual viewport along the document's scroll axis. It carries the step across page boundaries instead of stopping for a separate page turn. Horizontal uses the horizontal axis; vertical and wrapped use the vertical axis. Original crop layouts and their small page gaps remain. Jumped retains SmartScroll and reading-edge entry; zero-distance page-only input remains supported. Ordinary edge-tap navigation is unchanged.

## Two-column PDFs

Automatic Fit to Width relative to Text or Text + crop can fit a detected column on an individual PDF page. Spreads retain their paired-page fitting; explicit manual frames and full-page fitting remain explicit. A conservative detector requires substantial prose on both sides of a shared gutter, overlapping line regions and balanced widths. A raster fallback can detect clear scan gutters with repeated text-like row bands; it reuses the existing compact analysis plane without OCR or another render. Photos, empty pages, sparse lists and uncertain layouts fall back to the existing page fit.

Column fitting changes zoom/pan, retaining the original PDF coordinate plane and outer crop. SmartScroll reads left column, right column, then the next PDF page; backward navigation reverses that order. Continuous finger movement is bounded to the current column so an overshoot cannot skip the unread right column. A further boundary swipe changes columns. Column routing is inactive while fitting is off, in an overview or after selecting a manual frame.

This is geometric recognition, not semantic reflow: complex mixed layouts, irregular scans, wide illustrations and arbitrary column counts are not guaranteed. All original content remains accessible through normal zoom/pan. The numeric geometry cache is versioned separately from annotations and manual crop settings.

## Verification

411 Reader cases in 48 files and 149 native cases in 36 suites pass locally. Final actual results, browser logs, APK/source checks and API 31/35 update reports are recorded in [qa/build324](../qa/build324/README.md). Publication requires both updates from original 303 and signed 323 to preserve the private marker/UID and reject old-key updates.

Physical BOOX/Pixel touch and stylus behavior, native animation appearance, device-specific WebViews and live-account synchronization remain separate tests. No claim of measured physical-device latency or total process RAM is made.
