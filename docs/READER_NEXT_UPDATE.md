# Reader improvements — Build 321 / Motero 1.0.6

Scope authorized in the conversation. Preserve PDF.js 5.7.330, annotation/sync formats, signing identity and all existing crop/navigation/stylus regressions.

- [x] Long-press editing with usable touch/stylus handles: highlight/underline endpoints, area corners/edges, note movement; read-only and normal page gestures remain protected.
- [x] Automatic cropping: isolated marginal stars/dots follow Include/Exclude while body punctuation and footnote markers stay intact.
- [x] Text versus Text + crop: width fitting retains full page height for Text; height fitting retains full page width. Text + crop removes both outer axes; manual fitting keeps the explicit frame. Both choices use the same detected content and fitted scale.
- [x] EPUB uses the PDF-style direct drag highlight and shared quick palette.
- [x] EPUB bookmarks appear at the upper right, as black flags (70% on content, opaque in the list), preserving standard CFI anchors and toggle/delete behavior.
- [x] EPUB chrome is floating: top controls and bottom annotation tools, no thumbnail dock; show/hide preserves text layout and position; status bar and its theme-matched opaque background disappear in fullscreen.
- [x] Fix EPUB blur/position drift on center taps, app focus/resume and fast reflow/navigation.
- [x] E-Reader mode and Android/direct text-selection choice in global settings; stylus quick settings retained at the bottom of Appearance.
- [x] Optional system Back edge-gesture exclusion scoped to the reader, within Android's supported exclusion limits.
- [x] Volume-key ordinary list scrolling in Collections, protected during text input/dialogs and respecting the existing hardware-navigation preference.
- [x] Remove Reading Progress section from Appearance; retain bottom-tap cycling and persistence.
- [x] Replace misleading Page width presets by a real Margins slider, usable on narrow phones and wide readers, preserving logical reading position.
- [x] Downloaded Files filter footer respects navigation/gesture insets and rounded-corner clearance.
- [x] Modest EPUB comfort/stability additions: book/system font choices, robust anchor retention, bounded work and stale-operation protection where reproduced; no engine replacement or TTS in this package.
- [ ] Full reader/native/browser regressions, signed API 31/35 updates, immutable APK release, independently verified download and sources.


The shared EPUB palette supports the existing highlight, underline and CFI-anchored note formats. It does not introduce PDF ink/eraser annotations into reflowing EPUBs. Long-press editing preserves IDs and uses the normal annotation manager and Undo history.

EPUB reserves a constant footer and navigation inset so toggling reader chrome or progress cannot change pagination. Android resize no longer applies a temporary scale/blur mask; focus return clears stale masks without navigating to an old anchor. Font reflow restores its anchor only if the request is still current. Gesture analysis is bounded to the containing paragraph (256 nodes / 20,000 characters) and at most once per display frame, with a final synchronous endpoint update.

Cropping reuses the existing bounded analysis queue, adjacent-page preparation and numeric geometry cache. The cache version changes for the revised marginal-symbol classification; annotation/PDF data and manual crop coordinates are unchanged.

Physical BOOX/Pixel interaction, vendor-specific stylus behavior, native animation appearance and live Zotero account synchronization require separate testing. Browser fixtures are synthetic and do not prove the supplied personal PDFs render perfectly.
