# Motero 1.1.4 / Build 330 verification

Scope: tablet navigation retention/session ownership; protected hardware Back/Escape; EPUB alignment, weight and balanced frame; adaptive Redo/color row; nonlinear pen widths; PDF crop shadows and passive viewport hints; pen-operated PDF/EPUB quick palettes.

437 Reader cases in 51 files pass. Browser tests use real Chromium pen down/up/click sequences, verify EPUB computed alignment/stroke and symmetric margins, crop shadows and noninteractive bookmark/next-page hints. Native tests cover old typography migration, preset widths and controller/key ownership. All 23 local browser suites, TypeScript and 43 engine pixel cases pass. The full native release build and 165 cases in 41 suites pass. Embedded reader sources and all pinned engine/runtime files match. Protected signing/update gates follow. Reader source: `3fec4826`.

The update baseline is signed Build 329, SHA-256 7cfd2fc3ec1bc61ca35ca55786ec7fd112f40a21116f232bfa02b85930a8fba1. Before publication, API 31/35 must preserve data/UID from 303 and 329 and reject the old key. Sources and published APK are independently verified after release.

No physical BOOX/Galaxy Tab S4/Pixel reproduction or live-account sync is claimed. No private PDF or extracted book content is included. [Scope and limits](../../docs/READER_330.md).
