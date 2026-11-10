# E-reader and stylus support

Build 319 adds **Settings → E-Reader and stylus**, also reachable from the reader's Appearance screen. These preferences are local to this installation. They do not change Zotero's annotation format, PDF files, cropping frames or reading-position data.

## Controls

- **E-Reader mode** is off by default. It strengthens interface contrast and removes navigation/dock transition durations, search-size animation and touch ripples. App and reader Light/Dark choices are preserved. The reader disables CSS fades/animations without changing saved annotation colors or the selected-color ring.
- **Stylus draws, fingers navigate** is on by default. A recognized Android stylus annotates; lifted-pen finger input can pan, swipe and pinch. Turn this off for deliberate finger drawing or a capacitive pen that Android reports as a finger. Such pens cannot provide reliable palm rejection.
- Native toolbars/sidebar controls reject individual palm contacts without intercepting or reconstructing the Android/WebView stream. Pen pressure and historical samples remain intact; a new pen can take over even after a guarded finger contact.
- While the pen is down, palm contacts cannot invoke annotation selection, bookmarks, edge turns, Jumped navigation, direct highlighting or crop peeking. Contacts involved in a stroke remain suppressed until release. New finger contacts are guarded for 300 ms after the pen lifts; ordinary scrolling has no added delay outside this interval.
- Physical eraser tips are recognized when the Android pointer stream identifies them. Pointer side buttons can use Primary or Secondary. Hardware key assignment is stored per input-device descriptor; volume/page keys and text editing stay reserved. **Hold** is the default; **Toggle** ignores key repeats. The transient eraser restores the base tool, color, width and stored eraser mode.
- Input diagnostics show tool type, button mask, pressure, hover and backend capability. They do not record stroke coordinates or document content. The annotation bridge no longer logs complete annotation payloads.

## Preserved reader behavior

The changes build on 1.0.3: continuous prepared crops, automatic/manual selection, fit references, responsive manual crop, centered short Jumped pages and directional entry into tall pages, SmartScroll/volume keys, narrow priority edge zones, two-finger overview/snap-back, centered-page bookmark toggling, black flags, annotation jump/delete/options, color rings without check marks, unified dock transitions, hidden-chrome full screen, theme-matched thumbnails/system bars, EPUB progress and text-size settings remain covered by regression tests. Build 319 retained its PDF.js/runtime pins; the separately tested engine update follows in Build 320.

## Upstream review

Review window: October 26–November 9, 2026, official GitHub source history. Source commits establish integration, not availability in an official Android store release.

| Upstream work | Motero integration |
| --- | --- |
| Android `63a4be89`, reader `266cd239` and `b10db207` | Preserve pen detection across tool changes; pointer ownership, pen takeover and release recovery in PDF/DOM/EPUB, adapted around Motero's priority gestures. |
| Reader `b3868010` | Weak position/transform cache for completed ink geometry. Active strokes and modified previews remain uncached. Existing coalesced samples, endpoints, frame batching and overlay reuse remain. Queued background crop/model analysis pauses during writing. |
| Android `f62ff0d2`, reader `a4e2ee0d` and `7276c54d` | Native add/edit/delete operations enter Reader history; pending comments flush before Undo/Redo. Queued immediate saves and restored IDs survive rapid erase/undo. History origin survives asynchronous batches; own echoes retain history and genuine external edits clear conflicting history. |
| Android `ee6f4392` | Dedicated blue selection-handle theme overlay, independent of reader/app Light/Dark combinations. |
| Reader `04795bfb` and Android-relevant parts of `9d180730` | Initialize DOM font family before restoring layout; retain Reading Mode appearance/scale without overwriting PDF position/zoom. Android already persists effective text scale locally. |
| Android `d87fafb5` and `a3113861` | Safe attachment replacement and duplicate-reader-session fixes already present in 318; retained, not reapplied. |

The PDF.js upgrade is delivered separately in [Build 320](PDFJS_UPDATE.md). TTS, desktop-only localization and draft pressure/grouped-annotation changes remain separate work. See [upstream credits](../UPSTREAM_CHANGES.md).

## Experimental BOOX boundary

The official [Onyx demo](https://github.com/onyx-intl/OnyxAndroidDemo) is Apache-2.0 licensed. This does **not** establish redistribution terms for an SDK AAR or support for InkSense on the Go Color 7 Gen II. No BOOX SDK binary, privileged refresh API or unvalidated native input backend is bundled or activated in this release.

A separately tested preview transaction/driver interface is prepared: crop/exclusion clipping, one commit per stroke, matching paint acknowledgment before clearing, and cleanup on close. Activation requires all of: a licensed SDK present, verified device compatibility, checked coordinates, explicit opt-in and a measured p95 latency improvement of at least 20%. This is an integration boundary, not a working TouchHelper backend. Real SDK binding, viewport transforms/paint acknowledgments and hardware latency measurements remain gated. Standard Android/WebView drawing is the shipping backend. Calling `invalidate()` is not advertised as a hardware E-Ink refresh.

Physical checks are still required on BOOX Go Color 7 Gen II/InkSense, a BOOX EMR model, another Android stylus device and Pixel 8/GrapheneOS without a digitizer. Browser/Android unit tests do not establish pen-to-pixel latency or live-account synchronization.
