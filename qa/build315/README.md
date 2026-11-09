# Build 315 / Motero 1.0 verification

Reader commit: `24cbc406763caeda648451248e9f61cf5517a041`.

Local validation before publication:

- 314 reader unit tests, 123 Android unit tests in 29 suites, and 13 Chromium browser suites passed.
- Eleven release-infrastructure/signing tests passed. Development APK built with the final reader bundle; this APK is not distributed.
- New browser regression uses real touch input for Jumped/Continuous in vertical, horizontal and wrapped layouts, including swipe/tap discrimination, two-finger overview, exact destination/fit restoration, and cleared touch state. It also covers wheel navigation without cropping.
- Redo crosses the Android bridge and restores the annotation through the existing undo history. Quick-palette selection uses a white inner ring.
- A 2500-page unit fixture guards against document-wide DOM updates during scroll and invisible neighbors taking the active page after a Wrapped reflow.

The release workflow must separately pass production signing, embedded-source verification, public-source audit and API 31/35 updates from Builds 303 and 314, retaining private data/UID and refusing old-key updates/internal permission access. Downloaded release reports will be recorded here after publication.

Native toolbar appearance, animations, status-bar behavior on physical BOOX/GrapheneOS devices, and live Zotero account synchronization are separate from the automated checks. No native visual pass is claimed; the local software emulator has an unresolved graphics-output problem documented in Build 314.
