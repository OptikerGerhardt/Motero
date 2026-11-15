# Motero 1.1.5 / Build 331 verification

Larger next-page hint above PDF highlights: actual browser stacking, size, opacity and passive input verified.

Scope: content-sized/centered docks; safe bookmark offsets and landscape shortcut; pen highlighting with visible chrome; tablet Quick Tags/quote/search; single-resize sidebar transition and retained Reader layout; fitted annotation selection/Jump with cancellation.

443 Reader cases in 52 files pass. All 23 local browser suites pass for the full change; targeted features/refinements/edge/page-navigation suites additionally cover the final safe-inset fallback and matching shortcut. Actual pen input, cropped Jumped selection and pane-resize focus are exercised. Native geometry covers compact EPUB/PDF docks and adaptive Redo. 167 native tests in 42 suites pass; Unsigned APK build passes, with 120 unique embedded Reader/worker sources, all 207 pinned PDF.js and 45 runtime files matching. Protected release checks follow.

Update baseline: signed Build 330, SHA-256 60292fbe2b0764d52a39f870252ff7aab4512df2dd44ab0511c62b231246c98c. Publication requires API 31/35 updates from 303 and 330 with data/UID retention, startup and old-key refusal. Published sources and APK are independently downloaded and verified.

Physical tablet/BOOX/Pixel UI, sidebar animation quality, rotation timing and live-account sync were not tested. No private document content is included. [Scope](../../docs/READER_331.md).
