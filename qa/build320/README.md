# Motero 1.0.5 / Build 320 verification

PDF.js is pinned to Zotero commit `5f95f712bc629ac11159cb4859ed8091fdffa87b` (5.7.330). Only the three compiled JavaScript files change in the engine distribution; licenses, fonts, CMaps, WASM/ICC, compatibility code and other runtime packages remain unchanged.

Local checks passed: 365 reader tests, 43 additional engine pixel tests, 141 native tests in 34 suites, all 16 Chromium suites (including 19 upstream viewer cases), five engine-integrity cases and the signing/receiver guard tests. The APK builds successfully; its 101 embedded reader sources, 207 engine files and 45 runtime files match the checkout. Test-only canvas/Jasmine dependencies are absent from the shipped reader.

Production signing, API 31/35 update/data-retention/old-key refusal gates and independent public-download verification are still pending before this document claims a released APK. See [engine update and test scope](../../docs/PDFJS_UPDATE.md).

Physical BOOX/GrapheneOS behavior and live account synchronization remain separate tests.
