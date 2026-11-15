# Motero 1.1.4 / Build 330 verification

Scope: tablet navigation retention/session ownership; protected hardware Back/Escape; EPUB alignment, weight and balanced frame; adaptive Redo/color row; nonlinear pen widths; PDF crop shadows and passive viewport hints; pen-operated PDF/EPUB quick palettes.

437 Reader cases in 51 files pass. Browser tests use real Chromium pen down/up/click sequences, verify EPUB computed alignment/stroke and symmetric margins, crop shadows and noninteractive bookmark/next-page hints. Native tests cover old typography migration, preset widths and controller/key ownership. All 23 local browser suites, TypeScript and 43 engine pixel cases pass. The full native release build and 165 cases in 41 suites pass. Embedded reader sources and all pinned engine/runtime files match. [Protected release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43724146838) passes signing and both Android update gates. Reader source: `3fec4826`.

The update baseline is signed Build 329, SHA-256 7cfd2fc3ec1bc61ca35ca55786ec7fd112f40a21116f232bfa02b85930a8fba1. API 31/35 preserve data/UID from 303 and 329, start the updated application and reject the old key. Sources and published APK were independently downloaded and verified.

No physical BOOX/Galaxy Tab S4/Pixel reproduction or live-account sync is claimed. No private PDF or extracted book content is included. [Scope and limits](../../docs/READER_330.md).

[Published release](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.1.4-330), application source `df4e68b8ec21149582990530f3e335eb0cad8254`. All 23 CI browser suites, 43 core pixel cases, 19 official viewer cases and signing/update gates pass. Independent APK SHA-256 `60292fbe2b0764d52a39f870252ff7aab4512df2dd44ab0511c62b231246c98c`; private identity/rotation, non-debuggable Android-9+ manifest, receiver namespace, 116 main-bundle and 119 unique Reader/worker sources, all 207 engine/45 runtime files, 9615 archived sources and every release checksum match. Latest-release detection selects Build 330 with one APK. Anonymous access was not independently established because the managed proxy may supply credentials.
