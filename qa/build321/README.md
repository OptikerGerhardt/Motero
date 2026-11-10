# Motero 1.0.6 / Build 321 verification

[Motero 1.0.6](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.6-321) is published. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42911476446) passed its complete build and release jobs.

Application source: `6b11d120ddb18a04023e568afaf56aee805a7fcb`. Reader: `319575841df017bd8f567b18b7181c6818f8e9f3`. Zotero PDF.js: `5f95f712bc629ac11159cb4859ed8091fdffa87b`, version 5.7.330, unchanged in this release.

378 reader tests, 43 additional engine pixel cases, 144 native tests in 35 suites and all 18 Chromium suites passed. The engine browser gate includes 19 official viewer cases and actual bundled worker/font rendering in light and dark themes. Engine-integrity, publication, build-reuse and production-key/receiver guards also passed.

Real-touch regressions cover PDF highlight/underline/area/note editing and EPUB range resizing/note re-anchoring, preserving IDs and Undo. EPUB checks exercise the shared palette, upper-right bookmark toggling, phone margins and stable center-tap/focus-return positions in both flows. Existing crop, manual crop, SmartScroll/Jumped, stylus, dock/theme and PDF.js suites remain covered. [Scope and implementation](../../docs/READER_NEXT_UPDATE.md).

The public APK was downloaded independently. SHA-256: `c3b2bb0427ca601cc0ccc7fce44bd05e4b47d860d1f7c4478afdc0cf1af3d988`. Production signing, restricted V3 rotation, receiver permission, non-debuggable manifest and Android-9+ requirement passed. All 104 embedded reader sources, 207 unchanged engine files and 45 unchanged runtime files match the checkout. Release checksums, immutable tag, all 9267 source archive files and public test reports were verified.

Both API 31/35 gates passed: updates from 303 and the actual signed 320 preserve private data and UID, start the app and reject old-key updates/internal permission access. Latest-release detection selects Build 321 with exactly one APK. No independent anonymous-access claim is made because the managed proxy may supply credentials.

Physical BOOX/GrapheneOS input, device-specific WebViews, native animation appearance, live Zotero synchronization and exact behavior of personal PDFs remain separate tests.
