# Bundled runtime packages

Motero's reader is built from its source. The pinned mobile PDF.js distribution is supplied separately as `pdfjs-mobile.zip`. `pdfjs-mobile.json` records its source commit, archive hash, and individual file hashes; `scripts/prepare_reader_assets.py` verifies and extracts it before Webpack runs.

PDF.js is pinned to Zotero's `5f95f712bc629ac11159cb4859ed8091fdffa87b` (5.7.330). Preparation also verifies that the submodule pin, compiled client/worker/viewer versions and Android compatibility preludes match. See [engine update notes](../docs/PDFJS_UPDATE.md) for rebuilding the package and the regression gate.

`runtime-assets.json` records the Android runtime files retained from the verified Build 305 baseline. Their source revisions are pinned as public submodules, and the existing `scripts/bundle_*` scripts document the original packaging process. These pinned inputs do not imply that complete APKs are byte-for-byte reproducible.

When updating a dependency, update its sources, licenses, packages, and manifests together and run the relevant reader and Android regression tests. Ordinary changes to Motero's reader do not require rebuilding PDF.js or the other runtime packages.
