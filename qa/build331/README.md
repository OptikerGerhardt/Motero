# Motero 1.1.5 / Build 331 verification

Larger next-page hint above PDF highlights: actual browser stacking, size, opacity and passive input verified.

Scope: content-sized/centered docks; safe bookmark offsets and landscape shortcut; pen highlighting with visible chrome; tablet Quick Tags/quote/search; single-resize sidebar transition and retained Reader layout; fitted annotation selection/Jump with cancellation.

443 Reader cases in 52 files pass. All 23 local browser suites pass for the full change; targeted features/refinements/edge/page-navigation suites additionally cover the final safe-inset fallback and matching shortcut. Actual pen input, cropped Jumped selection and pane-resize focus are exercised. Native geometry covers compact EPUB/PDF docks and adaptive Redo. 167 native tests in 42 suites pass; Unsigned APK build passes, with 120 unique embedded Reader/worker sources, all 207 pinned PDF.js and 45 runtime files matching. [Protected release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43760911330) passes signing and both Android update gates.

Update baseline: signed Build 330, SHA-256 60292fbe2b0764d52a39f870252ff7aab4512df2dd44ab0511c62b231246c98c. API 31/35 updates from 303 and 330 preserve data/UID, start the updated application and reject the old key. Published sources and APK were independently downloaded and verified.

Physical tablet/BOOX/Pixel UI, sidebar animation quality, rotation timing and live-account sync were not tested. No private document content is included. [Scope](../../docs/READER_331.md).

[Published release](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.1.5-331), application source `62a9763cb7ee6fcd92f42a990cb631cd00cfa88e`. All 23 CI browser suites, 43 core pixel cases, 19 official viewer cases and signing/update gates pass. Independent APK SHA-256 `f28d1ffe73a77b8b5261c26b706feda7ada2bc65da644d7074d991ef0eee5475`; private identity/rotation, non-debuggable Android-9+ manifest, receiver namespace, 117 main-bundle and 120 unique Reader/worker sources, all 207 engine/45 runtime files, 9633 archived sources and every release checksum match. Latest-release detection selects Build 331 with one APK. Anonymous access was not independently established because the managed proxy may supply credentials.
