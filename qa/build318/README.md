# Motero 1.0.3 / Build 318 verification

[Motero 1.0.3](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.3-318) is published. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42708855081) passed its build and release jobs.

Application source commit: `a4ca1dc9da11b385958c7b16b2e4c31046c5a6b5`. Reader commit: `e215e5bfb420ea562f4c1c8f7154fabdb6740376`.

333 reader unit tests, 125 native release tests in 30 suites, and all 14 Chromium suites passed. The added regression fails against Build 317 and confirms that a newly detected reference mask is repainted even when its page-frame geometry is unchanged. The correction retains incremental drawing and optimized layout writes. All crop/UI/scrolling improvements from Build 317 are included.

The published APK was downloaded independently. SHA-256: `46b2430a47b362577717f51cfc37541733bce1f636b20bd5ab40477893e2cc3e`. Production signing, restricted V3 rotation, receiver permission, non-debuggable manifest and Android-9+ requirement passed verification. All 100 embedded reader sources, 207 pinned PDF.js files and 45 runtime files match. Downloaded checksums and the public test archive were verified.

Both API 31/35 update reports pass: update from Build 303 and from the actual signed Build 317 preserves private test data and UID, starts the updated app, rejects old-key updates, and denies an old-key client's internal permission. The latest-release API selects Build 318 with one APK. No independent anonymous-access claim is made because the managed proxy may supply credentials.

Physical BOOX/Pixel behavior, e-ink latency and live account sync remain separate tests. The original Kant/Fuchs PDFs shown in screenshots were not available; matching synthetic crop cases are covered. Browser regression and timing results do not establish physical e-reader latency.
