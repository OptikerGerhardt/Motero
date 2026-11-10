# Motero 1.0.4 / Build 319 verification

[Motero 1.0.4](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.4-319) is published. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42791143244) passed its complete build and release jobs.

Application source: `1237cedaa44daeb57861a88cdd2e2d9fcafafac0`. Reader: `b160afd08e47d431b306bd2ceb31aa23ed46fa7f`.

365 reader tests, 141 native tests in 34 suites and all 15 Chromium suites passed. The 14 existing crop/navigation/bookmark/tool/theme suites remain covered. New regressions include pen/palm ownership, barrel erasure, history-aware edits, exact-once focus-loss retention, mixed cancellation, post-pen guards and native control filtering without intercepting Android input.

The public APK was downloaded independently. SHA-256: `504a9ccfa5ad84a644bc32d83ded8a5af03a9ad3f886a41e5befcce68baf0a0b`. Production signing, restricted V3 rotation, receiver permission, non-debuggable manifest and Android-9+ requirement passed. All 101 embedded reader sources, 207 pinned PDF.js files and 45 runtime files match the checkout. Release checksums, immutable tag, all 9186 files of the full source archive and the public test archive were verified.

Both API 31/35 gates passed: updates from 303 and the actual signed 318 preserve private data and UID, start the app and reject old-key updates/internal permission access. Latest-release detection selects Build 319 with one APK. No independent anonymous-access claim is made because the managed proxy may supply credentials.

The first run 42784990191 stopped at its update gate without publication; run 42788850798 was cancelled during its build after an additional input repro. The final full run above passed all required gates. The gate retains actionable crash/activity diagnostics through the Checks API; no safety assertion was removed.

Physical BOOX/InkSense/EMR/GrapheneOS behavior, E-Ink latency and live account synchronization remain separate checks. No SDK-native BOOX renderer or hardware refresh is bundled; its experimental transaction/driver interface stays gated by licensing and actual device/latency proof. [Implementation and limits](../../docs/E_READER_AND_STYLUS.md).
