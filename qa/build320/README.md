# Motero 1.0.5 / Build 320 verification

[Motero 1.0.5](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.5-320) is published. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42820804089) passed its complete build and release jobs.

Application source: `3cd29ee1dea387d14226dbe9a608b67c328da9b9`. Reader: `ad0d6bae922d3a3d6d35beb31f54b1c54adbb638`. Zotero PDF.js: `5f95f712bc629ac11159cb4859ed8091fdffa87b`, version 5.7.330.

365 reader tests, 43 additional engine pixel cases, 141 native tests in 34 suites and all 16 Chromium suites passed. The additional engine browser gate includes 19 official viewer cases and actual bundled worker/font rendering in light and dark themes. Five engine-integrity cases reject mixed/stale packages; production-key and receiver guards also passed. No upstream pixel/DOM assertion was skipped or weakened.

Only the three compiled JavaScript files in the engine distribution change. Fonts, CMaps, WASM/ICC, licenses, Android compatibility code, the Zotero/Motero viewer stylesheet and the other 45 runtime files remain identical. All existing crop/fitting/navigation/bookmark/tool/theme/EPUB/stylus suites remain covered. Test-only canvas/Jasmine dependencies are absent from the shipped reader.

The public APK was downloaded independently. SHA-256: `d64af94d57619a934813480da04e32c97a3506fa9cb3e49ebda6544a83815101`. Production signing, restricted V3 rotation, receiver permission, non-debuggable manifest and Android-9+ requirement passed. All 101 embedded reader sources, 207 engine files and 45 runtime files match the checkout. Release checksums, immutable tag, all 9223 files in the source archive and the public test archive were verified.

Both API 31/35 gates passed: updates from 303 and the actual signed 319 preserve private data and UID, start the app and reject old-key updates/internal permission access. Latest-release detection selects Build 320 with exactly one APK. No independent anonymous-access claim is made because the managed proxy may supply credentials.

Physical BOOX/GrapheneOS behavior, device-specific WebViews and live account synchronization remain separate tests. [Update, provenance and test scope](../../docs/PDFJS_UPDATE.md).
