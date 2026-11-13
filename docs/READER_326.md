# Motero 1.1 / Build 326

Technical version: `1.1.0-326`; public release title: **Motero 1.1**. The increasing Android version code, application ID, signing identity, PDF.js 5.7.330 and Zotero annotation/sync formats are retained.

## Controls and input

PDF and EPUB drag highlighting share a 200 ms hold threshold. Early swipes still cancel a pending hold. Page Turning now opens from global Reader Controls; returning from that screen restores the nested controls screen. Reader Controls and the long-press Stylus dialog use Zotero's existing settings items, dividers, CustomSwitch, typography, theme colors and connected choice buttons. Their labels/help are localized in English and German, and content scrolls within safe system insets.

The optional navigation protection now consumes Android system Back in the reader, in addition to requesting edge-gesture exclusions. It dismisses search, the sidebar or selection first; otherwise it reveals the reader controls. Modal dialogs and manual cropping keep their own Back handling. The explicit toolbar Back arrow remains available to leave the document. This addresses standard Android Back keys and gestures; vendor-specific BOOX behavior still needs physical verification.

EPUB bookmarking uses the upper-right half of the viewport in a top band of at least 64 CSS pixels or one eleventh of viewport height, matching PDF's broader corner convention. It remains independent of text margins and does not intercept a completed long-hold selection.

## Dock transitions and annotation layers

The bottom dock chooses transition order from actual source/target widths: expansion precedes the content swap, contraction follows it. This applies in both directions, including wide BOOX previews. Switching back to a smaller preview no longer clips the outgoing tools during contraction.

The shared quick palette is a fixed, isolated overlay attached to the document root after the page body, at the maximum stacking level. Page highlights and selection layers cannot paint or receive input above it. It retains the existing Zotero colors, shape and controls; the fix changes stacking rather than redesigning the palette.

EPUB notes resolve the actual pointer-down location each time, including touches without hover and presses after a stale hover preview. Text notes use a nonempty character range rather than the entire containing paragraph, so the CFI anchor follows the touched text through reflow. Image/annotation anchors keep their existing handling. Notes remain text-anchored EPUB annotations compatible with Zotero Desktop. Existing notes retain their saved anchors and can be moved with the existing touch-editing gesture.

## Content recognition and stable reading frames

The bounded raster pass now checks for a thin, long separator below a small running head and above body text. This supplies local evidence when the author/chapter changes and repetition alone is insufficient. Detached small author lists, German publisher download/license notices and closely aligned outer stars gain additional recognition. Include retains marginal symbols; Exclude removes them. Genuine body text, chapter headings and footnotes remain covered by retained negative/regression cases.

The numeric crop cache advances to generation 7 so older derived results cannot mask the improved detector. Annotations, PDFs and manual rectangles are untouched. Background learning no longer schedules a refit of an already applied reading frame or invalidates a visible prepared crop. It can refine offscreen provisional results, preventing late font-size/position changes while reading. Neighbor layout updates restore scroll offsets from a snapshot taken before changing the document extent; this prevents browser clamping from corrupting the screen anchor when the document shrinks. Explicit fitting and navigation still resolve their own geometry.

Recognition is geometric and evidence-based. The original Born/Leviathan files were not available in this session; generated PDF fixtures reproduce the shown running heads, separator, marginal stars, author list, folio and publisher strip. These tests do not establish perfect recognition of every PDF or reproduce every device-specific glyph-rendering issue.

## Verification

421 Reader cases in 49 files, 155 native cases in 37 suites, all 23 browser gates (including `crop-headers`) and 16 infrastructure checks pass locally. Test evidence is retained in [Build 326 evidence](../qa/build326/README.md). Production release requires the existing private-signature checks and Android API 31/35 updates from original 303 and preceding 325, including data/UID retention and old-key refusal. Physical BOOX/Pixel input, native animation appearance and live-account sync remain separate checks.
