# Incorporated upstream contributions

Reviewed on November 8, 2026 against Git history and GitHub pull-request metadata. Original authorship and co-author notices are preserved. The statement that Motero's own changes were programmed with ChatGPT/Codex does not attribute these upstream contributions to ChatGPT.

| Contribution | Inclusion in Motero | Upstream status at review |
| --- | --- | --- |
| [Zotero Android #298 — Add volume buttons zoom](https://github.com/zotero/zotero-android/pull/298) | PR head `83a96c3e` is included through merge `ecb3f171` of `add_volume_buttons_zoom`. Motero further adapts hardware-button behavior. | Open; not merged upstream. |
| [Zotero Android #353 — Fit to Content](https://github.com/zotero/zotero-android/pull/353) | PR revision `f5ff0a91` is included through merge `c826f975` and subsequently extended for Motero. | Open; not merged upstream. |
| [Zotero Android #348 — Hide toolbars on edge taps](https://github.com/zotero/zotero-android/pull/348) | Upstream merge `1faa4de7` is an ancestor of Motero's Android revision. | Merged upstream. |
| [Zotero Reader #254 — Preserve position across scroll-mode changes](https://github.com/zotero/reader/pull/254) | Upstream merge `2a0bc655` is included in the reader history. | Merged upstream. |
| [Zotero Reader #256 — Zoom and position offsets during navigation](https://github.com/zotero/reader/pull/256) | Upstream merge `a94045fe` is included; Motero extends navigation behavior. | Merged upstream. |
| [Zotero Reader #260 — Fit to Content](https://github.com/zotero/reader/pull/260) | Its content-fitting work forms a basis for Motero's extended fitting geometry. | Open; not merged upstream. |
| [Zotero Reader #263 — Preserve short ink strokes and reduce handwriting redraw work](https://github.com/zotero/reader/pull/263) | Build 311 contains targeted Motero adaptations informed by AI-Kyo-er’s PR: short strokes/endpoints, coalesced samples, frame batching and overlay reuse. The complete PR was not merged. | Open; not merged upstream. |

Inclusion in Motero does not mean a change has been merged into official Zotero. Not every PR linked in the feature plan was incorporated: some are research references or approaches that were later implemented independently. For example, Android #205 is a reference for attachment sharing; Motero uses its own adaptations of the current downloader and FileProvider.

Thank you to the authors, reviewers, maintainers, and the wider Zotero community. Copyright and license notices in the original sources remain authoritative.

## Build 319: selected stability and pen fixes

Reviewed against official source history for October 26–November 9, 2026. These are targeted adaptations into Motero, not a wholesale upstream merge. Original authors include **Martynas Bagdonas** (Reader) and **Dima** (Android); their existing copyright/license notices remain intact.

- [Reader pen detection](https://github.com/zotero/reader/commit/266cd23928767aba8aaaaad579e7bcfc4772bdaf) and [pointer ownership/release](https://github.com/zotero/reader/commit/b10db2071013d3c8b8db86e28c657621d75d8620), plus [Android tool transition](https://github.com/zotero/zotero-android/commit/63a4be89e5d06ec565d79e1b236f866d6fd7739c): adapted to PDF, DOM/EPUB and Motero priority gestures.
- [Completed ink path cache](https://github.com/zotero/reader/commit/b38680100114346012230efa56350cfaae57be91), including upstream transform/live-stroke regression cases.
- [History-aware Reader commands](https://github.com/zotero/reader/commit/a4e2ee0d7ff693d217a2e6266642a222a62bb98c), [deletion/save history](https://github.com/zotero/reader/commit/7276c54deab72378b0e5656891c4f46c9fb0b019) and [Android Undo/Redo integration](https://github.com/zotero/zotero-android/commit/f62ff0d2afaf27d1fcd1a5827e745d814bde6e7e): retain Motero's dock and long-press Redo; extend queued-history metadata and comment preservation.
- [Android selection-handle contrast](https://github.com/zotero/zotero-android/commit/ee6f4392362f0d1f44b02f2c3e604c96d34eae48).
- [Reading Mode font initialization](https://github.com/zotero/reader/commit/04795bfbafd55600e042d62e05f9a4147458ae53); Android-relevant appearance/scale retention informed by [9d180730](https://github.com/zotero/reader/commit/9d18073090a3bb54079fb9146aeb9677a8149c36).

The already included Android download/session fixes are retained. The official BOOX demo is a research reference; no SDK binary or unverified low-latency renderer is included. [Integration and remaining device gates](docs/E_READER_AND_STYLUS.md).
