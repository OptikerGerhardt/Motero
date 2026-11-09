# Build 315 / Motero 1.0 verification

Reader commit: `80a4cf6695e18faac38fe418623903c742ab7641`.

Local validation before publication:

- 314 reader unit tests, 123 Android unit tests in 29 suites, and 13 Chromium browser suites passed.
- Eleven release-infrastructure/signing tests passed. Development APK built with the final reader bundle; this APK is not distributed.
- New browser regression uses real touch input for Jumped/Continuous in vertical, horizontal and wrapped layouts, including swipe/tap discrimination, centering the reading page when enabling Jumped, two-finger overview, exact destination/fit restoration, and cleared touch state. It also covers wheel navigation without cropping.
- Redo crosses the Android bridge and restores the annotation through the existing undo history. Quick-palette selection uses a white inner ring.
- A 2500-page unit fixture guards against document-wide DOM updates during scroll and invisible neighbors taking the active page after a Wrapped reflow.

The [release workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/42608990281) passed production signing, embedded-source verification, public-source audit and API 31/35 updates from Builds 303 and 314, retaining private data/UID and refusing old-key updates/internal permission access. Its public test archive independently confirms 314 reader tests, 123 native tests and all 13 browser suites.

[Motero 1.0](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-315) was downloaded independently and verified against its public asset digest, checksums and migration reports. APK SHA-256: `9ff51d3cf40791e98a021cddd23286a61123d013f60dac8e0d4142c932ba62cf`. The pinned private signing identity, receiver permission, all 99 reader sources, 207 PDF.js files and 45 runtime files match. The latest-release API returns this APK for Obtainium and the repository visibility is public. The managed proxy returns authorized drafts even without a client Authorization header, so this check does not independently establish anonymous API behavior.

The release's source commit is `6f44539324d6794cd3de194fdd01100fa751c671`. Reports in this directory describe the actual published APK, not the local development build.

Native toolbar appearance, animations, status-bar behavior on physical BOOX/GrapheneOS devices, and live Zotero account synchronization are separate from the automated checks. No native visual pass is claimed; the local software emulator has an unresolved graphics-output problem documented in Build 314.

All nine earlier public releases are now named Alpha and marked as prereleases. Both archived drafts retain their original release tags and draft status. `release-labels.json` verifies each public tag against its original release commit and checks unchanged APK/source asset IDs and digests and release notes. 1.0 remains the latest stable release.
